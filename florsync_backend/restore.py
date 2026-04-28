#!/usr/bin/env python3
"""
restore.py - Restaura un base backup desde Supabase Storage y aplica WALs (PITR).

Uso:
    docker compose run --rm restore python restore.py base_20260428_013453

Variables de entorno requeridas (via .env):
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    SUPABASE_BUCKET   (default: "backups")
"""

import sys
import os
import tarfile
import shutil
import tempfile
from pathlib import Path

# ---------------------------------------------------------------------------
# Dependencias: solo supabase (ya instalada en la imagen del backend)
# ---------------------------------------------------------------------------
try:
    from supabase import create_client
except ImportError:
    print("❌ Falta instalar: pip install supabase")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------
PGDATA      = Path(os.environ.get("PGDATA", "/var/lib/postgresql/data"))
WAL_ARCHIVE = Path("/wal-archive")

SUPABASE_URL    = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY    = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_BUCKET = os.environ.get("SUPABASE_BUCKET", "backups")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def abort(msg: str):
    print(f"\n❌ {msg}")
    sys.exit(1)


def check_env():
    missing = [v for v in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY") if not os.environ.get(v)]
    if missing:
        abort(f"Variables de entorno faltantes: {', '.join(missing)}")


def build_remote_path(backup_name: str) -> str:
    """
    Construye la ruta remota en Supabase Storage.
    Espera nombres como: base_YYYYMMDD_HHMMSS
    Ruta resultante:     base/YYYY/MM/base_YYYYMMDD_HHMMSS.tar.gz
    """
    try:
        date_part = backup_name.replace("base_", "")[:8]  # YYYYMMDD
        year  = date_part[:4]
        month = date_part[4:6]
    except Exception:
        abort(f"Nombre de backup inválido: '{backup_name}'. Formato esperado: base_YYYYMMDD_HHMMSS")

    return f"base/{year}/{month}/{backup_name}.tar.gz"


def download_backup(client, remote_path: str, dest: Path) -> Path:
    print(f"   Ruta remota : {remote_path}")
    print(f"   Destino     : {dest}")

    try:
        data = client.storage.from_(SUPABASE_BUCKET).download(remote_path)
    except Exception as e:
        abort(f"No se pudo descargar el backup: {e}")

    tar_path = dest / Path(remote_path).name
    tar_path.write_bytes(data)
    size_mb = tar_path.stat().st_size / 1_048_576
    print(f"   Tamaño      : {size_mb:.1f} MB")
    return tar_path


def clear_pgdata():
    """Limpia PGDATA preservando el directorio raíz."""
    if not PGDATA.exists():
        abort(f"PGDATA no encontrado: {PGDATA}  — ¿está montado el volumen?")

    print(f"   Limpiando {PGDATA} ...")
    for item in PGDATA.iterdir():
        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()
    print("   PGDATA limpio.")


def extract_backup(tar_path: Path):
    print(f"   Extrayendo {tar_path.name} → {PGDATA} ...")
    with tarfile.open(tar_path, "r:gz") as tf:
        members = tf.getmembers()

        # Detectar si hay un directorio raíz común (strip-components=1)
        roots = {m.name.split("/")[0] for m in members if "/" in m.name}
        strip = len(roots) == 1

        for member in members:
            if strip:
                parts = member.name.split("/", 1)
                if len(parts) < 2 or not parts[1]:
                    continue
                member.name = parts[1]

            tf.extract(member, path=PGDATA, filter="tar")

    print("   Extracción completada.")


def show_wal_files():
    """Muestra los WALs disponibles en /wal-archive."""
    if not WAL_ARCHIVE.exists():
        print("   ⚠️  /wal-archive no encontrado o no montado.")
        return

    wals = sorted([
        f for f in WAL_ARCHIVE.iterdir()
        if f.is_file() and not f.name.startswith(".")
    ])

    if not wals:
        print("   ⚠️  No hay archivos WAL en /wal-archive.")
        return

    total_mb = sum(f.stat().st_size for f in wals) / 1_048_576
    print(f"   Archivos WAL encontrados: {len(wals)}  ({total_mb:.1f} MB total)\n")

    # Separar history files de WAL segments
    history  = [f for f in wals if f.suffix == ".history"]
    segments = [f for f in wals if f.suffix != ".history"]

    if history:
        print("   Timeline history:")
        for f in history:
            print(f"     • {f.name}")
        print()

    if segments:
        print("   WAL segments:")
        if len(segments) <= 20:
            for f in segments:
                size_kb = f.stat().st_size / 1024
                print(f"     • {f.name}  ({size_kb:.0f} KB)")
        else:
            for f in segments[:5]:
                size_kb = f.stat().st_size / 1024
                print(f"     • {f.name}  ({size_kb:.0f} KB)")
            print(f"     ... {len(segments) - 10} archivos más ...")
            for f in segments[-5:]:
                size_kb = f.stat().st_size / 1024
                print(f"     • {f.name}  ({size_kb:.0f} KB)")

    if segments:
        print(f"\n   Rango de recovery:")
        print(f"     Desde : {segments[0].name}")
        print(f"     Hasta : {segments[-1].name}")


def write_recovery_config():
    """
    Escribe recovery.signal y postgresql.auto.conf para PITR.
    El restore_command apunta a /wal-archive que está montado en el contenedor db.
    """
    signal = PGDATA / "recovery.signal"
    signal.touch()
    print(f"   Creado: {signal}")

    autoconf = PGDATA / "postgresql.auto.conf"
    autoconf.write_text(
        "# Generado por restore.py\n"
        "restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'\n"
        "recovery_target_timeline = 'latest'\n"
    )
    print(f"   Escrito: {autoconf}")


def fix_permissions():
    """postgres (uid 999) debe ser dueño de PGDATA."""
    print(f"   Ajustando permisos en {PGDATA} ...")
    for item in PGDATA.rglob("*"):
        try:
            os.chmod(item, 0o700 if item.is_dir() else 0o600)
        except Exception:
            pass
    for item in [PGDATA] + list(PGDATA.rglob("*")):
        try:
            os.chown(item, 999, 999)
        except Exception:
            pass
    print("   Permisos OK.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    if len(sys.argv) < 2:
        print(__doc__)
        abort("Debes indicar el nombre del backup. Ej: base_20260428_013453")

    backup_name = sys.argv[1].replace(".tar.gz", "").strip()
    print(f"\n{'='*55}")
    print(f"  RESTORE: {backup_name}")
    print(f"{'='*55}\n")

    # 1. Validar entorno
    print("[1/5] Validando entorno...")
    check_env()
    print(f"   PGDATA      : {PGDATA}")
    print(f"   WAL archive : {WAL_ARCHIVE}")
    print(f"   Bucket      : {SUPABASE_BUCKET}")

    # 2. Conectar a Supabase
    print("\n[2/5] Conectando a Supabase Storage...")
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("   Conexión OK.")

    # 3. Descargar backup
    print("\n[3/5] Descargando base backup...")
    remote_path = build_remote_path(backup_name)
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        tar_path = download_backup(client, remote_path, tmp_path)

        # 4. Restaurar
        print("\n[4/5] Restaurando backup...")
        clear_pgdata()
        extract_backup(tar_path)

    # 5. Configurar recovery
    print("\n[5/5] Configurando PITR recovery...")
    write_recovery_config()
    fix_permissions()

    # 6. Mostrar WALs disponibles
    print("\n[+] WALs disponibles para recovery:")
    show_wal_files()

    print(f"\n{'='*55}")
    print("  ✅ RESTORE COMPLETO")
    print(f"{'='*55}")
    print("\nPróximo paso — reiniciar la base de datos:")
    print("   docker compose up -d db")
    print("\nPostgreSQL aplicará los WALs automáticamente al iniciar.")
    print("Verifica el progreso con:")
    print("   docker compose logs -f db\n")


if __name__ == "__main__":
    main()