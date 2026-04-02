
import os
import gzip
import subprocess
from pathlib import Path
from datetime import datetime, timezone
from django.core.management.base import BaseCommand
from django.conf import settings
from supabase import create_client

TEMP_DIR = Path('/tmp/restore')

class Command(BaseCommand):
    help = 'Restaura la base de datos desde un backup full + WAL'

    def add_arguments(self, parser):
        parser.add_argument('--full', type=str, required=True,
            help='Ruta del backup full en Supabase. Ej: 2025/03/backup_full_20250330_010000.sql.gz')
        parser.add_argument('--until', type=str, default=None,
            help='Restaurar hasta este timestamp. Ej: 2025-03-30T15:00:00')

    def handle(self, *args, **options):
        TEMP_DIR.mkdir(parents=True, exist_ok=True)
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        bucket = settings.SUPABASE_BACKUP_BUCKET

        # 1. Descargar el full
        self.stdout.write(f'Descargando backup full: {options["full"]}...')
        data = client.storage.from_(bucket).download(options['full'])
        gz_path = TEMP_DIR / 'restore_full.sql.gz'
        sql_path = TEMP_DIR / 'restore_full.sql'
        gz_path.write_bytes(data)

        with gzip.open(gz_path, 'rb') as gz:
            sql_path.write_bytes(gz.read())
        self.stdout.write('  ✓ Full descargado y descomprimido')

        # 2. Restaurar el full
        self.stdout.write('Restaurando backup full...')
        db  = settings.DATABASES['default']
        env = {**os.environ, 'PGPASSWORD': db['PASSWORD']}
        subprocess.run([
            'psql',
            '-h', db['HOST'],
            '-p', str(db.get('PORT', 5432)),
            '-U', db['USER'],
            '-d', db['NAME'],
            '-f', str(sql_path),
        ], env=env, check=True, capture_output=True)
        self.stdout.write('  ✓ Full restaurado')

        # 3. Descargar y aplicar WAL si se especificó --until
        if options['until']:
            until_dt = datetime.fromisoformat(options['until']).replace(tzinfo=timezone.utc)
            self._apply_wal(client, bucket, until_dt, db, env)

        self.stdout.write(self.style.SUCCESS('✓ Restore completado'))

        # Limpiar temporales
        for f in TEMP_DIR.iterdir():
            f.unlink()

    def _apply_wal(self, client, bucket, until_dt, db, env):
        self.stdout.write(f'Descargando WAL hasta {until_dt.isoformat()}...')

        folder = until_dt.strftime('%Y/%m/wal')
        try:
            archivos = client.storage.from_(bucket).list(folder)
        except Exception:
            self.stdout.write('  No se encontraron archivos WAL.')
            return

        if not archivos:
            self.stdout.write('  No hay WAL disponibles.')
            return

        wal_dir = TEMP_DIR / 'wal'
        wal_dir.mkdir(exist_ok=True)

        for archivo in sorted(archivos, key=lambda x: x['name']):
            nombre = archivo['name']
            self.stdout.write(f'  Descargando WAL: {nombre}')
            data = client.storage.from_(bucket).download(f'{folder}/{nombre}')
            (wal_dir / nombre).write_bytes(data)

        # Copiar WAL al directorio de archive de PostgreSQL
        wal_archive = Path('/wal-archive')
        for wal_file in sorted(wal_dir.iterdir()):
            dest = wal_archive / wal_file.name
            dest.write_bytes(wal_file.read_bytes())
            self.stdout.write(f'  ✓ WAL copiado: {wal_file.name}')

        self.stdout.write(self.style.SUCCESS(f'  {len(archivos)} archivos WAL listos en /wal-archive'))
        self.stdout.write('  Los WAL se aplicarán automáticamente cuando PostgreSQL arranque en modo recovery.')
