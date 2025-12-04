@echo off
REM Iniciar servidor de Ferretería
cd /d "%~dp0"
echo Iniciando servidor en puerto 3000...
echo.
echo Abre tu navegador en: http://localhost:3000/public/admin.html
echo.
node server.js
pause
