#!/bin/bash

set -e

WAL_PATH="$1"
WAL_NAME="$2"

echo "Subiendo WAL: $WAL_NAME"

if [ ! -f "$WAL_PATH" ]; then
  echo "Error: archivo no existe"
  exit 1
fi

curl -X POST "$SUPABASE_URL/storage/v1/object/$SUPABASE_BUCKET/$WAL_NAME" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -F "file=@$WAL_PATH" \
  -w "\nHTTP STATUS: %{http_code}\n"

echo "WAL $WAL_NAME subido correctamente"