# Script para importar datos de ejemplo al historial de gestiones
# Conecta con la base de datos y crea registros paso a paso para clientes de prueba

Write-Host "=== IMPORTACIÓN DE DATOS DE EJEMPLO - HISTORIAL DE GESTIONES ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que el contenedor esté corriendo
$containerStatus = docker ps --filter "name=albru-base" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "❌ ERROR: El contenedor 'albru-base' no está corriendo" -ForegroundColor Red
    Write-Host "Ejecuta: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Contenedor activo" -ForegroundColor Green
Write-Host ""

# Limpiar datos existentes (opcional)
$limpiar = Read-Host "¿Deseas limpiar historial_gestiones antes de importar? (s/n)"
if ($limpiar -eq "s") {
    Write-Host "🧹 Limpiando tabla historial_gestiones..." -ForegroundColor Yellow
    docker exec albru-base mysql -ualbru_user -palbru123 albru_db -e "DELETE FROM historial_gestiones;"
    Write-Host "✅ Tabla limpiada" -ForegroundColor Green
    Write-Host ""
}

# Obtener algunos cliente_id reales de la base de datos
Write-Host "📊 Obteniendo clientes de ejemplo..." -ForegroundColor Yellow
$clientesQuery = @"
SELECT id, nombre, leads_original_telefono 
FROM clientes 
WHERE asesor_nombre IS NOT NULL 
LIMIT 5;
"@

$clientes = docker exec albru-base mysql -ualbru_user -palbru123 albru_db -e $clientesQuery -N

if (-not $clientes) {
    Write-Host "❌ No se encontraron clientes en la base de datos" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Clientes encontrados" -ForegroundColor Green
Write-Host ""

# Insertar datos de ejemplo
Write-Host "📝 Insertando datos de ejemplo..." -ForegroundColor Yellow

$insertQuery = @"
INSERT INTO historial_gestiones 
(cliente_id, telefono, paso, asesor_nombre, asesor_id, categoria, subcategoria, tipo_contacto, resultado, observaciones, comentario, fecha_gestion, created_at)
VALUES 
-- Cliente 1 - Proceso completo (3 pasos)
(1, '999888777', 1, 'Juan Pérez', 1, 'Sin facilidades', 'Primera gestión', 'telefónico', 'contacto_efectivo', 'Cliente interesado', 'Primera llamada exitosa', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),
(1, '999888777', 2, 'María García', 2, 'Sin facilidades', 'Seguimiento', 'telefónico', 'contacto_efectivo', 'Envío de información', 'Envío de documentación', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
(1, '999888777', 3, 'Carlos López', 3, 'Rechazado', 'Cierre', 'telefónico', 'no_interesado', 'Cliente decidió no continuar', 'No le convienen las condiciones', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),

-- Cliente 2 - En proceso (2 pasos)
(2, '988777666', 1, 'Ana Torres', 4, 'Sin facilidades', 'Contacto inicial', 'email', 'contacto_efectivo', 'Respuesta por email', 'Cliente solicita más información', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY),
(2, '988777666', 2, 'Juan Pérez', 1, 'Con facilidades', 'Evaluación', 'telefónico', 'promesa_pago', 'Cliente promete pagar', 'Acordó pago en 2 cuotas', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),

-- Cliente 3 - Inicio reciente (1 paso)
(3, '977666555', 1, 'María García', 2, 'Sin facilidades', 'Primera gestión', 'whatsapp', 'contacto_efectivo', 'Contacto por WhatsApp', 'Cliente responde y solicita información', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),

-- Cliente 4 - Proceso largo (4 pasos)
(4, '966555444', 1, 'Carlos López', 3, 'Sin facilidades', 'Contacto inicial', 'telefónico', 'no_contesta', 'No contesta llamadas', 'Buzón de voz', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),
(4, '966555444', 2, 'Ana Torres', 4, 'Sin facilidades', 'Reintento', 'telefónico', 'contacto_efectivo', 'Finalmente contestó', 'Cliente estaba ocupado', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),
(4, '966555444', 3, 'Juan Pérez', 1, 'Con facilidades', 'Negociación', 'presencial', 'contacto_efectivo', 'Reunión presencial', 'Se reunió en oficina', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
(4, '966555444', 4, 'María García', 2, 'Pagado', 'Cierre exitoso', 'telefónico', 'pago_realizado', 'Pago confirmado', 'Cliente realizó el pago completo', NOW(), NOW()),

-- Cliente 5 - Sin contacto (1 paso)
(5, '955444333', 1, 'Carlos López', 3, 'Sin facilidades', 'Intento de contacto', 'telefónico', 'numero_invalido', 'Número no existe', 'Teléfono fuera de servicio', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY);
"@

docker exec albru-base mysql -ualbru_user -palbru123 albru_db -e $insertQuery

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Datos importados exitosamente" -ForegroundColor Green
    Write-Host ""
    
    # Mostrar resumen
    Write-Host "📊 RESUMEN DE IMPORTACIÓN:" -ForegroundColor Cyan
    $resumen = docker exec albru-base mysql -ualbru_user -palbru123 albru_db -e @"
SELECT 
    COUNT(*) as total_registros,
    COUNT(DISTINCT cliente_id) as clientes_afectados,
    MIN(paso) as paso_minimo,
    MAX(paso) as paso_maximo,
    COUNT(DISTINCT asesor_nombre) as asesores_involucrados
FROM historial_gestiones;
"@
    
    Write-Host $resumen
    Write-Host ""
    Write-Host "✅ Proceso completado. Ahora puedes ver el stepper en el frontend" -ForegroundColor Green
} else {
    Write-Host "❌ Error al importar datos" -ForegroundColor Red
    exit 1
}
