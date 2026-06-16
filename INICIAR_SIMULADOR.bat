@echo off
chcp 65001 >nul 2>&1
title Simulador Movil AX-CORE - Motor encendido
color 0B
cd /d "%~dp0"

cls
echo.
echo  ═══════════════════════════════════════════════════════════
echo.
echo            SIMULADOR + EDITOR MOVIL AX-CORE
echo            Motor de servidor local
echo.
echo  ═══════════════════════════════════════════════════════════
echo.

REM ─── Verificar Node.js ─────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  [ X ]  ERROR — Node.js NO esta instalado.
    echo.
    echo  Para que el simulador funcione necesitas Node.js.
    echo  Es gratis y se instala en 2 minutos:
    echo.
    echo     1. Abre tu navegador
    echo     2. Ve a:  https://nodejs.org
    echo     3. Descarga la version LTS ^(la grande verde^)
    echo     4. Instala con Siguiente, Siguiente, Siguiente...
    echo     5. Vuelve a dar doble click a este archivo
    echo.
    echo  ═══════════════════════════════════════════════════════════
    pause
    exit /b 1
)

for /f "delims=" %%v in ('node --version 2^>nul') do set NODEVER=%%v
echo   [ OK ]  Node.js detectado: %NODEVER%

REM ─── Verificar que existen los archivos ────────────────────
if not exist "dev-server.js" (
    color 0C
    echo.
    echo  [ X ]  ERROR — No encuentro el archivo dev-server.js
    echo.
    echo  Asegurate de que este .bat este en la misma carpeta
    echo  que dev-server.js y SIMULADOR_MOVIL.html
    echo.
    pause
    exit /b 1
)
echo   [ OK ]  Archivos del simulador encontrados

REM ─── Verificar puerto 5500 ─────────────────────────────────
netstat -ano | findstr ":5500 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    color 0E
    echo.
    echo  [ ! ]  El puerto 5500 ya esta en uso.
    echo         Probablemente ya tienes el simulador abierto
    echo         en otra ventana. Abre tu navegador en:
    echo.
    echo              http://localhost:5500
    echo.
    echo  Si no es eso, cierra todas las ventanas negras
    echo  y vuelve a intentar.
    echo.
    pause
    exit /b 1
)

echo   [ OK ]  Puerto 5500 disponible
echo.
echo  ═══════════════════════════════════════════════════════════
echo.
echo     Encendiendo motor del servidor...
echo     ^(NO cierres esta ventana — es el motor^)
echo.

REM ─── Abrir navegador con retraso ───────────────────────────
start /MIN cmd /c "timeout /T 2 /NOBREAK >nul && start http://localhost:5500/SIMULADOR_MOVIL.html"

REM ─── Arrancar servidor ─────────────────────────────────────
node dev-server.js

REM ─── Si el servidor se cae ─────────────────────────────────
echo.
color 0E
echo  ═══════════════════════════════════════════════════════════
echo     El motor se detuvo.
echo     Presiona una tecla para cerrar esta ventana.
echo  ═══════════════════════════════════════════════════════════
pause >nul
