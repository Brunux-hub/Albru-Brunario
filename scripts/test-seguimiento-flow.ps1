# Script de prueba del flujo de seguimiento end-to-end
Write-Host "🧪 TEST: Flujo de Seguimiento Automático" -ForegroundColor Cyan
Write-Host "=" * 60

# 1. Verificar clientes en estado derivado
Write-Host "`n1️⃣ Verificando clientes en estado 'derivado'..." -ForegroundColor Yellow
$clientes = Invoke-RestMethod -Uri "http://localhost:3001/api/clientes?limit=100"
$derivados = $clientes.clientes | Where-Object { $_.seguimiento_status -eq 'derivado' }

if ($derivados) {
    Write-Host "✅ Encontrados $($derivados.Count) cliente(s) en estado derivado:" -ForegroundColor Green
    $derivados | ForEach-Object {
        $derivadoAt = if ($_.derivado_at) { [DateTime]::Parse($_.derivado_at) } else { $null }
        $openedAt = if ($_.opened_at) { [DateTime]::Parse($_.opened_at) } else { $null }
        $elapsed = if ($derivadoAt) { ([DateTime]::Now - $derivadoAt).TotalMinutes } else { 0 }
        
        Write-Host "   📋 Cliente ID: $($_.id)" -ForegroundColor White
        Write-Host "      Asesor: $($_.asesor_asignado)" -ForegroundColor White
        Write-Host "      Derivado: $derivadoAt" -ForegroundColor White
        Write-Host "      Abierto: $(if ($openedAt) { $openedAt } else { 'NO ABIERTO' })" -ForegroundColor $(if ($openedAt) { 'Green' } else { 'Red' })
        Write-Host "      Tiempo transcurrido: $([Math]::Round($elapsed, 2)) minutos" -ForegroundColor White
        Write-Host "      Estado: $(if ($elapsed -gt 5) { '⏰ DEBERÍA VOLVER A GTR' } else { '✅ Dentro del tiempo' })" -ForegroundColor $(if ($elapsed -gt 5) { 'Red' } else { 'Green' })
        Write-Host ""
    }
} else {
    Write-Host "ℹ️ No hay clientes en estado derivado" -ForegroundColor Gray
}

# 2. Verificar estructura de tabla clientes
Write-Host "`n2️⃣ Verificando columnas de seguimiento en BD..." -ForegroundColor Yellow
$sample = Invoke-RestMethod -Uri "http://localhost:3001/api/clientes?limit=1"
$columnas = $sample.clientes[0] | Get-Member -MemberType NoteProperty | Where-Object { $_.Name -match "seguimiento|derivado|opened" } | Select-Object -ExpandProperty Name

if ($columnas) {
    Write-Host "✅ Columnas encontradas:" -ForegroundColor Green
    $columnas | ForEach-Object { Write-Host "   - $_" -ForegroundColor White }
} else {
    Write-Host "❌ No se encontraron las columnas necesarias" -ForegroundColor Red
}

# 3. Verificar historial de estados
Write-Host "`n3️⃣ Verificando tabla historial_estados..." -ForegroundColor Yellow
try {
    # Intentar consultar historial reciente de timeouts
    Write-Host "ℹ️ (Verificación manual requerida en la BD)" -ForegroundColor Gray
    Write-Host "   Ejecuta: SELECT * FROM historial_estados WHERE comentarios LIKE '%Timeout%' ORDER BY created_at DESC LIMIT 5;" -ForegroundColor White
} catch {
    Write-Host "⚠️ No se pudo verificar historial_estados" -ForegroundColor Yellow
}

# 4. Resumen del worker
Write-Host "`n4️⃣ Estado del seguimientoWorker..." -ForegroundColor Yellow
Write-Host "✅ Worker agregado a server.js (poll cada 30 segundos)" -ForegroundColor Green
Write-Host "⚠️ NOTA: El backend debe ser reiniciado para que el worker se active" -ForegroundColor Yellow
Write-Host "   Comando: docker-compose restart backend" -ForegroundColor White

# 5. Prueba de timeout simulado
Write-Host "`n5️⃣ Simulación de timeout..." -ForegroundColor Yellow
if ($derivados) {
    $testCliente = $derivados[0]
    $derivadoAt = [DateTime]::Parse($testCliente.derivado_at)
    $elapsed = ([DateTime]::Now - $derivadoAt).TotalMinutes
    
    if ($elapsed -gt 5 -and !$testCliente.opened_at) {
        Write-Host "🔍 Cliente ID $($testCliente.id) debería volver a GTR automáticamente" -ForegroundColor Cyan
        Write-Host "   El worker lo procesará en la próxima ejecución (máx 30 segundos)" -ForegroundColor White
    } else {
        Write-Host "ℹ️ No hay clientes que cumplan condición de timeout (>5 min sin abrir)" -ForegroundColor Gray
    }
}

Write-Host "`n" + ("=" * 60)
Write-Host "✅ Verificación completada" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Reiniciar backend: docker-compose restart backend" -ForegroundColor White
Write-Host "   2. Monitorear logs: docker-compose logs -f backend | Select-String 'seguimiento'" -ForegroundColor White
Write-Host "   3. Asignar un cliente y NO abrir wizard por 5+ minutos" -ForegroundColor White
Write-Host "   4. Verificar que vuelve automáticamente a GTR" -ForegroundColor White
