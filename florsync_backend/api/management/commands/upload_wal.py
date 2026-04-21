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


WAL_DIR       = Path('/wal-archive')
STATE_FILE    = Path('/wal-archive/last_wal_upload.txt')
POLL_INTERVAL = 30    # revisar cada 30s si hay WAL nuevos para subir


def force_wal_switch():
    """
    Rota el WAL activo. No hacemos escrituras dummy — si el WAL está
    vacío pg_switch_wal() igual lo archiva (genera un segmento parcial).
    """
    with connection.cursor() as cursor:
        cursor.execute("SELECT pg_switch_wal();")


def get_wal_names() -> list[str]:
    return sorted([
        f.name for f in WAL_DIR.iterdir()
        if f.is_file() and len(f.name) == 24
    ])


def get_current_timeline() -> str:
    """
    Obtiene el timeline actual directamente de PostgreSQL.
    Retorna string de 8 chars hex, ej: '00000003'
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT timeline_id FROM pg_control_checkpoint();")
            row = cursor.fetchone()
            if row:
                tl_int = int(row[0])
                return f"{tl_int:08X}"
    except Exception as e:
        print(f"[WAL] No se pudo obtener timeline de PG: {e}")

    # Fallback: usar el WAL más reciente del directorio
    wals = get_wal_names()
    if not wals:
        return "00000001"
    return wals[-1][:8]


def get_last_uploaded() -> str:
    """
    Retorna el último WAL subido, reseteando si el timeline cambió.
    """
    current_tl = get_current_timeline()

    if not STATE_FILE.exists():
        STATE_FILE.write_text("")
        return ""

    last = STATE_FILE.read_text().strip()

    if not last:
        return ""

    # Si el último WAL subido es de un timeline diferente al actual → resetear
    last_tl = last[:8] if len(last) >= 8 else ""
    if last_tl and current_tl and last_tl != current_tl:
        print(f"[WAL] ⚠ Timeline cambió: STATE_FILE={last_tl}, PG actual={current_tl}")
        print(f"[WAL] Reseteando STATE_FILE para subir WAL del timeline actual")
        STATE_FILE.write_text("")
        return ""

    return last

def wait_for_new_wal(previous_last: str, stop_event: threading.Event, timeout: int = 60) -> str | None:
    start = time.time()
    while time.time() - start < timeout:
        wals = get_wal_names()
        if wals and wals[-1] != previous_last:
            return wals[-1]
        stop_event.wait(timeout=2)
    return None


class Command(BaseCommand):
    help = 'Sube WAL cada hora y al cerrar la aplicación'

    def rotate_and_upload(self, client, bucket, stop_event: threading.Event, context: str = ""):
        """Rota el WAL activo, espera que se archive, y sube todo lo pendiente."""
        prefix = f"[WAL{' ' + context if context else ''}]"

        before_last = get_wal_names()
        before_last = before_last[-1] if before_last else ""

        self.stdout.write(f"{prefix} Rotando WAL activo...")
        force_wal_switch()

        self.stdout.write(f"{prefix} Esperando que PostgreSQL archive el nuevo WAL (max 60s)...")
        nuevo = wait_for_new_wal(before_last, stop_event, timeout=60)

        if nuevo:
            self.stdout.write(f"{prefix} WAL archivado: {nuevo}")
        else:
            self.stdout.write(self.style.WARNING(f"{prefix} Timeout — subiendo lo disponible igualmente"))

        return self.upload_pending(client, bucket, prefix)

    def upload_pending(self, client, bucket, prefix: str = "[WAL]") -> int:
        """Sube solo WAL pendientes del timeline actual."""
        last_wal   = get_last_uploaded()
        current_tl = get_current_timeline()
        wal_files  = sorted([
            f for f in WAL_DIR.iterdir()
            if f.is_file()
            and len(f.name) == 24
            and f.name.startswith(current_tl)   # solo timeline actual
            and f.name > last_wal
        ])

        if not wal_files:
            self.stdout.write(f"{prefix} Sin WAL pendientes.")
            return 0

        self.stdout.write(f"{prefix} Subiendo {len(wal_files)} WAL...")

        now    = datetime.now(timezone.utc)
        # Incluir timeline en la ruta para no mezclar WAL de distintas historias
        # El timeline son los primeros 8 chars del nombre del WAL
        timeline = wal_files[0].name[:8] if wal_files else "00000001"
        folder = now.strftime(f'%Y/%m/wal/{timeline}')
        subidos = 0

        for wal in wal_files:
            try:
                with open(wal, 'rb') as f:
                    client.storage.from_(bucket).upload(
                        path=f"{folder}/{wal.name}",
                        file=f,
                        file_options={
                            'content-type': 'application/octet-stream',
                            'x-upsert': 'true',
                        },
                    )
                self.stdout.write(f"  ✓ {wal.name}")
                STATE_FILE.write_text(wal.name)
                subidos += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ✗ Error subiendo {wal.name}: {e}"))
                break

        return subidos

    def handle(self, *args, **options):
        client     = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        bucket     = settings.SUPABASE_BACKUP_BUCKET
        stop_event = threading.Event()

        # -------------------------------------------------------
        # SHUTDOWN: rotar WAL, subir, salir limpio
        # -------------------------------------------------------
        def do_shutdown():
            self.stdout.write("\n[WAL SHUTDOWN] Cerrando — rotando y subiendo WAL final...")
            try:
                subidos = self.rotate_and_upload(client, bucket, stop_event, context="SHUTDOWN")
                self.stdout.write(self.style.SUCCESS(
                    f"[WAL SHUTDOWN] ✓ Cierre limpio — {subidos} WAL subidos"
                ))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"[WAL SHUTDOWN] Error: {e}"))
            finally:
                sys.exit(0)

        def shutdown(signum, frame):
            if stop_event.is_set():
                return
            stop_event.set()
            t = threading.Thread(target=do_shutdown, daemon=True)
            t.start()
            t.join()

        signal.signal(signal.SIGTERM, shutdown)
        signal.signal(signal.SIGINT, shutdown)

        # -------------------------------------------------------
        # INICIO: subir WAL que quedaron pendientes antes del cierre
        # -------------------------------------------------------
        self.stdout.write("[WAL] Iniciando...")
        # get_last_uploaded() ya detecta si el timeline cambió y resetea el STATE_FILE
        self.stdout.write(f"[WAL INICIO] Timeline actual: {get_current_timeline()}")
        self.stdout.write(f"[WAL INICIO] Último WAL subido: {get_last_uploaded()}")
        self.stdout.write("[WAL INICIO] Subiendo WAL pendientes del arranque anterior...")
        subidos = self.upload_pending(client, bucket, prefix="[WAL INICIO]")
        if subidos:
            self.stdout.write(self.style.SUCCESS(f"[WAL INICIO] ✓ {subidos} WAL subidos"))
        else:
            self.stdout.write("[WAL INICIO] Sin pendientes")

        # -------------------------------------------------------
        # LOOP: cada hora rotar + subir
        # -------------------------------------------------------
        self.stdout.write(f"[WAL] Monitoreando WAL nuevos cada {POLL_INTERVAL}s...")

        while not stop_event.is_set():
            stop_event.wait(timeout=POLL_INTERVAL)  # espera 1h o hasta SIGTERM

            if stop_event.is_set():
                break  # el shutdown ya se encarga de rotar y subir

            try:
                # Solo subir lo que PostgreSQL ya archivó — NO rotar aquí
                # La rotación la hace PostgreSQL solo con archive_timeout=3600
                subidos = self.upload_pending(client, bucket, prefix="[WAL]")
                if subidos:
                    self.stdout.write(self.style.SUCCESS(f"[WAL] ✓ {subidos} WAL subidos"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"[WAL] Error en loop: {e}"))