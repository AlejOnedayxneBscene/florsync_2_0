@echo off
echo ==========================
echo BACKUP FLORSYNC (DOCKER)
echo ==========================

:: CONFIG
set CONTENEDOR=florsync_2_0-db-1
set DB_NAME=FlorsyncBD
set DB_USER=postgres

:: Ruta de Docker (IMPORTANTE)
set DOCKER_PATH=C:\Program Files\Docker\Docker\resources\bin\docker.exe

:: Carpeta base
set BASE_DIR=C:\backup_florsync

:: Fecha
set FECHA=%date:~-4%-%date:~3,2%-%date:~0,2%_%time:~0,2%%time:~3,2%
set FECHA=%FECHA: =0%

:: Carpeta destino
set DESTINO=%BASE_DIR%\%FECHA%

:: Crear carpetas automáticamente
if not exist %BASE_DIR% mkdir %BASE_DIR%
if not exist %DESTINO% mkdir %DESTINO%

::  BACKUP DESDE DOCKER (USANDO RUTA COMPLETA)
"%DOCKER_PATH%" exec -t %CONTENEDOR% pg_dump -U %DB_USER% -d %DB_NAME% > %DESTINO%\backup.sql

if %errorlevel% neq 0 (
    echo ERROR: No se pudo hacer el backup
    exit /b
)

echo Backup completado correctamente