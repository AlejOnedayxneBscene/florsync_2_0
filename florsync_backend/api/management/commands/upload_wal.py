import time
import signal
import sys
from pathlib import Path
from datetime import datetime, timezone

from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection
from supabase import create_client


WAL_DIR    = Path('/wal-archive')
STATE_FILE = Path('/wal-archive/last_wal_upload.txt')


def force_wal_switch():
    with connection.cursor() as cursor:
        cursor.execute("SELECT pg_switch_wal();")


def wait_for_new_wal(previous_last, timeout=60):
    start = time.time()

    while time.time() - start < timeout:
        wals = sorted([
            f.name for f in WAL_DIR.iterdir()
            if f.is_file() and len(f.name) == 24
        ])

        if wals and wals[-1] != previous_last:
            return True

        time.sleep(2)

    return False


class Command(BaseCommand):
    help = 'Sube archivos WAL nuevos a Supabase Storage'

    def upload_pending_wals(self, client, bucket):
        """Sube todos los WAL pendientes. Retorna cantidad subida."""

        # Leer estado
        last_wal = ""
        if STATE_FILE.exists():
            last_wal = STATE_FILE.read_text().strip()
        else:
            self.stdout.write("Inicializando STATE_FILE...")
            STATE_FILE.write_text("")

        self.stdout.write(f'Último WAL guardado: {last_wal}')

        # Buscar nuevos WAL
        wal_files = sorted([
            f for f in WAL_DIR.iterdir()
            if f.is_file()
            and len(f.name) == 24
            and f.name > last_wal
        ])

        self.stdout.write(f'WAL encontrados: {[f.name for f in wal_files]}')

        if not wal_files:
            self.stdout.write('No hay WAL nuevos para subir.')
            return 0

        self.stdout.write(f'Subiendo {len(wal_files)} archivos WAL...')

        now    = datetime.now(timezone.utc)
        folder = now.strftime('%Y/%m/wal')
        subidos = 0

        for wal in wal_files:
            try:
                remote_path = f"{folder}/{wal.name}"

                with open(wal, 'rb') as f:
                    client.storage.from_(bucket).upload(
                        path=remote_path,
                        file=f,
                        file_options={
                            'content-type': 'application/octet-stream',
                            'x-upsert': 'true',
                        },
                    )

                self.stdout.write(f'✓ {wal.name}')
                STATE_FILE.write_text(wal.name)
                subidos += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error subiendo {wal.name}: {e}'))
                break

        return subidos

    def handle(self, *args, **options):
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        bucket = settings.SUPABASE_BACKUP_BUCKET

        # ✅ Shutdown: rotar WAL activo, esperar que se archive y subir
        def shutdown(signum, frame):
            self.stdout.write("\n  Señal de cierre recibida, forzando rotación WAL...")
            try:
                force_wal_switch()
                self.stdout.write("Esperando que el WAL final se archive...")
                time.sleep(3)  # dar tiempo a archive_command

                subidos = self.upload_pending_wals(client, bucket)
                self.stdout.write(
                    self.style.SUCCESS(f"✓ Cierre limpio — {subidos} WAL subidos antes de cerrar")
                )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f" Error en shutdown: {e}"))
            sys.exit(0)

        signal.signal(signal.SIGTERM, shutdown)  # docker stop, systemctl stop
        signal.signal(signal.SIGINT, shutdown)   # Ctrl+C

        # Ver WAL existentes para decidir si rotar
        last_wal = STATE_FILE.read_text().strip() if STATE_FILE.exists() else ""

        existing_wals = sorted([
            f for f in WAL_DIR.iterdir()
            if f.is_file() and len(f.name) == 24
        ])

        if not existing_wals or existing_wals[-1].name == last_wal:
            self.stdout.write("Forzando rotación de WAL...")
            force_wal_switch()

            self.stdout.write("Esperando WAL...")
            if not wait_for_new_wal(last_wal):
                self.stdout.write(self.style.ERROR(" WAL no apareció a tiempo"))
                return

        # Subir WAL pendientes
        subidos = self.upload_pending_wals(client, bucket)
        self.stdout.write(self.style.SUCCESS(f'WAL subidos: {subidos} archivos'))