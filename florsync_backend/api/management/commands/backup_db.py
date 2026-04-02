import subprocess
import os
import hashlib
from datetime import datetime, timezone
from pathlib import Path

from django.core.management.base import BaseCommand
from django.conf import settings
from supabase import create_client


BASE_DIR   = Path('/basebackup/base')
TEMP_DIR   = Path('/basebackup/tmp')


class Command(BaseCommand):
    help = 'Base Backup REAL compatible con WAL (PITR)'

    def handle(self, *args, **options):
        now = datetime.now(timezone.utc)
        backup_name = f"base_{now.strftime('%Y%m%d_%H%M%S')}"
        backup_path = BASE_DIR / backup_name

        BASE_DIR.mkdir(parents=True, exist_ok=True)

        self.stdout.write(f'🚀 Iniciando BASE BACKUP: {backup_name}')

        try:
            self._basebackup(backup_path)
            tar_file = self._compress(backup_path)
            sha256 = self._checksum(tar_file)
            self._upload(tar_file, backup_name, sha256, now)

            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Base backup completado: {backup_name} | SHA256: {sha256[:12]}...'
                )
            )

        except Exception as e:
            self.stderr.write(self.style.ERROR(f'❌ Error: {e}'))
            raise

    # ------------------------------------------------------------------ #

    def _basebackup(self, backup_path: Path):
        db = settings.DATABASES['default']

        env = {
            **os.environ,
            'PGPASSWORD': db['PASSWORD']
        }

        cmd = [
            'pg_basebackup',
            '-h', db['HOST'],
            '-p', str(db.get('PORT', 5432)),
            '-U', db['USER'],
            '-D', str(backup_path),
            '-Fp',          # formato plano
            '-Xs',          # incluye WAL
            '-P',           # progreso
        ]

        subprocess.run(cmd, check=True, env=env)

    # ------------------------------------------------------------------ #

    def _compress(self, backup_path: Path) -> Path:
        tar_path = TEMP_DIR / f"{backup_path.name}.tar.gz"
        TEMP_DIR.mkdir(parents=True, exist_ok=True)

        subprocess.run([
            'tar',
            '-czf',
            str(tar_path),
            '-C',
            str(backup_path.parent),
            backup_path.name
        ], check=True)

        return tar_path

    # ------------------------------------------------------------------ #

    def _checksum(self, filepath: Path) -> str:
        h = hashlib.sha256()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                h.update(chunk)
        return h.hexdigest()

    # ------------------------------------------------------------------ #

    def _upload(self, filepath: Path, name: str,
                sha256: str, now: datetime):

        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
        )

        bucket = settings.SUPABASE_BACKUP_BUCKET
        folder = f"base/{now.strftime('%Y/%m')}"
        remote_path = f"{folder}/{name}.tar.gz"

        self.stdout.write(f'☁️ Subiendo base backup...')

        with open(filepath, 'rb') as f:
            client.storage.from_(bucket).upload(
                path=remote_path,
                file=f,
                file_options={
                    'content-type': 'application/gzip',
                    'x-upsert': 'true',
                },
            )

        self.stdout.write(f'✅ Subido: {bucket}/{remote_path}')