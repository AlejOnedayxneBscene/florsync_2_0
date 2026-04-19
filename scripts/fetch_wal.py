#!/usr/bin/env python3

import sys
from supabase import create_client
from dotenv import dotenv_values

def main():
    if len(sys.argv) != 3:
        sys.exit(1)

    wal_name = sys.argv[1]   # nombre del WAL
    dest_path = sys.argv[2]  # dónde guardarlo

    env = dotenv_values("/scripts/.env")

    client = create_client(
        env["SUPABASE_URL"],
        env["SUPABASE_SERVICE_ROLE_KEY"]
    )

    bucket = env.get("SUPABASE_BUCKET", "backups")

    # ⚠️ Ajusta esto según tu estructura actual
    remote_path = f"wal/{wal_name}"

    try:
        data = client.storage.from_(bucket).download(remote_path)

        with open(dest_path, "wb") as f:
            f.write(data)

        print(f"WAL restaurado: {wal_name}")
        sys.exit(0)

    except Exception as e:
        print(f"No se encontró WAL: {wal_name}")
        sys.exit(1)

if __name__ == "__main__":
    main()