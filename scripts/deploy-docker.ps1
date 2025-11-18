# =============================================
# Script de despliegue automático con Docker
# =============================================
# Este script prepara y levanta todos los servicios de Albru-Brunario

Write-Host "=== ALBRU-BRUNARIO DOCKER DEPLOYMENT ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker está instalado y corriendo
Write-Host "Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker version --format "{{.Client.Version}}"
    Write-Host "✓ Docker instalado (versión: $dockerVersion)" -ForegroundColor Green
}
catch {
    Write-Host "✗ Error: Docker no está instalado o no está corriendo" -ForegroundColor Red
    Write-Host "Instala Docker Desktop y asegúrate de que esté corriendo" -ForegroundColor Red
    exit 1
}

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "✗ Error: No se encuentra docker-compose.yml" -ForegroundColor Red
    Write-Host "Ejecuta este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Crear .env si no existe
if (-not (Test-Path ".env")) {
    Write-Host "Creando archivo .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Archivo .env creado desde .env.example" -ForegroundColor Green
    Write-Host "Puedes editar .env si necesitas cambiar las credenciales" -ForegroundColor Blue
} else {
    Write-Host "✓ Archivo .env ya existe" -ForegroundColor Green
}

# Verificar conflicto de puerto MySQL (3306)
Write-Host "Verificando puerto 3306..." -ForegroundColor Yellow
$port3306 = Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue
if ($port3306) {
    Write-Host "⚠ Advertencia: El puerto 3306 está ocupado" -ForegroundColor Yellow
    Write-Host "Si tienes MySQL local corriendo, considera detenerlo con:" -ForegroundColor Blue
    Write-Host "Stop-Service MySQL80" -ForegroundColor Blue
    Write-Host ""
    $continue = Read-Host "¿Continuar de todos modos? (s/N)"
    if ($continue -ne "s" -and $continue -ne "S") {
        Write-Host "Despliegue cancelado" -ForegroundColor Red
        exit 1
    }
}

# Limpiar contenedores previos y volúmenes (empezar limpio)
Write-Host "Limpiando contenedores y volúmenes previos..." -ForegroundColor Yellow
docker compose down -v 2>$null
Write-Host "✓ Limpieza completada" -ForegroundColor Green

# Levantar servicios
Write-Host "Levantando servicios con Docker Compose..." -ForegroundColor Yellow
docker compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Servicios levantados correctamente" -ForegroundColor Green
} else {
    Write-Host "✗ Error al levantar los servicios" -ForegroundColor Red
    Write-Host "Revisa los logs con: docker compose logs" -ForegroundColor Blue
    exit 1
}

# Esperar un momento para que los servicios inicialicen
Write-Host "Esperando que los servicios inicialicen..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Mostrar estado de los contenedores
Write-Host "Estado de los contenedores:" -ForegroundColor Yellow
docker compose ps

# Mostrar logs recientes
Write-Host "" 
Write-Host "=== LOGS DE LA BASE DE DATOS ===" -ForegroundColor Cyan
docker compose logs db --tail 10

Write-Host ""
Write-Host "=== LOGS DEL BACKEND ===" -ForegroundColor Cyan
docker compose logs backend --tail 10

# Verificar que el backend responde
Write-Host ""
Write-Host "Verificando endpoint del backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/clientes/1" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✓ Backend responde correctamente" -ForegroundColor Green
    Write-Host "Respuesta: $($response | ConvertTo-Json -Compress)" -ForegroundColor Blue
}
catch {
    Write-Host "⚠ El backend aún no responde (puede necesitar más tiempo)" -ForegroundColor Yellow
    Write-Host "Puedes probarlo manualmente con: Invoke-RestMethod -Uri 'http://localhost:3001/api/clientes/1' -Method GET" -ForegroundColor Blue
}

Write-Host ""
Write-Host "=== DESPLIEGUE COMPLETADO ===" -ForegroundColor Green
Write-Host "🌐 Backend:  http://localhost:3001" -ForegroundColor Blue
Write-Host "🗄️ Adminer: http://localhost:8080" -ForegroundColor Blue
Write-Host ""
Write-Host "Para Adminer usa:" -ForegroundColor Blue
Write-Host "  - Servidor: db" -ForegroundColor Blue
Write-Host "  - Usuario: root o albru" -ForegroundColor Blue
Write-Host "  - Contraseña: la de tu archivo .env" -ForegroundColor Blue
Write-Host ""
Write-Host "Comandos útiles:" -ForegroundColor Yellow
Write-Host "  docker compose ps          # Ver estado de contenedores" -ForegroundColor Blue
Write-Host "  docker compose logs -f     # Ver logs en tiempo real" -ForegroundColor Blue
Write-Host "  docker compose down        # Parar servicios" -ForegroundColor Blue
Write-Host "  docker compose down -v     # Parar y limpiar volúmenes" -ForegroundColor Blue