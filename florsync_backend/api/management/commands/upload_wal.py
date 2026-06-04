import time
import signal
import sys
import threading
import httpx
from pathlib import Path
from datetime import datetime, timezone

from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection

# Configuración de rutas
WAL_DIR            = Path('/wal-archive')
STATE_FILE         = Path('/wal-archive/last_wal_upload.txt')
SPECIAL_STATE_FILE = Path('/wal-archive/last_special_upload.txt')
POLL_INTERVAL      = 30

# Reintentos para uploads
UPLOAD_TIMEOUT = 120        # segundos por intento
UPLOAD_RETRIES = 4
UPLOAD_BACKOFF = [5, 15, 30, 60]

# ---------------------------------------------------------------------------
# Helpers de PostgreSQL / WAL local
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Upload con reintentos y timeout (httpx directo, sin SDK)
# ---------------------------------------------------------------------------

def upload_file(supabase_url: str, supabase_key: str, bucket: str,
                remote_path: str, local_path: Path) -> None:
    """
    Sube un archivo a Supabase Storage con timeout y reintentos automáticos.
    Usa httpx directamente para controlar el timeout (el SDK no lo expone).
    Lanza excepción si todos los intentos fallan.
    """
    url = f"{supabase_url}/storage/v1/object/{bucket}/{remote_path}"
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "apikey": supabase_key,
        "x-upsert": "true",
    }

    last_err = None
    for attempt in range(1, UPLOAD_RETRIES + 1):
        try:
            data = local_path.read_bytes()
            with httpx.Client(timeout=UPLOAD_TIMEOUT) as http:
                resp = http.put(
                    url,
                    content=data,
                    headers={**headers, "Content-Type": "application/octet-stream"},
                )
                resp.raise_for_status()
            return  # éxito
        except Exception as e:
            last_err = e
            wait = UPLOAD_BACKOFF[attempt - 1] if attempt <= len(UPLOAD_BACKOFF) else 60
            print(f"    ⚠️  intento {attempt}/{UPLOAD_RETRIES} fallido: {e}")
            if attempt < UPLOAD_RETRIES:
                print(f"    ↻  reintentando en {wait}s...")
                time.sleep(wait)

    raise RuntimeError(
        f"No se pudo subir {local_path.name} tras {UPLOAD_RETRIES} intentos: {last_err}"
    )

# ---------------------------------------------------------------------------
# Management command
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = 'Sube WAL a Supabase organizados por Timeline para Florsync 2.0'

    def rotate_and_upload(self, stop_event: threading.Event, context: str = ""):
        prefix = f"[WAL{' ' + context if context else ''}]"

        last_local = [f for f in get_wal_names() if len(f) == 24]
        last_local = last_local[-1] if last_local else ""

        self.stdout.write(f"{prefix} Forzando rotación de WAL...")
        force_wal_switch()

        nuevo = wait_for_new_wal(last_local, stop_event)
        if nuevo:
            self.stdout.write(f"{prefix} Nuevo WAL generado: {nuevo}")

        return self.upload_pending(prefix=prefix)

    def upload_pending(self, prefix: str = "[WAL]") -> int:
        supabase_url = settings.SUPABASE_URL
        supabase_key = settings.SUPABASE_SERVICE_KEY
        bucket       = settings.SUPABASE_BACKUP_BUCKET

        current_tl = get_current_timeline()
        last_wal   = get_last_uploaded()
        now        = datetime.now(timezone.utc)

        # --- ESTRUCTURA DE CARPETAS ---
        folder_wal     = now.strftime(f'base/%Y/%m/wal/{current_tl}')
        folder_special = now.strftime('base/%Y/%m/wal')

        uploaded_specials = get_uploaded_specials()

        # WALs del timeline actual que sean nuevos
        wal_files = sorted([
            f for f in WAL_DIR.iterdir()
            if f.is_file()
            and len(f.name) == 24
            and f.name.startswith(current_tl)
            and f.name > last_wal
        ])

        # .history y .backup aún no subidos
        special_files = sorted([
            f for f in WAL_DIR.iterdir()
            if f.is_file()
            and (f.name.endswith('.history') or '.backup' in f.name)
            and f.name not in uploaded_specials
        ])

        queue = [(f, folder_special) for f in special_files] + \
                [(f, folder_wal) for f in wal_files]

        if not queue:
            return 0

        self.stdout.write(f"{prefix} Subiendo {len(queue)} archivos a Supabase...")
        subidos  = 0
        failures = 0

        for archivo, folder in queue:
            remote_path = f"{folder}/{archivo.name}"
            try:
                upload_file(supabase_url, supabase_key, bucket, remote_path, archivo)
                self.stdout.write(f"  ✓ {archivo.name} -> {folder}")

                if len(archivo.name) == 24:
                    STATE_FILE.write_text(archivo.name)
                else:
                    save_uploaded_special(archivo.name)
                subidos += 1

            except Exception as e:
                # Loguear el error pero NO hacer break — intentar los siguientes
                self.stdout.write(self.style.ERROR(f"  ✗ Error permanente en {archivo.name}: {e}"))
                failures += 1
                # Solo detener la secuencia de WAL segmentos si hay un fallo
                # (no tiene sentido subir WAL N+1 si N falló — el recovery sería incompleto)
                if len(archivo.name) == 24:
                    self.stdout.write(self.style.WARNING(
                        f"  ⚠ Deteniendo subida de WAL segmentos (se reintentará en el próximo ciclo)"
                    ))
                    break
                # Los .history y .backup sí se siguen intentando aunque uno falle

        if failures:
            self.stdout.write(self.style.WARNING(
                f"{prefix} {subidos} subidos, {failures} fallidos (se reintentarán)"
            ))

        return subidos

    def handle(self, *args, **options):
        stop_event = threading.Event()

        def do_shutdown():
            self.stdout.write("\n[SHUTDOWN] Rotando y subiendo últimos cambios...")
            try:
                self.rotate_and_upload(stop_event, context="FINAL")
            finally:
                sys.exit(0)

        def shutdown_handler(signum, frame):
            if not stop_event.is_set():
                stop_event.set()
                threading.Thread(target=do_shutdown, daemon=True).start()

        signal.signal(signal.SIGTERM, shutdown_handler)
        signal.signal(signal.SIGINT, shutdown_handler)

        wait_for_recovery_complete()

        self.stdout.write(f"[INICIO] Timeline: {get_current_timeline()}")
        self.upload_pending(prefix="[INICIO]")

        self.stdout.write(f"[READY] Monitoreando cada {POLL_INTERVAL}s...")
        while not stop_event.is_set():
            if stop_event.wait(timeout=POLL_INTERVAL):
                break
            try:
                self.upload_pending()
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"[LOOP ERROR] {e}"))