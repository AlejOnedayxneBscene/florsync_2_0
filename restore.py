#!/usr/bin/env python3
"""
Restore PRO Florsync (auto timeline + WAL filtrado)
"""

import sys
import subprocess
import shutil
import time
from pathlib import Path
from dotenv import dotenv_values


# ----------------------------
# EXTRAER TIMELINE, LSN Y START WAL
# ----------------------------
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
            try:
                lsn = line.split(":", 1)[1].strip()
                # Extrae el nombre del WAL del paréntesis: (file 0000000A00000001)
                if "(file " in line:
                    start_wal = line.split("(file ")[1].rstrip(")")
            except Exception:
                pass

        if "TIME LINE" in line.upper():
            try:
                timeline = line.split(":")[1].strip()
            except Exception:
                pass

    return lsn, timeline, start_wal


# ----------------------------
# FILTRO WAL SEGURO Y PRECISO
# ----------------------------
def wal_belongs_to_backup(wal_name: str, timeline: str | None, start_wal: str | None) -> bool:
    """
    Incluye solo WAL:
    - Del mismo timeline que el backup
    - Con nombre >= al WAL inicial del backup (orden lexicográfico = orden temporal en PG)
    """
    # Quitar extensión .gz si viene comprimido
    name = wal_name.removesuffix(".gz")

    # Validar que tiene longitud de nombre WAL válido (24 chars hex)
    if len(name) < 24:
        return False

    # Filtrar por timeline: los primeros 8 chars del nombre son el timeline en hex
    if timeline:
        expected_tl = timeline.zfill(8)
        if not name.startswith(expected_tl):
            print(f"  [SKIP] WAL de otro timeline: {name} (esperado timeline {expected_tl})")
            return False

    # Filtrar por posición: solo WAL >= start_wal del backup
    if start_wal:
        start_clean = start_wal.strip().removesuffix(".gz")
        if name < start_clean:
            print(f"  [SKIP] WAL anterior al backup: {name} < {start_clean}")
            return False

    return True


# ----------------------------
# MAIN
# ----------------------------
def main():
    if len(sys.argv) < 2:
        print("Uso: python restore.py <backup>")
        sys.exit(1)

    backup_name = sys.argv[1].removesuffix(".tar.gz")

    env = dotenv_values(".env")
    temp_dir = Path("./tmp_restore")
    temp_dir.mkdir(exist_ok=True)

    filename = f"{backup_name}.tar.gz"
    tar_path = temp_dir / filename

    from supabase import create_client, ClientOptions

    # Timeout extendido: 5 minutos por archivo (WAL pueden ser grandes)
    client = create_client(
        env["SUPABASE_URL"],
        env["SUPABASE_SERVICE_ROLE_KEY"],
        options=ClientOptions(storage_client_timeout=300)
    )

    bucket = env.get("SUPABASE_BUCKET", "backups")

    year = backup_name[5:9]
    month = backup_name[9:11]

    remote = f"base/{year}/{month}/{filename}"

    # ----------------------------
    # HELPER: DESCARGA CON REINTENTOS
    # ----------------------------
    def download_with_retry(remote_path: str, max_retries: int = 3) -> bytes:
        for intento in range(1, max_retries + 1):
            try:
                return client.storage.from_(bucket).download(remote_path)
            except Exception as e:
                if intento == max_retries:
                    raise
                wait = intento * 5
                print(f"  [RETRY {intento}/{max_retries}] Timeout. Reintentando en {wait}s...")
                time.sleep(wait)

    print(f"Descargando backup {filename}...")
    data = download_with_retry(remote)
    tar_path.write_bytes(data)

    print("Backup descargado")

    # ----------------------------
    # STOP DB
    # ----------------------------
    print("Deteniendo DB...")
    try:
        subprocess.run(["docker", "compose", "stop", "db"], check=True)
    except Exception:
        print("Docker no activo o ya detenido")

    # ----------------------------
    # RESET VOLUME
    # ----------------------------
    print("Reseteando volumen...")
    subprocess.run(["docker", "volume", "rm", "florsync_2_0_postgres_data"], check=False)
    subprocess.run(["docker", "volume", "create", "florsync_2_0_postgres_data"], check=True)

    # ----------------------------
    # EXTRACT BACKUP
    # ----------------------------
    print("Extrayendo backup...")

    subprocess.run([
        "docker", "run", "--rm",
        "-v", "florsync_2_0_postgres_data:/data",
        "-v", f"{temp_dir.resolve()}:/tmp",
        "alpine",
        "sh", "-c",
        f"tar -xzf /tmp/{filename} -C /data --strip-components=1"
    ], check=True)

    # ----------------------------
    # READ BACKUP LABEL
    # ----------------------------
    print("Leyendo backup_label...")

    # Extraer backup_label del volumen para poder leerlo en el host
    label_dir = temp_dir / "data"
    label_dir.mkdir(exist_ok=True)

    subprocess.run([
        "docker", "run", "--rm",
        "-v", "florsync_2_0_postgres_data:/data",
        "-v", f"{label_dir.resolve()}:/out",
        "alpine",
        "sh", "-c",
        "cp /data/backup_label /out/backup_label 2>/dev/null || echo 'no backup_label'"
    ], check=False)

    lsn, timeline, start_wal = parse_backup_label(label_dir)

    print(f"  LSN:       {lsn}")
    print(f"  Timeline:  {timeline}")
    print(f"  Start WAL: {start_wal}")

    if not start_wal:
        print("ADVERTENCIA: No se pudo determinar el WAL inicial. Se descargarán todos los WAL del mes.")

    # ----------------------------
    # DOWNLOAD WAL FILTRADO
    # ----------------------------
    print("\nDescargando WAL compatibles...")

    wal_local = Path("./wal-archive")

    # Limpiar WAL anteriores para liberar espacio
    if wal_local.exists():
        print("Limpiando wal-archive anterior...")
        for f in wal_local.iterdir():
            try:
                f.unlink()
            except Exception as e:
                print(f"  [WARN] No se pudo borrar {f.name}: {e}")
    wal_local.mkdir(exist_ok=True)

    # ----------------------------
    # LISTAR WAL CON PAGINACION
    # Supabase devuelve max 100 por llamada, hay que paginar.
    # Además buscamos en el mes del backup Y el mes siguiente
    # por si el backup quedó al final de un mes.
    # ----------------------------
    def list_all_wal(folder: str) -> list:
        """Lista todos los archivos de una carpeta paginando de 100 en 100."""
        todos = []
        offset = 0
        limit = 100
        while True:
            page = client.storage.from_(bucket).list(
                folder,
                options={"limit": limit, "offset": offset, "sortBy": {"column": "name", "order": "asc"}}
            )
            if not page:
                break
            todos.extend(page)
            if len(page) < limit:
                break
            offset += limit
        return todos

    # Calcular mes siguiente para cubrir WAL que cruzan el cambio de mes
    next_month = int(month) + 1
    next_year = int(year)
    if next_month > 12:
        next_month = 1
        next_year += 1
    next_month_str = f"{next_month:02d}"
    next_year_str = str(next_year)

    carpetas_wal = [
        f"{year}/{month}/wal",
        f"{next_year_str}/{next_month_str}/wal",
    ]

    todos_los_wal = []
    for carpeta in carpetas_wal:
        print(f"  Listando WAL en: {carpeta}")
        archivos_carpeta = list_all_wal(carpeta)
        for f in archivos_carpeta:
            f["_folder"] = carpeta  # guardar de qué carpeta viene
        todos_los_wal.extend(archivos_carpeta)
        print(f"  → {len(archivos_carpeta)} archivos encontrados")

    if not todos_los_wal:
        print("No se encontraron archivos WAL en el bucket")
    else:
        # Ordenar globalmente por nombre antes de filtrar
        todos_los_wal.sort(key=lambda x: x["name"])

        total = len(todos_los_wal)
        descargados = 0
        saltados = 0

        for f in todos_los_wal:
            name = f["name"]
            carpeta = f["_folder"]

            if not wal_belongs_to_backup(name, timeline, start_wal):
                saltados += 1
                continue

            print(f"  [OK] Descargando WAL: {name}")
            data = download_with_retry(f"{carpeta}/{name}")
            (wal_local / name).write_bytes(data)
            descargados += 1

        print(f"\nWAL: {descargados} descargados, {saltados} saltados de {total} totales")

    # ----------------------------
    # RECOVERY CONFIG
    # ----------------------------
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
EOF
        """
    ], check=True)

    # ----------------------------
    # CLEANUP
    # ----------------------------
    shutil.rmtree(temp_dir, ignore_errors=True)

    print("\n✓ RESTORE COMPLETADO")
    print("  Ejecuta: docker compose up -d")

    Path("./base-backup/.last_backup").write_text(str(int(time.time())))


if __name__ == "__main__":
    main()