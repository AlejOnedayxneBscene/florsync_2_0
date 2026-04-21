import time
import signal
import sys
import threading
from pathlib import Path
from datetime import datetime, timezone

from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection
from supabase import create_client

# Configuración de rutas
WAL_DIR            = Path('/wal-archive')
STATE_FILE         = Path('/wal-archive/last_wal_upload.txt')
SPECIAL_STATE_FILE = Path('/wal-archive/last_special_upload.txt')
POLL_INTERVAL      = 30

def force_wal_switch():
    with connection.cursor() as cursor:
        cursor.execute("SELECT pg_switch_wal();")

def get_wal_names() -> list[str]:
    if not WAL_DIR.exists():
        return []
    return sorted([
        f.name for f in WAL_DIR.iterdir()
        if f.is_file() and (
            len(f.name) == 24 or
            f.name.endswith('.history') or
            '.backup' in f.name
        )
    ])

def get_current_timeline() -> str:
    """Obtiene el Timeline ID actual de PostgreSQL en formato Hex (8 chars)"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT timeline_id FROM pg_control_checkpoint();")
            row = cursor.fetchone()
            if row:
                return f"{int(row[0]):08X}"
    except Exception as e:
        print(f"[WAL] No se pudo obtener timeline de PG: {e}")

    # Fallback: intentar deducir del nombre del último WAL
    wals = [f for f in get_wal_names() if len(f) == 24]
    return wals[-1][:8] if wals else "00000001"

def wait_for_recovery_complete():
    print("[WAL] Esperando que PostgreSQL complete recovery...")
    for _ in range(60):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_is_in_recovery();")
                en_recovery = cursor.fetchone()[0]
                if not en_recovery:
                    print(f"[WAL] PostgreSQL listo. Timeline: {get_current_timeline()}")
                    return
        except Exception:
            pass
        time.sleep(2)
    print("[WAL] Timeout esperando recovery, continuando...")

def get_last_uploaded() -> str:
    current_tl = get_current_timeline()
    if not STATE_FILE.exists():
        return ""

    last = STATE_FILE.read_text().strip()
    if not last:
        return ""

    # Si el timeline guardado es diferente al actual, reiniciamos el rastreo
    if last[:8] != current_tl:
        print(f"[WAL] ⚠ Cambio de Timeline detectado ({last[:8]} -> {current_tl}). Reseteando puntero.")
        return ""
    return last

def get_uploaded_specials() -> set:
    if not SPECIAL_STATE_FILE.exists():
        return set()
    return set(SPECIAL_STATE_FILE.read_text().strip().splitlines())

def save_uploaded_special(name: str):
    uploaded = get_uploaded_specials()
    uploaded.add(name)
    SPECIAL_STATE_FILE.write_text("\n".join(sorted(uploaded)))

def wait_for_new_wal(previous_last: str, stop_event: threading.Event, timeout: int = 60) -> str | None:
    start = time.time()
    while time.time() - start < timeout:
        wals = [f for f in get_wal_names() if len(f) == 24]
        if wals and wals[-1] != previous_last:
            return wals[-1]
        if stop_event.wait(timeout=2):
            break
    return None

class Command(BaseCommand):
    help = 'Sube WAL a Supabase organizados por Timeline para Florsync 2.0'

    def rotate_and_upload(self, client, bucket, stop_event: threading.Event, context: str = ""):
        prefix = f"[WAL{' ' + context if context else ''}]"
        
        last_local = [f for f in get_wal_names() if len(f) == 24]
        last_local = last_local[-1] if last_local else ""

        self.stdout.write(f"{prefix} Forzando rotación de WAL...")
        force_wal_switch()

        nuevo = wait_for_new_wal(last_local, stop_event)
        if nuevo:
            self.stdout.write(f"{prefix} Nuevo WAL generado: {nuevo}")
        
        return self.upload_pending(client, bucket, prefix)

    def upload_pending(self, client, bucket, prefix: str = "[WAL]") -> int:
        current_tl = get_current_timeline()
        last_wal   = get_last_uploaded()
        now        = datetime.now(timezone.utc)
        
        # --- ESTRUCTURA DE CARPETAS ---
        # WALs específicos van en su subcarpeta de timeline
        folder_wal     = now.strftime(f'base/%Y/%m/wal/{current_tl}')
        # .history y .backup van en la raíz de /wal/ para que el restore los vea siempre
        folder_special = now.strftime('base/%Y/%m/wal')
        
        uploaded_specials = get_uploaded_specials()

        # Filtrar solo archivos del timeline actual que sean nuevos
        wal_files = sorted([
            f for f in WAL_DIR.iterdir()
            if f.is_file()
            and len(f.name) == 24
            and f.name.startswith(current_tl)
            and f.name > last_wal
        ])

        # Archivos .history y .backup (críticos para el árbol de timelines)
        special_files = sorted([
            f for f in WAL_DIR.iterdir()
            if f.is_file()
            and (f.name.endswith('.history') or '.backup' in f.name)
            and f.name not in uploaded_specials
        ])

        # Unir listas con sus destinos correspondientes
        queue = [(f, folder_special) for f in special_files] + \
                [(f, folder_wal) for f in wal_files]

        if not queue:
            return 0

        self.stdout.write(f"{prefix} Subiendo {len(queue)} archivos a Supabase...")
        subidos = 0

        for archivo, folder in queue:
            try:
                remote_path = f"{folder}/{archivo.name}"
                with open(archivo, 'rb') as f:
                    client.storage.from_(bucket).upload(
                        path=remote_path,
                        file=f,
                        file_options={
                            'content-type': 'application/octet-stream',
                            'x-upsert': 'true',
                        },
                    )
                
                self.stdout.write(f"  ✓ {archivo.name} -> {folder}")
                
                # Actualizar estados locales
                if len(archivo.name) == 24:
                    STATE_FILE.write_text(archivo.name)
                else:
                    save_uploaded_special(archivo.name)
                subidos += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ✗ Error en {archivo.name}: {e}"))
                if len(archivo.name) == 24: break

        return subidos

    def handle(self, *args, **options):
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        bucket = settings.SUPABASE_BACKUP_BUCKET
        stop_event = threading.Event()

        def do_shutdown():
            self.stdout.write("\n[SHUTDOWN] Rotando y subiendo últimos cambios...")
            try:
                self.rotate_and_upload(client, bucket, stop_event, context="FINAL")
            finally:
                sys.exit(0)

        def shutdown_handler(signum, frame):
            if not stop_event.is_set():
                stop_event.set()
                threading.Thread(target=do_shutdown, daemon=True).start()

        signal.signal(signal.SIGTERM, shutdown_handler)
        signal.signal(signal.SIGINT, shutdown_handler)

        wait_for_recovery_complete()

        # Carga inicial (catch-up)
        self.stdout.write(f"[INICIO] Timeline: {get_current_timeline()}")
        self.upload_pending(client, bucket, prefix="[INICIO]")

        self.stdout.write(f"[READY] Monitoreando cada {POLL_INTERVAL}s...")
        while not stop_event.is_set():
            if stop_event.wait(timeout=POLL_INTERVAL):
                break
            try:
                self.upload_pending(client, bucket)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"[LOOP ERROR] {e}"))