#!/bin/bash
set -e
set -o pipefail

# Timestamp con fecha y hora
DATE=$(date +%F_%H-%M-%S)

BACKUP_ROOT="/basebackup"
BACKUP_DIR="$BACKUP_ROOT/basebackup_$DATE"
ARCHIVE_FILE="$BACKUP_ROOT/basebackup_$DATE.tar.gz"

echo "=========================================="
echo "Iniciando backup: $DATE"
echo "=========================================="

# Validar variables de entorno
if [ -z "$SUPABASE_URL" ]; then
  echo "ERROR: SUPABASE_URL no está definida"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY no está definida"
  exit 1
fi

# Crear directorio si no existe
mkdir -p "$BACKUP_ROOT"

echo "==> Ejecutando pg_basebackup..."
pg_basebackup -D "$BACKUP_DIR" -Fp -Xs -P -U postgres

echo "==> Comprimiendo backup..."
tar -czf "$ARCHIVE_FILE" -C "$BACKUP_ROOT" "basebackup_$DATE"

echo "==> Subiendo a Supabase..."

curl -f -X PUT "$SUPABASE_URL/storage/v1/object/postgres-base/basebackup_$DATE.tar.gz" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/gzip" \
  --data-binary "@$ARCHIVE_FILE"

echo "==> Backup subido correctamente"

# Solo si todo salió bien, limpiar archivos locales
rm -rf "$BACKUP_DIR"
rm -f "$ARCHIVE_FILE"

echo "=========================================="
echo "Backup finalizado correctamente"
echo "=========================================="