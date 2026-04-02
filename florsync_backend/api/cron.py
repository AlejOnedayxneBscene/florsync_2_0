
# api/cron.py

from django.core.management import call_command

def upload_wal_job():
    call_command('upload_wal')

def backup_full_job():
    call_command('backup_db', '--full')

def backup_incremental_job():
    call_command('backup_db')