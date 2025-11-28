# Script para configurar reglas de firewall para permitir acceso LAN a la aplicación Albru
# Ejecutar como Administrador

param(
    [string]$LanSubnet = "192.168.1.0/24",
    [int[]]$Ports = @(3001, 5173, 8080),
    [switch]$Remove
)

Write-Host "=== Configuración de Firewall para Albru ===" -ForegroundColor Green

if ($Remove) {
    Write-Host "Eliminando reglas de firewall existentes..." -ForegroundColor Yellow
    
    foreach ($port in $Ports) {
        $ruleName = "Allow_Albru_Port_${port}_LAN"
        $blockRuleName = "Block_Albru_Port_${port}_Public"
        
        try {
            Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
            Remove-NetFirewallRule -DisplayName $blockRuleName -ErrorAction SilentlyContinue
            Write-Host "✓ Eliminadas reglas para puerto $port" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠ Error eliminando reglas para puerto $port" -ForegroundColor Yellow
        }
    }
    
    Write-Host "Reglas eliminadas." -ForegroundColor Green
    exit 0
}

Write-Host "Configurando acceso para subred: $LanSubnet" -ForegroundColor Cyan
Write-Host "Puertos: $($Ports -join ', ')" -ForegroundColor Cyan

# Verificar si se ejecuta como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    exit 1
}

foreach ($port in $Ports) {
    $ruleName = "Allow_Albru_Port_${port}_LAN"
    $blockRuleName = "Block_Albru_Port_${port}_Public"
    
    try {
        # Eliminar reglas existentes si existen
        Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
        Remove-NetFirewallRule -DisplayName $blockRuleName -ErrorAction SilentlyContinue
        
        # Crear regla para permitir acceso desde la LAN
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow -RemoteAddress $LanSubnet -Profile Any
        Write-Host "✓ Puerto $port: permitido desde $LanSubnet" -ForegroundColor Green
        
        # Crear regla para bloquear acceso público (opcional, comentar si no se desea)
        # New-NetFirewallRule -DisplayName $blockRuleName -Direction Inbound -LocalPort $port -Protocol TCP -Action Block -Profile Public
        # Write-Host "✓ Puerto $port: bloqueado para acceso público" -ForegroundColor Green
        
    }
    catch {
        Write-Host "❌ Error configurando puerto $port`: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Configuración completada ===" -ForegroundColor Green
Write-Host "Los siguientes puertos están configurados para acceso LAN:" -ForegroundColor Cyan
Write-Host "- 3001: Backend API" -ForegroundColor White
Write-Host "- 5173: Frontend (Vite dev server o NGINX)" -ForegroundColor White
Write-Host "- 8080: Adminer (administrador de BD)" -ForegroundColor White
Write-Host ""
Write-Host "Para probar desde otra máquina en la red:" -ForegroundColor Yellow
Write-Host "  curl http://[IP_LAPTOP]:3001/" -ForegroundColor Gray
Write-Host "  http://[IP_LAPTOP]:5173 (navegador)" -ForegroundColor Gray
Write-Host ""
Write-Host "Para eliminar estas reglas, ejecuta:" -ForegroundColor Yellow  
Write-Host "  .\configure-firewall-lan.ps1 -Remove" -ForegroundColor Gray