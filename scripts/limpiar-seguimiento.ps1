#!/usr/bin/env pwsh
# Script para limpiar clientes derivados y resetear el sistema de seguimiento

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  LIMPIEZA DE CLIENTES DERIVADOS - RESET DE SEGUIMIENTO" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  ADVERTENCIA: Esta operación limpiará:" -ForegroundColor Yellow
Write-Host "   - seguimiento_status de todos los clientes" -ForegroundColor White
Write-Host "   - derivado_at, opened_at" -ForegroundColor White
Write-Host "   - asesor_asignado" -ForegroundColor White
Write-Host "   - Todos los locks de clientes" -ForegroundColor White
Write-Host ""

$confirmacion = Read-Host "¿Deseas continuar? (S/N)"

if ($confirmacion -ne "S" -and $confirmacion -ne "s") {
    Write-Host "Operación cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🗑️  Limpiando datos..." -ForegroundColor Yellow

try {
    # Ejecutar limpieza en MySQL
    $sql = @"
UPDATE clientes 
SET 
  seguimiento_status = NULL,
  derivado_at = NULL,
  opened_at = NULL,
  asesor_asignado = NULL,
  updated_at = NOW() 
WHERE seguimiento_status IS NOT NULL;

DELETE FROM cliente_locks;

SELECT COUNT(*) as clientes_limpiados FROM clientes WHERE seguimiento_status IS NULL;
"@

    $result = docker exec -i albru-base sh -c "mysql -uroot -proot_password_here albru -e `"$sql`""
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Limpieza completada exitosamente" -ForegroundColor Green
        Write-Host ""
        
        # Mostrar estadísticas
        Write-Host "📊 Estadísticas:" -ForegroundColor Cyan
        Write-Host $result
        
        # Mostrar algunos clientes disponibles
        Write-Host ""
        Write-Host "📋 Clientes disponibles para pruebas:" -ForegroundColor Cyan
        
        $clientes = docker exec -i albru-base sh -c "mysql -uroot -proot_password_here albru -e 'SELECT id, COALESCE(nombre, \`"Sin nombre\`") as nombre, COALESCE(telefono, \`"Sin teléfono\`") as telefono FROM clientes ORDER BY id LIMIT 5;'"
        Write-Host $clientes
        
        Write-Host ""
        Write-Host "✅ El sistema está listo para pruebas desde cero" -ForegroundColor Green
        Write-Host ""
        Write-Host "Puedes usar estos IDs de cliente para tus pruebas:" -ForegroundColor Cyan
        Write-Host "  - Cliente 1, 2, 3, 4, 5, etc." -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ Error al ejecutar la limpieza" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  LIMPIEZA COMPLETADA" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
