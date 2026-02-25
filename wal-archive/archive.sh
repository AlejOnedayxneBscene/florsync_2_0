#!/bin/bash

WAL_PATH=$1
WAL_FILE=$2

curl -X PUT "$SUPABASE_URL/storage/v1/object/postgres-wal/$WAL_FILE" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/octet-stream" \
  --data-binary "@$WAL_PATH"