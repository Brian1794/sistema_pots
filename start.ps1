# Script para iniciar el servidor de Ferretería
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  FERRETERÍA - Sistema de Gestión" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del proyecto
Set-Location -Path $PSScriptRoot
Write-Host "📁 Directorio: $PSScriptRoot" -ForegroundColor Green
Write-Host ""

# Verificar si Node.js está instalado
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Error: Node.js no está instalado" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Detener procesos node anteriores si existen
Write-Host "Verificando procesos anteriores..." -ForegroundColor Yellow
$processes = Get-Process -Name node -ErrorAction SilentlyContinue
if ($processes) {
    Write-Host "  Deteniendo procesos node anteriores..." -ForegroundColor Yellow
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
}

# Iniciar servidor
Write-Host ""
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Cyan
Write-Host ""
Write-Host "   ► Puerto: 3000" -ForegroundColor Cyan
Write-Host "   ► URL: http://localhost:3000/public/admin.html" -ForegroundColor Cyan
Write-Host "   ► Login: admin / admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Ejecutar servidor
node server.js
