#!/usr/bin/env python3
"""
Restore PRO Florsync (FIX Windows + timeline folders + WAL correcto)
"""

import sys
import subprocess
import shutil
import time
import os
import stat
import gc
from pathlib import Path
from dotenv import dotenv_values


# =========================
# SAFE DELETE (WINDOWS FIX)
# =========================
def safe_rmtree(path: Path):
    def handler(func, path, exc):
        try:
            os.chmod(path, stat.S_IWRITE)
            func(path)
        except Exception:
            pass

    if path.exists():
        shutil.rmtree(path, onerror=handler)


# =========================
# PARSE BACKUP LABEL
# =========================
def parse_backup_label(path: Path):
    label_file = path / "backup_label"

    if not label_file.exists():
        print("backup_label no encontrado")
        return None, None, None

    content = label_file.read_text(errors="ignore")

    lsn = None
    timeline = None
    start_wal = None

    for line in content.splitlines():
        if "START WAL LOCATION" in line:
            if "(file " in line:
                start_wal = line.split("(file ")[1].rstrip(")")

        if "TIME LINE" in line.upper():
            try:
                timeline = line.split(":")[1].strip().zfill(8)
            except:
                pass

    return lsn, timeline, start_wal


# =========================
# WAL FILTER
# =========================
def wal_belongs(name: str, timeline: str | None, start_wal: str | None) -> bool:
    name = name.replace(".gz", "")

    if len(name) < 24:
        return False

    if timeline and not name.startswith(timeline):
        return False

    if start_wal:
        start = start_wal.replace(".gz", "")
        if name < start:
            return False

    return True


# =========================
# FLATTEN TIMELINE FOLDERS
# =========================
def list_timeline_wal(client, bucket, base_folder):
    result = []

    items = client.storage.from_(bucket).list(base_folder)

    for item in items:
        name = item["name"]

        # carpeta timeline
        if item.get("id") is None:
            subfolder = f"{base_folder}/{name}"
            sub = client.storage.from_(bucket).list(subfolder)

            for f in sub:
                f["_folder"] = subfolder
                result.append(f)
        else:
            item["_folder"] = base_folder
            result.append(item)

    return result


# =========================
# MAIN
# =========================
def main():
    if len(sys.argv) < 2:
        print("Uso: python restore.py <backup>")
        sys.exit(1)

    backup_name = sys.argv[1].removesuffix(".tar.gz")

    env = dotenv_values(".env")

    temp_dir = Path("./tmp_restore")
    temp_dir.mkdir(exist_ok=True)

    filename = f"{backup_name}.tar.gz"

    from supabase import create_client, ClientOptions

    client = create_client(
        env["SUPABASE_URL"],
        env["SUPABASE_SERVICE_ROLE_KEY"],
        options=ClientOptions(storage_client_timeout=300)
    )

    bucket = env.get("SUPABASE_BUCKET", "backups")

    year = backup_name[5:9]
    month = backup_name[9:11]

    remote = f"base/{year}/{month}/{filename}"

    # =========================
    # DOWNLOAD BACKUP
    # =========================
    print(f"Descargando backup {filename}...")
    data = client.storage.from_(bucket).download(remote)

    tar_path = temp_dir / filename
    tar_path.write_bytes(data)

    print("Backup descargado")

    # =========================
    # STOP DB
    # =========================
    print("Deteniendo DB...")
    subprocess.run(["docker", "compose", "stop", "db"], check=False)

    # =========================
    # RESET VOLUME
    # =========================
    print("Reseteando volumen...")
    subprocess.run(["docker", "volume", "rm", "florsync_2_0_postgres_data"], check=False)
    subprocess.run(["docker", "volume", "create", "florsync_2_0_postgres_data"], check=True)

    # =========================
    # EXTRACT BACKUP
    # =========================
    print("Extrayendo backup...")

    subprocess.run([
        "docker", "run", "--rm",
        "-v", "florsync_2_0_postgres_data:/data",
        "-v", f"{temp_dir.resolve()}:/tmp",
        "alpine",
        "sh", "-c",
        f"tar -xzf /tmp/{filename} -C /data --strip-components=1"
    ], check=True)

    # =========================
    # BACKUP LABEL
    # =========================
    label_dir = temp_dir / "data"
    label_dir.mkdir(exist_ok=True)

    subprocess.run([
        "docker", "run", "--rm",
        "-v", "florsync_2_0_postgres_data:/data",
        "-v", f"{label_dir.resolve()}:/out",
        "alpine",
        "sh", "-c",
        "cp /data/backup_label /out/backup_label 2>/dev/null || true"
    ], check=False)

    lsn, timeline, start_wal = parse_backup_label(label_dir)

    print("LSN:", lsn)
    print("Timeline:", timeline)
    print("Start WAL:", start_wal)

    # =========================
    # WAL DOWNLOAD
    # =========================
    print("\nDescargando WAL por timelines...")

    wal_local = Path("./wal-archive")

    # 🔥 FIX WINDOWS ERROR (NO rmtree directo)
    safe_rmtree(wal_local)
    wal_local.mkdir()

    base_folder = f"{year}/{month}/wal"

    all_wal = list_timeline_wal(client, bucket, base_folder)

    descargados = 0
    saltados = 0

    for f in all_wal:
        name = f["name"]
        folder = f["_folder"]

        if not wal_belongs(name, timeline, start_wal):
            saltados += 1
            continue

        print("WAL OK:", name)

        data = client.storage.from_(bucket).download(f"{folder}/{name}")
        (wal_local / name).write_bytes(data)

        descargados += 1

    print(f"\nWAL descargados: {descargados}")
    print(f"WAL saltados: {saltados}")

    # =========================
    # RECOVERY CONFIG
    # =========================
    print("\nConfigurando recovery...")

    subprocess.run([
        "docker", "run", "--rm",
        "-v", "florsync_2_0_postgres_data:/var/lib/postgresql/data",
        "-v", f"{wal_local.resolve()}:/var/lib/postgresql/wal_archive",
        "postgres:15",
        "bash", "-c",
        """
        touch /var/lib/postgresql/data/recovery.signal &&
        cat >> /var/lib/postgresql/data/postgresql.auto.conf << 'EOF'
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
recovery_target_action = 'promote'
recovery_target_timeline = 'latest'
EOF
        """
    ], check=True)

    # =========================
    # CLEANUP SAFE
    # =========================
    gc.collect()
    time.sleep(1)

    safe_rmtree(temp_dir)

    print("\n✅ RESTORE COMPLETADO")
    print("docker compose up -d")


if __name__ == "__main__":
    main()