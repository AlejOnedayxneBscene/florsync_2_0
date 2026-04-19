#!/bin/sh

LAST=/basebackup/.last_backup
INTERVAL=259200  # 3 días en segundos

sleep 30

while true; do
  NOW=$(date +%s)

  if [ ! -f "$LAST" ]; then
    echo " Primer backup..."
    python manage.py basebackup && date +%s > "$LAST"
  else
    LAST_TIME=$(cat "$LAST")
    DIFF=$((NOW - LAST_TIME))
    if [ "$DIFF" -ge "$INTERVAL" ]; then
      echo " Han pasado 3 días, ejecutando backup..."
      python manage.py basebackup && date +%s > "$LAST"
    else
      REMAINING=$(( (INTERVAL - DIFF) / 3600 ))
      echo " Próximo backup en ~${REMAINING}h"
    fi
  fi

  sleep 3600
done