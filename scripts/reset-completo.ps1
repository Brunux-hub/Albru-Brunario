#!/usr/bin/env pwsh
# Script para reseteo completo del sistema - Limpiar TODOS los datos de gestión

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  RESET COMPLETO DEL SISTEMA - LIMPIEZA TOTAL" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "ADVERTENCIA: Esta operacion limpiara:" -ForegroundColor Yellow
Write-Host "   [X] Todos los campos de seguimiento (seguimiento_status, derivado_at, opened_at)" -ForegroundColor White
Write-Host "   [X] Asignaciones de asesores (asesor_asignado)" -ForegroundColor White
Write-Host "   [X] Estados comerciales del wizard (estatus_comercial_categoria, subcategoria)" -ForegroundColor White
Write-Host "   [X] Estados de cliente (estado_cliente)" -ForegroundColor White
Write-Host "   [X] Wizard completado (wizard_completado)" -ForegroundColor White
Write-Host "   [X] Historial de cliente (historial_cliente)" -ForegroundColor White
Write-Host "   [X] Todos los locks de clientes (cliente_locks)" -ForegroundColor White
Write-Host "   [X] Contador de mensajes pendientes (pending_messages_count)" -ForegroundColor White
Write-Host ""
Write-Host "   NO SE ELIMINARAN:" -ForegroundColor Red
Write-Host "   - Datos basicos de clientes (nombre, telefono, DNI, etc.)" -ForegroundColor Gray
Write-Host "   - Historial de gestiones (historial_gestiones)" -ForegroundColor Gray
Write-Host "   - Usuarios y asesores" -ForegroundColor Gray
Write-Host ""

$confirmacion = Read-Host "¿Deseas continuar con el RESET COMPLETO? (escribe 'SI' para confirmar)"

if ($confirmacion -ne "SI") {
    Write-Host "Operación cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Ejecutando reset completo..." -ForegroundColor Yellow

try {
    # Ejecutar limpieza completa en MySQL
    $sql = @"
-- 1. Limpiar campos de seguimiento
UPDATE clientes 
SET 
  seguimiento_status = NULL,
  derivado_at = NULL,
  opened_at = NULL
WHERE seguimiento_status IS NOT NULL;

-- 2. Resetear asignaciones y wizard
UPDATE clientes 
SET 
  asesor_asignado = NULL,
  wizard_completado = 0,
  estatus_comercial_categoria = NULL,
  estatus_comercial_subcategoria = NULL,
  estado_cliente = 'nuevo',
  pending_messages_count = 0,
  updated_at = NOW();

-- 3. Limpiar historial antiguo (tabla historial_cliente)
TRUNCATE TABLE historial_cliente;

-- 4. Limpiar locks
DELETE FROM cliente_locks;

-- 5. Mostrar estadísticas
SELECT 
  COUNT(*) as total_clientes,
  SUM(CASE WHEN asesor_asignado IS NULL THEN 1 ELSE 0 END) as sin_asignar,
  SUM(CASE WHEN estado_cliente = 'nuevo' THEN 1 ELSE 0 END) as estado_nuevo,
  SUM(CASE WHEN wizard_completado = 0 THEN 1 ELSE 0 END) as wizard_pendiente
FROM clientes;
"@

    Write-Host "Ejecutando queries de limpieza..." -ForegroundColor Cyan
    $result = docker exec -i albru-base sh -c "mysql -uroot -proot_password_here albru -e `"$sql`""
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Reset completado exitosamente" -ForegroundColor Green
        Write-Host ""
        
        # Mostrar estadisticas finales
        Write-Host "Estadisticas del sistema:" -ForegroundColor Cyan
        Write-Host $result
        
        # Mostrar algunos clientes disponibles para pruebas
        Write-Host ""
        Write-Host "Primeros 10 clientes disponibles para gestionar:" -ForegroundColor Cyan
        
        $clientes = docker exec -i albru-base sh -c "mysql -uroot -proot_password_here albru -e 'SELECT id, COALESCE(nombre, \`"Sin nombre\`") as nombre, COALESCE(telefono, leads_original_telefono, \`"Sin teléfono\`") as telefono, estado_cliente FROM clientes ORDER BY id LIMIT 10;' -t"
        Write-Host $clientes
        
        Write-Host ""
        Write-Host "=======================================================================" -ForegroundColor Green
        Write-Host "  [OK] SISTEMA RESETEADO - LISTO PARA GESTIONAR DESDE CERO" -ForegroundColor White -BackgroundColor DarkGreen
        Write-Host "=======================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Proximos pasos:" -ForegroundColor Cyan
        Write-Host "   1. Recargar el navegador (Ctrl+Shift+R)" -ForegroundColor White
        Write-Host "   2. Iniciar sesión como GTR" -ForegroundColor White
        Write-Host "   3. Derivar clientes a asesores" -ForegroundColor White
        Write-Host "   4. Los asesores pueden gestionar desde cero" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ Error al ejecutar el reset" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
