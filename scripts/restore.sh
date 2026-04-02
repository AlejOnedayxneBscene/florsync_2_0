#!/bin/bash
set -e

BACKUP_NAME=$1  # Ej: base_20260402_180205

if [ -z "$BACKUP_NAME" ]; then
  echo "❌ Uso: ./restore.sh <nombre_del_backup>"
  echo "   Ej: ./restore.sh base_20260402_180205"
  exit 1
fi

# Cargar variables del .env
export $(grep -v '^#' .env | xargs)

TEMP_DIR="./tmp_restore"
DATA_DIR="./postgres_data_restore"

echo "🔽 Descargando backup desde Supabase..."
mkdir -p $TEMP_DIR

# Descargar usando Python/Supabase
docker run --rm \
  --env-file .env \
  -v $(pwd)/$TEMP_DIR:/tmp/restore \
  florsync_2_0-backup \
  python -c "
from supabase import create_client
import os

client = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_KEY'])
bucket = os.environ.get('SUPABASE_BUCKET', 'backups')

year_month = '${BACKUP_NAME}'[5:12].replace('_', '/')[:7]
remote = f'base/{year_month}/${BACKUP_NAME}.tar.gz'

print(f'📥 Descargando: {remote}')
data = client.storage.from_(bucket).download(remote)
with open('/tmp/restore/${BACKUP_NAME}.tar.gz', 'wb') as f:
    f.write(data)
print('✅ Descarga completa')
"

echo "🗑️  Limpiando volumen de Postgres..."
docker volume rm florsync_2_0_postgres_data 2>/dev/null || true
docker volume create florsync_2_0_postgres_data

echo "📦 Extrayendo backup en el volumen..."
docker run --rm \
  -v florsync_2_0_postgres_data:/var/lib/postgresql/data \
  -v $(pwd)/$TEMP_DIR:/tmp/restore \
  postgres:15 \
  bash -c "
    rm -rf /var/lib/postgresql/data/* &&
    tar -xzf /tmp/restore/${BACKUP_NAME}.tar.gz -C /var/lib/postgresql/data --strip-components=1
  "

echo "🧹 Limpiando temporales..."
rm -rf $TEMP_DIR

echo "✅ Restore completado. Ahora corre: docker compose up"