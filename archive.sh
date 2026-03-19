#!/bin/bash

set -e

WAL_PATH=$1
WAL_NAME=$2

echo "Subiendo WAL: $WAL_NAME"

curl -X PUT "$SUPABASE_URL/storage/v1/object/$SUPABASE_BUCKET/$WAL_NAME" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @"$WAL_PATH"

echo "WAL $WAL_NAME subido correctamente"