# Script para abrir puertos de Albru en el Firewall de Windows
# EJECUTAR COMO ADMINISTRADOR

Write-Host "🔥 Configurando Firewall de Windows para Albru..." -ForegroundColor Cyan

# Verificar si ya existen las reglas
$rule5173 = Get-NetFirewallRule -DisplayName "Albru Frontend (5173)" -ErrorAction SilentlyContinue
$rule3001 = Get-NetFirewallRule -DisplayName "Albru Backend (3001)" -ErrorAction SilentlyContinue

# Crear regla para puerto 5173 (Frontend con Nginx)
if ($rule5173) {
    Write-Host "✅ Regla para puerto 5173 ya existe" -ForegroundColor Green
} else {
    New-NetFirewallRule -DisplayName "Albru Frontend (5173)" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 5173 `
        -Action Allow `
        -Profile Any `
        -Enabled True
    Write-Host "✅ Puerto 5173 abierto en el firewall" -ForegroundColor Green
}

# Crear regla para puerto 3001 (Backend API)
if ($rule3001) {
    Write-Host "✅ Regla para puerto 3001 ya existe" -ForegroundColor Green
} else {
    New-NetFirewallRule -DisplayName "Albru Backend (3001)" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 3001 `
        -Action Allow `
        -Profile Any `
        -Enabled True
    Write-Host "✅ Puerto 3001 abierto en el firewall" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Firewall configurado correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora puedes acceder desde otras PCs en tu red:" -ForegroundColor Yellow
Write-Host "  Frontend: http://192.168.1.44:5173" -ForegroundColor White
Write-Host "  Backend:  http://192.168.1.44:3001" -ForegroundColor White
Write-Host ""

# Verificar las reglas
Write-Host "📋 Reglas de firewall creadas:" -ForegroundColor Cyan
Get-NetFirewallRule -DisplayName "Albru*" | Select-Object DisplayName, Enabled, Direction, Action | Format-Table -AutoSize

# Test de conectividad
Write-Host ""
Write-Host "🔍 Probando conectividad..." -ForegroundColor Cyan
$test5173 = Test-NetConnection -ComputerName 192.168.1.44 -Port 5173 -WarningAction SilentlyContinue
$test3001 = Test-NetConnection -ComputerName 192.168.1.44 -Port 3001 -WarningAction SilentlyContinue

if ($test5173.TcpTestSucceeded) {
    Write-Host "✅ Puerto 5173 accesible" -ForegroundColor Green
} else {
    Write-Host "❌ Puerto 5173 NO accesible" -ForegroundColor Red
}

if ($test3001.TcpTestSucceeded) {
    Write-Host "✅ Puerto 3001 accesible" -ForegroundColor Green
} else {
    Write-Host "❌ Puerto 3001 NO accesible" -ForegroundColor Red
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
