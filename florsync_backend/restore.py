#!/usr/bin/env python3
"""
restore.py - Restaura base backup + WALs desde Supabase Storage (PITR).

Uso:
    docker compose --profile restore run --rm restore python restore.py base_20260428_013453
"""

import sys
import os
import re
import tarfile
import shutil
import tempfile
from datetime import date
from pathlib import Path

from supabase import create_client

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
PGDATA      = Path(os.environ.get("PGDATA", "/var/lib/postgresql/data"))
WAL_ARCHIVE = Path("/wal-archive")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
BUCKET       = os.environ.get("SUPABASE_BUCKET", "backups")

WAL_IGNORE   = {"last_wal_upload.txt"}
WAL_SEGMENT  = re.compile(r'^[0-9A-F]{24}$')
WAL_BACKUP   = re.compile(r'^[0-9A-F]{24}\.[0-9A-F]+\.backup$')
WAL_HISTORY  = re.compile(r'^\d+\.history$')

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def abort(msg):
    print(f"\n❌ {msg}")
    sys.exit(1)

def check_env():
    if not SUPABASE_URL or not SUPABASE_KEY:
        abort("Faltan variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY")

def clear_dir(path):
    if path.exists():
        for f in path.iterdir():
            shutil.rmtree(f) if f.is_dir() else f.unlink()

def extract_tar(tar_path, dest):
    with tarfile.open(tar_path, "r:gz") as tf:
        members = tf.getmembers()
        roots = {m.name.split("/")[0] for m in members if "/" in m.name}
        strip = len(roots) == 1
        for member in members:
            if strip:
                parts = member.name.split("/", 1)
                if len(parts) < 2 or not parts[1]:
                    continue
                member.name = parts[1]
            tf.extract(member, path=dest, filter="tar")

def fix_permissions(path):
    """Aplica uid 999 y permisos correctos a un directorio y su contenido."""
    for item in [path] + list(path.rglob("*")):
        try:
            os.chmod(item, 0o700 if item.is_dir() else 0o600)
            os.chown(item, 999, 999)
        except Exception:
            pass

def find_start_wal(pgdata: Path) -> str | None:
    label = pgdata / "backup_label"
    if not label.exists():
        return None
    for line in label.read_text(errors="ignore").splitlines():
        if "START WAL LOCATION" in line and "(file " in line:
            match = re.search(r'\(file ([0-9A-F]{24})\)', line)
            if match:
                return match.group(1)
    return None

def wal_segment_id(name: str) -> str:
    return name[:24]

def month_range(start_year: int, start_month: int) -> list[tuple[str, str]]:
    today = date.today()
    result = []
    y, m = start_year, start_month
    while (y, m) <= (today.year, today.month):
        result.append((str(y), f"{m:02d}"))
        m += 1
        if m > 12:
            m = 1
            y += 1
    return result

def list_wal_files(client, wal_root):
    result = []
    try:
        top = client.storage.from_(BUCKET).list(wal_root)
    except Exception as e:
        print(f"        No se pudo listar {wal_root}: {e}")
        return result

    for item in sorted(top, key=lambda x: x["name"]):
        name = item["name"]
        if name in WAL_IGNORE:
            continue
        is_folder = item.get("id") is None
        if is_folder:
            sub_path = f"{wal_root}/{name}"
            try:
                sub_items = client.storage.from_(BUCKET).list(sub_path)
            except Exception:
                continue
            for sub in sorted(sub_items, key=lambda x: x["name"]):
                sub_name = sub["name"]
                if sub_name not in WAL_IGNORE:
                    result.append((f"{sub_path}/{sub_name}", sub_name))
        else:
            result.append((f"{wal_root}/{name}", name))

    return result

def collect_all_wal_files(client, year: str, month: str) -> list[tuple[str, str]]:
    start_year  = int(year)
    start_month = int(month)
    months      = month_range(start_year, start_month)

    all_files: list[tuple[str, str]] = []
    seen_names: set[str] = set()

    for y_str, m_str in months:
        wal_root = f"base/{y_str}/{m_str}/wal"
        print(f"      Buscando WALs en: {wal_root}")
        files = list_wal_files(client, wal_root)
        added = 0
        for remote_path, name in files:
            if name not in seen_names:
                seen_names.add(name)
                all_files.append((remote_path, name))
                added += 1
        if files:
            print(f"        → {added} archivos encontrados")
        else:
            print(f"        → (vacío o no existe)")

    return all_files

def filter_wal_files(all_files, start_wal: str):
    needed  = []
    skipped = 0

    for remote_path, name in all_files:
        base = wal_segment_id(name)

        if WAL_HISTORY.match(name):
            needed.append((remote_path, name, "history"))

        elif WAL_BACKUP.match(name):
            if base >= start_wal:
                needed.append((remote_path, name, "backup"))
            else:
                skipped += 1

        elif WAL_SEGMENT.match(name):
            if name >= start_wal:
                needed.append((remote_path, name, "segment"))
            else:
                skipped += 1

    return needed, skipped

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    if len(sys.argv) < 2:
        print(__doc__)
        abort("Debes indicar el nombre del backup. Ej: base_20260428_013453")

    backup = sys.argv[1].replace(".tar.gz", "").strip()
    year   = backup[5:9]
    month  = backup[9:11]

    print(f"\n{'='*50}")
    print(f"  RESTORE: {backup}")
    print(f"{'='*50}\n")

    check_env()
    print(f"PGDATA      : {PGDATA}")
    print(f"WAL archive : {WAL_ARCHIVE}")
    print(f"Bucket      : {BUCKET}\n")

    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 1. Descargar base backup
    remote_backup = f"base/{year}/{month}/{backup}.tar.gz"
    print(f"[1/4] Descargando base backup...")
    print(f"      {remote_backup}")

    with tempfile.TemporaryDirectory() as tmp:
        tar_path = Path(tmp) / "backup.tar.gz"
        data = client.storage.from_(BUCKET).download(remote_backup)
        tar_path.write_bytes(data)
        size_mb = tar_path.stat().st_size / 1_048_576
        print(f"      {size_mb:.1f} MB descargados")

        # 2. Extraer
        print(f"\n[2/4] Restaurando en {PGDATA}...")
        clear_dir(PGDATA)
        extract_tar(tar_path, PGDATA)
        print(f"      Extracción completada")

    start_wal = find_start_wal(PGDATA)
    if start_wal:
        print(f"      WAL de inicio (backup_label): {start_wal}")
    else:
        print(f"      No se encontró backup_label — se descargarán todos los WALs")

    # 3. Descargar WALs
    print(f"\n[3/4] Descargando WALs desde Supabase...")
    all_files = collect_all_wal_files(client, year, month)

    if not all_files:
        print("      No hay WALs en Supabase — recovery solo con base backup")
    else:
        if start_wal:
            needed, skipped = filter_wal_files(all_files, start_wal)
            print(f"\n      Total en Supabase : {len(all_files)} archivos")
            print(f"      Omitidos (previos): {skipped}")
            print(f"      A descargar       : {len(needed)}\n")
        else:
            needed  = [(r, n, "segment") for r, n in all_files]
            skipped = 0
            print(f"      Descargando todos : {len(needed)} archivos\n")

        if not needed:
            print("      No hay WALs necesarios después del backup")
        else:
            clear_dir(WAL_ARCHIVE)
            WAL_ARCHIVE.mkdir(exist_ok=True)

            total    = len(needed)
            total_mb = 0
            segments = [n for _, n, t in needed if t == "segment"]

            for i, (remote_path, name, kind) in enumerate(needed, 1):
                tag = {"segment": "WAL", "backup": "BCK", "history": "HST"}[kind]
                print(f"      [{i:>3}/{total}] [{tag}] ↓ {name}")
                data = client.storage.from_(BUCKET).download(remote_path)
                (WAL_ARCHIVE / name).write_bytes(data)
                total_mb += len(data) / 1_048_576

            print(f"\n      {total} archivos  ({total_mb:.1f} MB total)")
            if segments:
                print(f"      Desde : {segments[0]}")
                print(f"      Hasta : {segments[-1]}")

    # 4. Configurar recovery
    print(f"\n[4/4] Configurando PITR recovery...")
    (PGDATA / "recovery.signal").touch()
    (PGDATA / "postgresql.auto.conf").write_text(
        "# Generado por restore.py\n"
        "restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'\n"
        "recovery_target_timeline = 'latest'\n"
    )

    # Permisos PGDATA
    fix_permissions(PGDATA)
    print(f"      recovery.signal + postgresql.auto.conf escritos")
    print(f"      Permisos PGDATA ajustados (uid 999)")

    # Permisos WAL_ARCHIVE — DESPUÉS de descargar todo
    fix_permissions(WAL_ARCHIVE)
    print(f"      Permisos WAL_ARCHIVE ajustados (uid 999)")

    print(f"\n{'='*50}")
    print(f"   RESTORE COMPLETO")
    print(f"{'='*50}")
    print(f"\nPróximo paso:")
    print(f"   docker compose up -d db")
    print(f"   docker compose logs -f db\n")

if __name__ == "__main__":
    main()