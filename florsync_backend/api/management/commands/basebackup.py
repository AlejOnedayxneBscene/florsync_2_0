import subprocess
import os
import time
import hashlib
import shutil
from datetime import datetime, timezone, timedelta
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings
from supabase import create_client

# Rutas persistentes dentro del contenedor
BASE_DIR = Path('/basebackup/base')
TEMP_DIR = Path('/basebackup/tmp')
STATE_DIR = Path('/basebackup/state')
LAST_TL_FILE = STATE_DIR / 'last_timeline.txt'
LAST_DATE_FILE = STATE_DIR / 'last_backup_date.txt'


class Command(BaseCommand):
    help = 'Base Backup Automático: Se dispara por cambio de Timeline (Post-Restore) o cada 3 días.'

    def _wait_for_postgres(self, host, port, user, env, retries=20, delay=5):
        """
        Espera que PostgreSQL esté completamente listo:
        - Acepta conexiones normales (pg_isready)
        - Acepta conexiones de replicación (psql a pg_stat_replication)
        """
        self.stdout.write('[BACKUP] Verificando disponibilidad de PostgreSQL...')

        for intento in range(1, retries + 1):
            # Paso 1: verificar conexión básica
            check = subprocess.run(
                ['pg_isready', '-h', host, '-p', str(port), '-U', user],
                capture_output=True
            )
            if check.returncode != 0:
                self.stdout.write(f'[BACKUP] PostgreSQL no responde aún... intento {intento}/{retries}')
                time.sleep(delay)
                continue

            # Paso 2: verificar que el sistema de replicación esté activo
            verify = subprocess.run(
                [
                    'psql',
                    '-h', host,
                    '-p', str(port),
                    '-U', user,
                    '-d', 'postgres',
                    '-c', 'SELECT count(*) FROM pg_stat_replication;'
                ],
                env=env,
                capture_output=True,
                text=True
            )
            if verify.returncode == 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'[BACKUP] PostgreSQL listo para replicación (intento {intento}/{retries}).'
                    )
                )
                return True

            self.stdout.write(
                f'[BACKUP] Replicación no disponible aún... intento {intento}/{retries}'
            )
            time.sleep(delay)

        return False

    def _get_current_timeline(self):
        """Consulta el Timeline ID actual directamente desde el motor de Postgres."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT timeline_id FROM pg_control_checkpoint();")
                row = cursor.fetchone()
                return str(row[0]).zfill(8) if row else "00000001"
        except Exception as e:
            self.stderr.write(f"[ERROR] No se pudo obtener el Timeline: {e}")
            return "00000001"

    def handle(self, *args, **options):
        now = datetime.now(timezone.utc)
        current_tl = self._get_current_timeline()

        # Asegurar que los directorios existan
        BASE_DIR.mkdir(parents=True, exist_ok=True)
        TEMP_DIR.mkdir(parents=True, exist_ok=True)
        STATE_DIR.mkdir(parents=True, exist_ok=True)

        # Leer estados anteriores
        last_tl = LAST_TL_FILE.read_text().strip() if LAST_TL_FILE.exists() else None
        last_date_str = LAST_DATE_FILE.read_text().strip() if LAST_DATE_FILE.exists() else None

        should_backup = False
        motivo = ""

        # --- LÓGICA DE DECISIÓN ---

        # CONDICIÓN 1: Primer inicio (carpeta vacía)
        if not any(BASE_DIR.iterdir()):
            should_backup = True
            motivo = "Primer inicio del sistema (sin backups locales)."

        # CONDICIÓN 2: Cambio de Timeline (detecta un RESTORE previo)
        elif last_tl and current_tl != last_tl:
            should_backup = True
            motivo = f"Cambio de Timeline detectado ({last_tl} -> {current_tl}). Re-sincronizando genealogía."

        # CONDICIÓN 3: Política de tiempo (cada 3 días)
        elif last_date_str:
            last_date = datetime.fromisoformat(last_date_str)
            if now - last_date >= timedelta(days=3):
                should_backup = True
                motivo = "Política de mantenimiento: han pasado 3 días desde el último backup base."
        else:
            # Si no hay fecha registrada pero hay archivos, marcamos hoy para empezar el ciclo
            LAST_DATE_FILE.write_text(now.isoformat())

        if not should_backup:
            self.stdout.write(f'[BACKUP] Estado estable (TL: {current_tl}). No se requiere backup nuevo.')
            return

        # --- EJECUCIÓN DEL BACKUP ---

        backup_name = f"base_{now.strftime('%Y%m%d_%H%M%S')}_tl{current_tl}"
        backup_path = BASE_DIR / backup_name

        self.stdout.write(self.style.WARNING(f'[SISTEMA] Iniciando Backup Base REAL. Motivo: {motivo}'))

        try:
            self._basebackup(backup_path)
            tar_file = self._compress(backup_path)
            sha256 = self._checksum(tar_file)
            self._upload(tar_file, backup_name, sha256, now)
            self._cleanup(backup_path, tar_file)

            # Actualizar estado solo si todo salió bien
            LAST_TL_FILE.write_text(current_tl)
            LAST_DATE_FILE.write_text(now.isoformat())

            self.stdout.write(
                self.style.SUCCESS(
                    f'[EXITO] Backup {backup_name} completado y subido correctamente.'
                )
            )

        except Exception as e:
            self.stderr.write(self.style.ERROR(f'[CRÍTICO] Error en el proceso de backup: {str(e)}'))

    def _basebackup(self, backup_path: Path):
        db = settings.DATABASES['default']
        env = {**os.environ, 'PGPASSWORD': db['PASSWORD']}

        host = db['HOST']
        port = db.get('PORT', 5432)
        user = db['USER']

        # Esperar que PostgreSQL esté completamente listo antes de intentar el backup
        ready = self._wait_for_postgres(host, port, user, env)
        if not ready:
            raise RuntimeError(
                '[BACKUP] PostgreSQL no estuvo disponible para replicación después de todos los intentos.'
            )

        cmd = [
            'pg_basebackup',
            '-h', host,
            '-p', str(port),
            '-U', user,
            '-D', str(backup_path),
            '-Fp',
            '-Xf',   # Cambiado de -Xp a -Xf: usa archive WAL en lugar de streaming,
                     # más estable cuando archive_mode=on ya está configurado.
            '-P',
            '--no-password'
        ]

        self.stdout.write('[BACKUP] Ejecutando pg_basebackup...')
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)

        if result.returncode != 0:
            raise subprocess.CalledProcessError(
                result.returncode, cmd, output=result.stdout, stderr=result.stderr
            )

        if not (backup_path / "backup_label").exists():
            self.stderr.write(
                self.style.WARNING('[ALERTA] backup_label no encontrado en el backup generado.')
            )

    def _compress(self, backup_path: Path) -> Path:
        tar_path = TEMP_DIR / f"{backup_path.name}.tar.gz"
        self.stdout.write('[BACKUP] Comprimiendo archivos...')
        cmd = ['tar', '-czf', str(tar_path), '-C', str(backup_path.parent), backup_path.name]
        subprocess.run(cmd, check=True, capture_output=True)
        return tar_path

    def _checksum(self, filepath: Path) -> str:
        h = hashlib.sha256()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                h.update(chunk)
        return h.hexdigest()

    def _upload(self, filepath: Path, name: str, sha256: str, now: datetime):
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        bucket = settings.SUPABASE_BACKUP_BUCKET
        folder = f"base/{now.strftime('%Y/%m')}"
        remote_path = f"{folder}/{name}.tar.gz"

        self.stdout.write(f'[SUPABASE] Subiendo a: {remote_path}...')
        with open(filepath, 'rb') as f:
            client.storage.from_(bucket).upload(
                path=remote_path,
                file=f,
                file_options={'content-type': 'application/gzip', 'x-upsert': 'true'}
            )

    def _cleanup(self, backup_path: Path, tar_file: Path):
        if backup_path.exists():
            shutil.rmtree(backup_path)
        if tar_file.exists():
            tar_file.unlink()
        self.stdout.write('[CLEANUP] Archivos temporales eliminados.')