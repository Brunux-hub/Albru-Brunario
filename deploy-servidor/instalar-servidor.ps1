# 🚀 Script de Instalación en Servidor
# Ejecutar este script EN EL SERVIDOR después de copiar los archivos

param(
    [string]$ServerIP = ""
)

Write-Host "🚀 INSTALACIÓN DE ALBRU EN SERVIDOR" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "   Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Paso 1: Obtener IP del servidor
if ($ServerIP -eq "") {
    Write-Host "🌐 Paso 1: Detectando IP del servidor..." -ForegroundColor Yellow
    $adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.InterfaceAlias -notlike "*Loopback*" -and 
        $_.IPAddress -notlike "169.254.*" -and
        $_.IPAddress -ne "127.0.0.1"
    }
    
    if ($adapters.Count -gt 0) {
        $ServerIP = $adapters[0].IPAddress
        Write-Host "✅ IP detectada automáticamente: $ServerIP" -ForegroundColor Green
        
        if ($adapters.Count -gt 1) {
            Write-Host ""
            Write-Host "⚠️ Se detectaron múltiples IPs:" -ForegroundColor Yellow
            foreach ($adapter in $adapters) {
                Write-Host "   • $($adapter.IPAddress) ($($adapter.InterfaceAlias))" -ForegroundColor Gray
            }
            Write-Host ""
            $userIP = Read-Host "¿Es correcta la IP $ServerIP? (S/n) o ingresa otra IP"
            if ($userIP -ne "" -and $userIP -ne "S" -and $userIP -ne "s") {
                $ServerIP = $userIP
            }
        }
    } else {
        Write-Host "❌ No se pudo detectar la IP automáticamente" -ForegroundColor Red
        $ServerIP = Read-Host "Ingresa la IP del servidor manualmente"
    }
} else {
    Write-Host "✅ Usando IP proporcionada: $ServerIP" -ForegroundColor Green
}
Write-Host ""

# Paso 2: Configurar .env
Write-Host "⚙️ Paso 2: Configurando archivo .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    $envContent = $envContent -replace "192\.168\.1\.XXX", $ServerIP
    $envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline
    Write-Host "✅ Archivo .env configurado con IP: $ServerIP" -ForegroundColor Green
} else {
    Write-Host "❌ No se encontró el archivo .env" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Paso 3: Verificar archivos necesarios
Write-Host "📋 Paso 3: Verificando archivos necesarios..." -ForegroundColor Yellow
$requiredFiles = @("docker-compose.yml", "Dockerfile", "package.json")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Faltan archivos necesarios. Verifica la carpeta." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Todos los archivos necesarios están presentes" -ForegroundColor Green
Write-Host ""

# Paso 4: Limpiar contenedores anteriores (si existen)
Write-Host "🧹 Paso 4: Limpiando contenedores anteriores..." -ForegroundColor Yellow
docker compose down 2>$null
Write-Host "✅ Limpieza completada" -ForegroundColor Green
Write-Host ""

# Paso 5: Construir y levantar contenedores
Write-Host "🐳 Paso 5: Construyendo y levantando contenedores..." -ForegroundColor Yellow
Write-Host "   (Esto puede tardar varios minutos la primera vez)" -ForegroundColor Gray
Write-Host ""
docker compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Contenedores levantados exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al levantar contenedores" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Paso 6: Esperar a que MySQL esté listo
Write-Host "⏳ Paso 6: Esperando a que MySQL esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "✅ MySQL debería estar listo" -ForegroundColor Green
Write-Host ""

# Paso 7: Importar base de datos
Write-Host "🗄️ Paso 7: Importando base de datos..." -ForegroundColor Yellow
if (Test-Path "database\init.sql") {
    $dbSize = (Get-Item "database\init.sql").Length / 1MB
    Write-Host "   Importando $([math]::Round($dbSize, 2)) MB de datos..." -ForegroundColor Gray
    
    Get-Content "database\init.sql" | docker exec -i albru-base mysql -u albru -palbru12345 albru 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Base de datos importada exitosamente" -ForegroundColor Green
        
        # Verificar usuarios
        Write-Host "   Verificando usuarios..." -ForegroundColor Gray
        $userCount = docker exec albru-base mysql -u albru -palbru12345 -s -N -e "SELECT COUNT(*) FROM albru.usuarios;" 2>$null
        Write-Host "   ✓ $userCount usuarios encontrados en la base de datos" -ForegroundColor Gray
    } else {
        Write-Host "❌ Error al importar base de datos" -ForegroundColor Red
    }
} else {
    Write-Host "❌ No se encontró database\init.sql" -ForegroundColor Red
}
Write-Host ""

# Paso 8: Configurar Firewall
Write-Host "🔥 Paso 8: Configurando Firewall de Windows..." -ForegroundColor Yellow
Write-Host "   (Requiere permisos de Administrador)" -ForegroundColor Gray

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    try {
        # Puerto 80 (Frontend)
        $rule80 = Get-NetFirewallRule -DisplayName "Albru Frontend" -ErrorAction SilentlyContinue
        if ($null -eq $rule80) {
            New-NetFirewallRule -DisplayName "Albru Frontend" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow | Out-Null
            Write-Host "  ✓ Puerto 80 (Frontend) abierto" -ForegroundColor Gray
        } else {
            Write-Host "  ✓ Puerto 80 ya estaba abierto" -ForegroundColor Gray
        }
        
        # Puerto 3001 (Backend)
        $rule3001 = Get-NetFirewallRule -DisplayName "Albru Backend" -ErrorAction SilentlyContinue
        if ($null -eq $rule3001) {
            New-NetFirewallRule -DisplayName "Albru Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow | Out-Null
            Write-Host "  ✓ Puerto 3001 (Backend) abierto" -ForegroundColor Gray
        } else {
            Write-Host "  ✓ Puerto 3001 ya estaba abierto" -ForegroundColor Gray
        }
        
        Write-Host "✅ Firewall configurado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Error al configurar firewall: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   Configura manualmente si es necesario" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️ No se ejecutó como Administrador" -ForegroundColor Yellow
    Write-Host "   Para abrir puertos en el firewall, ejecuta como Administrador:" -ForegroundColor Gray
    Write-Host "   New-NetFirewallRule -DisplayName 'Albru Frontend' -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow" -ForegroundColor DarkGray
    Write-Host "   New-NetFirewallRule -DisplayName 'Albru Backend' -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow" -ForegroundColor DarkGray
}
Write-Host ""

# Paso 9: Verificar estado
Write-Host "✅ Paso 9: Verificando estado de los servicios..." -ForegroundColor Yellow
Write-Host ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""

# Resumen final
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "✅ INSTALACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🌐 URLs de Acceso:" -ForegroundColor Cyan
Write-Host "  • Frontend: http://$ServerIP" -ForegroundColor White
Write-Host "  • API Backend: http://${ServerIP}:3001" -ForegroundColor White
Write-Host "  • Health Check: http://${ServerIP}:3001/health" -ForegroundColor White
Write-Host ""

Write-Host "🔑 Credenciales:" -ForegroundColor Cyan
Write-Host "  • Admin: admin@albru.com / admin123" -ForegroundColor White
Write-Host "  • GTR: mcaceresv@albru.pe / password" -ForegroundColor White
Write-Host "  • Asesor: jvenancioo@albru.pe / password" -ForegroundColor White
Write-Host ""

Write-Host "📱 Comandos Útiles:" -ForegroundColor Cyan
Write-Host "  • Ver logs: docker compose logs -f" -ForegroundColor Gray
Write-Host "  • Reiniciar: docker compose restart" -ForegroundColor Gray
Write-Host "  • Detener: docker compose down" -ForegroundColor Gray
Write-Host "  • Estado: docker ps" -ForegroundColor Gray
Write-Host ""

Write-Host "🎉 ¡Sistema listo para usar!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Prueba accediendo desde cualquier PC en la red:" -ForegroundColor Yellow
Write-Host "   http://$ServerIP" -ForegroundColor White
Write-Host ""
