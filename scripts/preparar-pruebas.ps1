# Script para preparar el entorno de pruebas
# Ejecutar: .\preparar-pruebas.ps1

Write-Host "🧪 PREPARANDO ENTORNO DE PRUEBAS - ESTATUS COMERCIAL" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar que Docker esté corriendo
Write-Host "📦 Verificando contenedores Docker..." -ForegroundColor Yellow
$containers = docker compose ps --format json | ConvertFrom-Json
$running = $containers | Where-Object { $_.State -eq "running" }

if ($running.Count -lt 4) {
    Write-Host "⚠️  Algunos contenedores no están corriendo. Levantando..." -ForegroundColor Yellow
    docker compose up -d
    Start-Sleep -Seconds 5
} else {
    Write-Host "✅ Todos los contenedores están corriendo" -ForegroundColor Green
}

# 2. Verificar que las columnas existan en BD
Write-Host ""
Write-Host "🗄️  Verificando columnas en base de datos..." -ForegroundColor Yellow

$checkColumns = @"
SELECT 
    COLUMN_NAME, 
    DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'albru' 
  AND TABLE_NAME = 'clientes' 
  AND COLUMN_NAME IN (
    'estatus_comercial_categoria', 
    'estatus_comercial_subcategoria', 
    'seguimiento_status', 
    'derivado_at', 
    'opened_at'
  )
ORDER BY COLUMN_NAME;
"@

$columns = docker exec albru-base mysql -u albru -palbru12345 albru -e $checkColumns 2>$null

if ($columns -match "estatus_comercial_categoria") {
    Write-Host "✅ Columnas de estatus comercial existen" -ForegroundColor Green
} else {
    Write-Host "❌ Columnas faltantes. Aplicando migración..." -ForegroundColor Red
    Get-Content backend\migrations\003_add_seguimiento_columns.sql | docker exec -i albru-base mysql -u albru -palbru12345 albru
    Write-Host "✅ Migración aplicada" -ForegroundColor Green
}

# 3. Crear clientes de prueba si no existen
Write-Host ""
Write-Host "👥 Verificando clientes de prueba..." -ForegroundColor Yellow

$countClientes = docker exec albru-base mysql -u albru -palbru12345 albru -e "SELECT COUNT(*) as total FROM clientes;" 2>$null | Select-String -Pattern "\d+"

if ($countClientes -match "0|^1$") {
    Write-Host "⚠️  Pocos clientes en BD. Considera agregar algunos manualmente" -ForegroundColor Yellow
} else {
    Write-Host "✅ Hay $($countClientes.Matches.Value) clientes disponibles" -ForegroundColor Green
}

# 4. Ver URLs de acceso
Write-Host ""
Write-Host "🌐 URLs DE ACCESO:" -ForegroundColor Cyan
Write-Host "  Frontend:   http://localhost:5173" -ForegroundColor White
Write-Host "  Frontend Dev: http://localhost:5174 (con HMR)" -ForegroundColor White
Write-Host "  Backend:    http://localhost:3001" -ForegroundColor White
Write-Host "  Adminer:    http://localhost:8080" -ForegroundColor White

# 5. Mostrar comandos útiles
Write-Host ""
Write-Host "📝 COMANDOS ÚTILES PARA PRUEBAS:" -ForegroundColor Cyan
Write-Host "  docker compose logs -f backend    # Ver logs backend" -ForegroundColor Gray
Write-Host "  docker compose logs -f frontend   # Ver logs frontend" -ForegroundColor Gray
Write-Host "  docker exec -it albru-base mysql -u albru -palbru12345 albru  # MySQL CLI" -ForegroundColor Gray

# 6. Query de prueba
Write-Host ""
Write-Host "🔍 Ver últimos clientes actualizados:" -ForegroundColor Cyan
Write-Host @"
docker exec albru-base mysql -u albru -palbru12345 albru -e "
SELECT 
    id, 
    nombre, 
    estatus_comercial_categoria as categoria, 
    estatus_comercial_subcategoria as subcategoria,
    wizard_completado,
    updated_at 
FROM clientes 
ORDER BY updated_at DESC 
LIMIT 5;
"
"@ -ForegroundColor Gray

Write-Host ""
Write-Host "✅ ENTORNO LISTO PARA PRUEBAS!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Lee el archivo PRUEBAS-ESTATUS-COMERCIAL.md para el plan completo de pruebas" -ForegroundColor Yellow
Write-Host ""
