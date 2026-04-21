import subprocess
import os
import hashlib
import shutil
from datetime import datetime, timezone
from pathlib import Path

from django.core.management.base import BaseCommand
from django.conf import settings
from supabase import create_client

BASE_DIR = Path('/basebackup/base')
TEMP_DIR = Path('/basebackup/tmp')

class Command(BaseCommand):
    help = 'Base Backup REAL compatible con WAL (PITR) - Versión Mejorada'

    def handle(self, *args, **options):
        now = datetime.now(timezone.utc)
        backup_name = f"base_{now.strftime('%Y%m%d_%H%M%S')}"
        backup_path = BASE_DIR / backup_name

        BASE_DIR.mkdir(parents=True, exist_ok=True)
        TEMP_DIR.mkdir(parents=True, exist_ok=True)

        self.stdout.write(f'[BACKUP] Iniciando BASE BACKUP: {backup_name}')

        try:
            self._basebackup(backup_path)
            tar_file = self._compress(backup_path)
            sha256 = self._checksum(tar_file)
            self._upload(tar_file, backup_name, sha256, now)
            self._cleanup(backup_path, tar_file)

            self.stdout.write(
                self.style.SUCCESS(
                    f'[BACKUP] Completado y subido: {backup_name} | SHA256: {sha256[:12]}...'
                )
            )

        except subprocess.CalledProcessError as e:
            self.stderr.write(self.style.ERROR(f'[BACKUP] Error en comando externo:'))
            if e.stderr:
                self.stderr.write(self.style.ERROR(f'[BACKUP] Detalle: {e.stderr}'))
            raise e
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'[BACKUP] Error inesperado: {str(e)}'))
            raise

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
            '-Fp',
            '-Xs',
            '-P',
            '--no-password'
        ]

        result = subprocess.run(cmd, env=env, capture_output=True, text=True)

        if result.returncode != 0:
            raise subprocess.CalledProcessError(
                result.returncode, cmd, output=result.stdout, stderr=result.stderr
            )

    def _compress(self, backup_path: Path) -> Path:
        tar_path = TEMP_DIR / f"{backup_path.name}.tar.gz"
        self.stdout.write(f'[BACKUP] Comprimiendo backup...')

        cmd = [
            'tar', '-czf', str(tar_path),
            '-C', str(backup_path.parent),
            backup_path.name
        ]

        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return tar_path

    def _checksum(self, filepath: Path) -> str:
        h = hashlib.sha256()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                h.update(chunk)
        return h.hexdigest()

    def _upload(self, filepath: Path, name: str, sha256: str, now: datetime):
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
        )

        bucket = settings.SUPABASE_BACKUP_BUCKET
        folder = f"base/{now.strftime('%Y/%m')}"
        remote_path = f"{folder}/{name}.tar.gz"

        self.stdout.write(f'[BACKUP] Subiendo a Supabase: {remote_path}...')

        with open(filepath, 'rb') as f:
            client.storage.from_(bucket).upload(
                path=remote_path,
                file=f,
                file_options={
                    'content-type': 'application/gzip',
                    'x-upsert': 'true',
                },
            )

    def _cleanup(self, backup_path: Path, tar_file: Path):
        try:
            if backup_path.exists():
                shutil.rmtree(backup_path)
            if tar_file.exists():
                tar_file.unlink()
            self.stdout.write(f'[BACKUP] Limpieza local completada.')
        except Exception as e:
            self.stderr.write(f'[BACKUP] No se pudo limpiar archivos temporales: {e}')