#!/usr/bin/env python3
"""
Restore script para Florsync
Uso: python restore.py base_20260402_180205
"""

import sys
import subprocess
import shutil
import time
from pathlib import Path
from dotenv import dotenv_values

def main():
    if len(sys.argv) < 2:
        print("❌ Uso: python restore.py <nombre_del_backup>")
        print("   Ej: python restore.py base_20260402_180205")
        sys.exit(1)

    backup_name = sys.argv[1].removesuffix(".tar.gz")
    env = dotenv_values(".env")
    temp_dir = Path("./tmp_restore")
    temp_dir.mkdir(exist_ok=True)

    filename = f"{backup_name}.tar.gz"
    tar_path = temp_dir / filename

    # 1. Descargar base backup desde Supabase
    print(f" Descargando {filename} desde Supabase...")

    from supabase import create_client
    client = create_client(
        env["SUPABASE_URL"],
        env["SUPABASE_SERVICE_ROLE_KEY"]
    )
    bucket = env.get("SUPABASE_BUCKET", "backups")

    year = backup_name[5:9]
    month = backup_name[9:11]
    remote = f"base/{year}/{month}/{filename}"

    print(f" Ruta remota: {remote}")
    data = client.storage.from_(bucket).download(remote)
    tar_path.write_bytes(data)
    print(f" Descargado: {tar_path}")

    # 2. Detener Postgres (SAFE en caso Docker apagado)
    print(" Deteniendo Postgres...")
    try:
        subprocess.run(["docker", "compose", "stop", "db"], check=True)
    except Exception:
        print(" Docker no estaba activo, continuando...")

    # 3. Limpiar y recrear volumen
    print(" Limpiando volumen...")
    subprocess.run(
        ["docker", "volume", "rm", "florsync_2_0_postgres_data"],
        check=False
    )
    subprocess.run(
        ["docker", "volume", "create", "florsync_2_0_postgres_data"],
        check=True
    )

    # 4. Extraer backup en volumen (FIX: usar alpine, no postgres)
    print(" Extrayendo backup...")
    subprocess.run([
        "docker", "run", "--rm",
        "-v", "florsync_2_0_postgres_data:/var/lib/postgresql/data",
        "-v", f"{temp_dir.resolve()}:/tmp/restore",
        "alpine",
        "sh", "-c",
        f"tar -xzf /tmp/restore/{filename} -C /var/lib/postgresql/data --strip-components=1"
    ], check=True)

    # 5. Descargar WAL desde Supabase
    print(" Descargando WAL desde Supabase...")

    wal_local = Path("./wal-archive")
    wal_local.mkdir(exist_ok=True)

    wal_folder = f"{year}/{month}/wal"

    try:
        archivos = client.storage.from_(bucket).list(wal_folder)
        if archivos:
            for archivo in sorted(archivos, key=lambda x: x['name']):
                nombre = archivo['name']
                print(f" Descargando WAL: {nombre}")
                data = client.storage.from_(bucket).download(f"{wal_folder}/{nombre}")
                (wal_local / nombre).write_bytes(data)
            print(f" {len(archivos)} archivos WAL descargados")
        else:
            print(" No se encontraron WAL")
    except Exception as e:
        print(f" Error descargando WAL: {e}")

    # 6. Configurar recovery mode en Postgres
    print(" Configurando recovery mode...")

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
EOF
        echo 'recovery configurado'
        """
    ], check=True)

    # 7. Limpiar temporales
    print(" Limpiando temporales...")
    try:
        shutil.rmtree(temp_dir)
    except Exception as e:
        print(f" No se pudo limpiar tmp_restore: {e}")

    print("\n Restore completado.")
    print(" Ahora corre: docker compose up")

    last_backup_file = Path("./base-backup/.last_backup")
    last_backup_file.write_text(str(int(time.time())))
    print(" .last_backup actualizado")

if __name__ == "__main__":
    main()