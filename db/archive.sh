#!/bin/bash
set -e

WAL_PATH="$1"
WAL_FILE="$2"

echo "Uploading WAL: $WAL_FILE"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PUT "$SUPABASE_URL/storage/v1/object/postgres-wal/$WAL_FILE" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/octet-stream" \
  --data-binary "@$WAL_PATH")

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
  echo "WAL uploaded successfully"
  exit 0
else
  echo "WAL upload failed with status $HTTP_STATUS"
  exit 1
fi