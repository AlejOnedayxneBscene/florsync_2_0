::[Bat To Exe Converter]
::
::YAwzoRdxOk+EWAjk
::fBw5plQjdCyDJGyX8VAjFBpYSQ6DAE+/Fb4I5/jH6eaIsF4EWuEAcYzU1PqHI+9z
::YAwzuBVtJxjWCl3EqQJgSA==
::ZR4luwNxJguZRRnk
::Yhs/ulQjdF+5
::cxAkpRVqdFKZSDk=
::cBs/ulQjdF65
::ZR41oxFsdFKZSDk=
::eBoioBt6dFKZSDk=
::cRo6pxp7LAbNWATEpCI=
::egkzugNsPRvcWATEpCI=
::dAsiuh18IRvcCxnZtBJQ
::cRYluBh/LU+EWAnk
::YxY4rhs+aU+JeA==
::cxY6rQJ7JhzQF1fEqQJQ
::ZQ05rAF9IBncCkqN+0xwdVs0
::ZQ05rAF9IAHYFVzEqQJQ
::eg0/rx1wNQPfEVWB+kM9LVsJDGQ=
::fBEirQZwNQPfEVWB+kM9LVsJDGQ=
::cRolqwZ3JBvQF1fEqQJQ
::dhA7uBVwLU+EWDk=
::YQ03rBFzNR3SWATElA==
::dhAmsQZ3MwfNWATElA==
::ZQ0/vhVqMQ3MEVWAtB9wSA==
::Zg8zqx1/OA3MEVWAtB9wSA==
::dhA7pRFwIByZRRnk
::Zh4grVQjdCyDJGyX8VAjFBpYSQ6DAE+/Fb4I5/jH6eaIsF4EWuFxfZfeug==
::YB416Ek+ZG8=
::
::
::978f952a14a936cc963da21a135fa983
@echo off
setlocal enabledelayedexpansion

:: Verificar si Docker Desktop está abierto
tasklist /FI "IMAGENAME eq Docker Desktop.exe" | find /I "Docker Desktop.exe" >nul
IF ERRORLEVEL 1 (
    echo Iniciando Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    timeout /t 10 /nobreak >nul
) 

:: Buscar docker-compose.yml en la carpeta actual
if exist "%CD%\docker-compose.yml" (
    set "COMPOSE_PATH=%CD%"
    goto Encontrado
)

:: Buscar en niveles superiores (hasta 5 niveles arriba)
set "CURRENT_DIR=%CD%"
for /L %%i in (1,1,5) do (
    for %%A in ("!CURRENT_DIR!\..") do set "CURRENT_DIR=%%~fA"
    if exist "!CURRENT_DIR!\docker-compose.yml" (
        set "COMPOSE_PATH=!CURRENT_DIR!"
        goto Encontrado
    )
)

:: Buscar en subcarpetas dentro del directorio actual
for /d %%D in ("%CD%\*") do (
    if exist "%%D\docker-compose.yml" (
        set "COMPOSE_PATH=%%D"
        goto Encontrado
    )
)

:: Si no se encontró el archivo, mostrar mensaje y salir
echo ERROR: No se encontró docker-compose.yml en la carpeta actual, niveles superiores o subcarpetas.
pause
exit /b

:Encontrado

cd /d "%COMPOSE_PATH%"

:: Iniciar contenedores en segundo plano
docker compose up -d
if errorlevel 1 (
    echo ERROR: No se pudieron iniciar los contenedores.
    pause
    exit /b
)

:: Esperar 5 segundos antes de abrir la app
timeout /t 5 /nobreak >nul

:: Verificar si la app ya está abierta en el navegador
tasklist /FI "IMAGENAME eq chrome.exe" | find /I "chrome.exe" >nul
IF ERRORLEVEL 1 (
    echo Abriendo la aplicación en el navegador...
    start "" "http://localhost:5173"
) ELSE (
    echo Redirigiendo a la pestaña ya abierta...
    start chrome --new-tab "http://localhost:5173"
)

exit
