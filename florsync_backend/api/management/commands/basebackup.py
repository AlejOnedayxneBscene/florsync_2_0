import subprocess
import os
import hashlib
import shutil
from datetime import datetime, timezone
from pathlib import Path

from django.core.management.base import BaseCommand
from django.conf import settings
from supabase import create_client

# Configuración de rutas
BASE_DIR = Path('/basebackup/base')
TEMP_DIR = Path('/basebackup/tmp')

class Command(BaseCommand):
    help = 'Base Backup REAL compatible con WAL (PITR) - Versión Mejorada'

    def handle(self, *args, **options):
        now = datetime.now(timezone.utc)
        backup_name = f"base_{now.strftime('%Y%m%d_%H%M%S')}"
        backup_path = BASE_DIR / backup_name

        # Asegurar que los directorios existan
        BASE_DIR.mkdir(parents=True, exist_ok=True)
        TEMP_DIR.mkdir(parents=True, exist_ok=True)

        self.stdout.write(f'🚀 Iniciando BASE BACKUP: {backup_name}')

        try:
            # 1. Ejecutar pg_basebackup
            self._basebackup(backup_path)
            
            # 2. Comprimir resultado
            tar_file = self._compress(backup_path)
            
            # 3. Generar Checksum
            sha256 = self._checksum(tar_file)
            
            # 4. Subir a Supabase
            self._upload(tar_file, backup_name, sha256, now)

            # 5. Limpieza local (Opcional, para ahorrar espacio)
            self._cleanup(backup_path, tar_file)

            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Base backup completado y subido: {backup_name} | SHA256: {sha256[:12]}...'
                )
            )

        except subprocess.CalledProcessError as e:
            # Error específico de comandos externos (Postgres/Tar)
            self.stderr.write(self.style.ERROR(f'❌ Error en comando externo:'))
            if e.stderr:
                self.stderr.write(self.style.ERROR(f'Detalle: {e.stderr}'))
            raise e
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'❌ Error inesperado: {str(e)}'))
            raise

    # ------------------------------------------------------------------ #

    def _basebackup(self, backup_path: Path):
        """Ejecuta la extracción de datos físicos de Postgres."""
        db = settings.DATABASES['default']

        # El password se pasa por variable de entorno por seguridad
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
            '-Fp',          # Formato plano (necesario para PITR)
            '-Xs',          # Stream: incluye los archivos WAL necesarios para que el backup sea consistente
            '-P',           # Muestra progreso en consola
            '--no-password' # Asegura que no se quede colgado pidiendo pass
        ]

        # Usamos capture_output=True para poder leer el error si falla
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode != 0:
            # Si falla, lanzamos una excepción con el mensaje de error de Postgres
            raise subprocess.CalledProcessError(
                result.returncode, cmd, output=result.stdout, stderr=result.stderr
            )

    # ------------------------------------------------------------------ #

    def _compress(self, backup_path: Path) -> Path:
        """Comprime el directorio del backup en un archivo .tar.gz"""
        tar_path = TEMP_DIR / f"{backup_path.name}.tar.gz"
        self.stdout.write(f'📦 Comprimiendo backup...')

        cmd = [
            'tar',
            '-czf',
            str(tar_path),
            '-C',
            str(backup_path.parent),
            backup_path.name
        ]
        
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return tar_path

    # ------------------------------------------------------------------ #

    def _checksum(self, filepath: Path) -> str:
        """Calcula el SHA256 para verificar integridad posterior."""
        h = hashlib.sha256()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                h.update(chunk)
        return h.hexdigest()

    # ------------------------------------------------------------------ #

    def _upload(self, filepath: Path, name: str, sha256: str, now: datetime):
        """Sube el archivo final a Supabase Storage."""
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY,
        )

        bucket = settings.SUPABASE_BACKUP_BUCKET
        folder = f"base/{now.strftime('%Y/%m')}"
        remote_path = f"{folder}/{name}.tar.gz"

        self.stdout.write(f'☁️ Subiendo a Supabase: {remote_path}...')

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
        """Limpia los archivos locales una vez subidos a la nube."""
        try:
            if backup_path.exists():
                shutil.rmtree(backup_path)
            if tar_file.exists():
                tar_file.unlink()
            self.stdout.write(f'🧹 Limpieza local completada.')
        except Exception as e:
            self.stderr.write(f'⚠️ No se pudo limpiar archivos temporales: {e}')