#!/usr/bin/env python3
"""
Restore PRO Florsync 2.0 (Timeline-aware + Windows Fix)
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
        if "START WAL LOCATION" in line and "(file " in line:
            start_wal = line.split("(file ")[1].rstrip(")")
        if "TIME LINE" in line.upper():
            try:
                timeline = line.split(":")[1].strip().zfill(8)
            except:
                pass
    return lsn, timeline, start_wal

# =========================
# WAL FILTER (MEJORADO)
# =========================
def wal_belongs(name: str, target_timeline: str | None, start_wal: str | None) -> bool:
    name = name.replace(".gz", "")
    
    # Los archivos .history son SIEMPRE necesarios para reconstruir la genealogía
    if name.endswith('.history'):
        return True

    if len(name) < 24:
        return False

    # Si es un WAL, verificamos que sea del timeline del backup o posterior
    # (Postgres puede necesitar WALs del timeline original para empezar)
    if target_timeline:
        file_tl = name[:8]
        # Permitimos el timeline actual y los que sigan (en caso de restores en cadena)
        if int(file_tl, 16) < int(target_timeline, 16):
            return False

    if start_wal:
        # No descargar WALs anteriores al inicio del backup
        if name < start_wal and name.endswith(target_timeline or ""):
            return False

    return True

# =========================
# LIST REMOTE WALs (RECURSIVO)
# =========================
def list_all_remote_wals(client, bucket, base_folder):
    """Lista archivos en la carpeta base y en subcarpetas de timeline"""
    result = []
    items = client.storage.from_(bucket).list(base_folder)

    for item in items:
        # Si no tiene ID es una carpeta (Subcarpeta de Timeline)
        if item.get("id") is None:
            subfolder = f"{base_folder}/{item['name']}"
            sub_items = client.storage.from_(bucket).list(subfolder)
            for si in sub_items:
                si["_remote_path"] = f"{subfolder}/{si['name']}"
                result.append(si)
        else:
            item["_remote_path"] = f"{base_folder}/{item['name']}"
            result.append(item)
    return result

def main():
    if len(sys.argv) < 2:
        print("Uso: python restore.py <nombre_del_backup>")
        sys.exit(1)

    backup_arg = sys.argv[1].removesuffix(".tar.gz")
    env = dotenv_values(".env")
    
    from supabase import create_client, ClientOptions
    client = create_client(
        env["SUPABASE_URL"], 
        env["SUPABASE_SERVICE_ROLE_KEY"],
        options=ClientOptions(storage_client_timeout=300)
    )

    bucket = env.get("SUPABASE_BUCKET", "backups")
    temp_dir = Path("./tmp_restore")
    safe_rmtree(temp_dir)
    temp_dir.mkdir(exist_ok=True)

    # 1. Descargar y extraer Base Backup
    year, month = backup_arg[5:9], backup_arg[9:11]
    filename = f"{backup_arg}.tar.gz"
    remote_backup = f"base/{year}/{month}/{filename}"

    print(f"--- Descargando Base Backup: {filename} ---")
    data = client.storage.from_(bucket).download(remote_backup)
    tar_path = temp_dir / filename
    tar_path.write_bytes(data)

    print("Deteniendo base de datos y limpiando volumen...")
    subprocess.run(["docker", "compose", "stop", "db"], check=False)
    subprocess.run(["docker", "volume", "rm", "florsync_2_0_postgres_data"], check=False)
    subprocess.run(["docker", "volume", "create", "florsync_2_0_postgres_data"], check=True)

    print("Extrayendo Base Backup en el volumen...")
    subprocess.run([
        "docker", "run", "--rm",
        "-v", "florsync_2_0_postgres_data:/data",
        "-v", f"{temp_dir.resolve()}:/tmp",
        "alpine", "sh", "-c", f"tar -xzf /tmp/{filename} -C /data --strip-components=1"
    ], check=True)

    # 2. Leer backup_label para saber qué WALs buscar
    label_dir = temp_dir / "label_extract"
    label_dir.mkdir(exist_ok=True)
    subprocess.run([
        "docker", "run", "--rm",
        "-v", "florsync_2_0_postgres_data:/data",
        "-v", f"{label_dir.resolve()}:/out",
        "alpine", "sh", "-c", "cp /data/backup_label /out/backup_label 2>/dev/null || true"
    ], check=False)

    _, target_tl, start_wal = parse_backup_label(label_dir)
    print(f"INFO: Backup del Timeline {target_tl}, empezando en WAL {start_wal}")

    # 3. Descargar WALs y .history
    print("\n--- Sincronizando WAL Archive (incluyendo Timelines) ---")
    wal_local = Path("./wal-archive")
    safe_rmtree(wal_local)
    wal_local.mkdir()

    base_wal_folder = f"base/{year}/{month}/wal"
    all_remote_files = list_all_remote_wals(client, bucket, base_wal_folder)

    descargados = 0
    for f in all_remote_files:
        name = f["name"]
        remote_path = f["_remote_path"]

        if wal_belongs(name, target_tl, start_wal):
            print(f"  ↓ Descargando: {name}")
            wal_data = client.storage.from_(bucket).download(remote_path)
            (wal_local / name).write_bytes(wal_data)
            descargados += 1

    print(f"Total: {descargados} archivos de recuperación listos.")

    # 4. Configurar PostgreSQL para Recovery
    print("\n--- Configurando Recovery Mode ---")
    subprocess.run([
        "docker", "run", "--rm",
        "-v", "florsync_2_0_postgres_data:/var/lib/postgresql/data",
        "-v", f"{wal_local.resolve()}:/var/lib/postgresql/wal_archive",
        "postgres:15", "bash", "-c",
        """
        touch /var/lib/postgresql/data/recovery.signal &&
        cat >> /var/lib/postgresql/data/postgresql.auto.conf << 'EOF'
restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
recovery_target_timeline = 'latest'
EOF
        """
    ], check=True)

    # Limpieza final
    gc.collect()
    time.sleep(1)
    safe_rmtree(temp_dir)

    print("\n✅ RESTORE LISTO. Levanta la DB con: docker compose up -d")

if __name__ == "__main__":
    main()