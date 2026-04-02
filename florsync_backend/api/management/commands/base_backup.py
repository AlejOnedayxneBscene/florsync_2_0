import subprocess
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from supabase import create_client

TEMP_DIR = Path('/basebackup')

class Command(BaseCommand):
    help = 'Base backup usando pg_basebackup para restore con WAL'

    def handle(self, *args, **options):
        TEMP_DIR.mkdir(parents=True, exist_ok=True)

        now = datetime.now(timezone.utc)
        folder_name = now.strftime('%Y%m%d_%H%M%S')
        backup_path = TEMP_DIR / folder_name
        backup_path.mkdir(exist_ok=True)

        db = settings.DATABASES['default']
        env = {**os.environ, 'PGPASSWORD': db['PASSWORD']}

        self.stdout.write('🚀 Iniciando pg_basebackup...')

        # Ejecutar pg_basebackup (ya genera .tar.gz automáticamente)
        subprocess.run([
            'pg_basebackup',
            '-h', db['HOST'],
            '-p', str(db.get('PORT', 5432)),
            '-U', db['USER'],
            '-D', str(backup_path),
            '-Ft',   # formato tar
            '-z',    # compresión gzip
            '-Xs',   # incluir WAL
            '-P',
        ], env=env, check=True)

        self.stdout.write('📦 Backup generado correctamente')

        # Conectar a Supabase
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )

        # Subir TODOS los archivos generados (.tar.gz)
        for file in backup_path.glob("*.tar.gz"):
            remote_path = f"{now.strftime('%Y/%m/%d')}/{folder_name}/{file.name}"

            self.stdout.write(f'⬆️ Subiendo {file.name}...')

            with open(file, 'rb') as f:
                client.storage.from_(settings.SUPABASE_BACKUP_BUCKET).upload(
                    path=remote_path,
                    file=f,
                    file_options={
                        'content-type': 'application/gzip',
                        'x-upsert': 'true'
                    },
                )

            size_mb = file.stat().st_size / 1024 / 1024
            self.stdout.write(f'   ✓ {file.name} ({size_mb:.2f} MB)')

        self.stdout.write(self.style.SUCCESS('✅ Base backup subido correctamente'))

        # 🔥 Limpieza segura (NO borrar el volumen completo)
        try:
            shutil.rmtree(backup_path)
            self.stdout.write('🧹 Limpieza completada')
        except Exception as e:
            self.stdout.write(f'⚠️ Error limpiando temporales: {e}')