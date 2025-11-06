# Script de Prueba en Tiempo Real - Sistema de Seguimiento Automático
# Este script simula todo el flujo: asignación → timeout → devolución a GTR

param(
    [Parameter(Mandatory=$false)]
    [string]$ClienteId = "",
    [Parameter(Mandatory=$false)]
    [int]$AsesorId = 2,
    [Parameter(Mandatory=$false)]
    [int]$GtrId = 2
)

$Backend = "http://localhost:3001"
$Frontend = "http://localhost:5173"

Write-Host "`n" -NoNewline
Write-Host "╔═══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🧪 PRUEBA EN TIEMPO REAL - SISTEMA DE SEGUIMIENTO AUTOMÁTICO        ║" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "╚═══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PASO 0: Verificar servicios activos
# ============================================================================
Write-Host "📡 Verificando servicios..." -ForegroundColor Yellow
Write-Host ""

try {
    $healthCheck = Invoke-RestMethod -Uri "$Backend/api/clientes?limit=1" -ErrorAction Stop
    Write-Host "   ✅ Backend: ACTIVO en $Backend" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend: NO DISPONIBLE" -ForegroundColor Red
    Write-Host "   Ejecuta: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

try {
    $frontendCheck = Invoke-WebRequest -Uri $Frontend -Method Head -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Frontend: ACTIVO en $Frontend" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Frontend: No verificado (opcional)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# PASO 1: Seleccionar o buscar un cliente disponible
# ============================================================================
Write-Host "🔍 PASO 1: Buscando cliente disponible..." -ForegroundColor Cyan
Write-Host ""

if ($ClienteId -eq "") {
    # Buscar un cliente sin asesor asignado
    $response = Invoke-RestMethod -Uri "$Backend/api/clientes?limit=100"
    $clientesDisponibles = $response.clientes | Where-Object { 
        $_.asesor_asignado -eq $null -or $_.asesor_asignado -eq ''
    } | Select-Object -First 5

    if ($clientesDisponibles.Count -eq 0) {
        Write-Host "   ❌ No hay clientes disponibles para asignar" -ForegroundColor Red
        Write-Host "   Todos los clientes ya tienen asesor asignado" -ForegroundColor Gray
        exit 1
    }

    Write-Host "   📋 Clientes disponibles:" -ForegroundColor White
    $i = 1
    foreach ($c in $clientesDisponibles) {
        $nombre = if ($c.nombre) { $c.nombre } else { "(Sin nombre)" }
        $telefono = if ($c.telefono) { $c.telefono } else { "N/A" }
        Write-Host "      $i. ID: $($c.id) | $nombre | Tel: $telefono" -ForegroundColor Gray
        $i++
    }

    # Seleccionar el primero automáticamente
    $ClienteId = $clientesDisponibles[0].id
    Write-Host ""
    Write-Host "   ✅ Cliente seleccionado: ID $ClienteId" -ForegroundColor Green
} else {
    Write-Host "   📌 Cliente especificado: ID $ClienteId" -ForegroundColor White
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# PASO 2: Asignar cliente a asesor (simular GTR)
# ============================================================================
Write-Host "👤 PASO 2: Asignando cliente a asesor..." -ForegroundColor Cyan
Write-Host ""

$payload = @{
    clienteId = [int]$ClienteId
    nuevoAsesorId = $AsesorId
    gtrId = $GtrId
    comentario = "Prueba en tiempo real del sistema de seguimiento"
} | ConvertTo-Json

Write-Host "   📤 Enviando solicitud de asignación..." -ForegroundColor White
Write-Host "      Cliente ID: $ClienteId" -ForegroundColor Gray
Write-Host "      Asesor ID: $AsesorId" -ForegroundColor Gray

try {
    $asignacion = Invoke-RestMethod -Uri "$Backend/api/clientes/reasignar" -Method POST -Body $payload -ContentType "application/json"
    Write-Host ""
    Write-Host "   ✅ Cliente asignado exitosamente" -ForegroundColor Green
    Write-Host "      Estado: $($asignacion.cliente.seguimiento_status)" -ForegroundColor Gray
    Write-Host "      Derivado en: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
} catch {
    Write-Host ""
    Write-Host "   ❌ Error al asignar cliente: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# PASO 3: Verificar estado inmediatamente después de asignación
# ============================================================================
Write-Host "🔍 PASO 3: Verificando estado del cliente..." -ForegroundColor Cyan
Write-Host ""

Start-Sleep -Seconds 2

$cliente = Invoke-RestMethod -Uri "$Backend/api/clientes?limit=100" | 
    Select-Object -ExpandProperty clientes | 
    Where-Object { $_.id -eq $ClienteId }

Write-Host "   📊 Estado actual:" -ForegroundColor White
Write-Host "      ID: $($cliente.id)" -ForegroundColor Gray
Write-Host "      Asesor asignado: $($cliente.asesor_asignado)" -ForegroundColor Gray
Write-Host "      Seguimiento status: $($cliente.seguimiento_status)" -ForegroundColor $(if ($cliente.seguimiento_status -eq 'derivado') { 'Green' } else { 'Yellow' })
Write-Host "      Derivado at: $($cliente.derivado_at)" -ForegroundColor Gray
Write-Host "      Opened at: $(if ($cliente.opened_at) { $cliente.opened_at } else { 'NULL (NO ABIERTO)' })" -ForegroundColor $(if ($cliente.opened_at) { 'Green' } else { 'Red' })

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# PASO 4: Esperar y monitorear (simulación de timeout)
# ============================================================================
Write-Host "⏱️  PASO 4: Monitoreando timeout..." -ForegroundColor Cyan
Write-Host ""
Write-Host "   ⚠️  El cliente está asignado pero el asesor NO ha abierto el wizard" -ForegroundColor Yellow
Write-Host ""
Write-Host "   📌 Configuración actual:" -ForegroundColor White
Write-Host "      • Timeout: 5 minutos (300 segundos)" -ForegroundColor Gray
Write-Host "      • Worker verifica cada: 30 segundos" -ForegroundColor Gray
Write-Host "      • Tiempo máximo de espera: 5 minutos + 30 segundos" -ForegroundColor Gray
Write-Host ""

# Preguntar si quiere esperar o simular
Write-Host "   🤔 ¿Qué deseas hacer?" -ForegroundColor White
Write-Host ""
Write-Host "      1. ⏳ Esperar 5 minutos reales (timeout natural)" -ForegroundColor Gray
Write-Host "      2. ⚡ Simular timeout (modificar BD manualmente)" -ForegroundColor Gray
Write-Host "      3. ✅ Abrir wizard (prevenir timeout)" -ForegroundColor Gray
Write-Host "      4. 🔍 Verificar estado actual y salir" -ForegroundColor Gray
Write-Host ""

$opcion = Read-Host "   Selecciona opción (1-4)"

switch ($opcion) {
    "1" {
        Write-Host ""
        Write-Host "   ⏳ Esperando 5 minutos para timeout..." -ForegroundColor Yellow
        Write-Host ""
        
        $tiempoInicio = Get-Date
        $tiempoEspera = 300 # 5 minutos
        
        for ($i = 0; $i -le $tiempoEspera; $i += 30) {
            $transcurrido = $i
            $restante = $tiempoEspera - $i
            $porcentaje = [math]::Round(($i / $tiempoEspera) * 100)
            
            Write-Host "`r   ⏱️  Transcurrido: $transcurrido seg | Restante: $restante seg | Progreso: $porcentaje%" -NoNewline -ForegroundColor Cyan
            
            if ($i -lt $tiempoEspera) {
                Start-Sleep -Seconds 30
                
                # Verificar estado cada 30 segundos
                $clienteActual = Invoke-RestMethod -Uri "$Backend/api/clientes?limit=100" | 
                    Select-Object -ExpandProperty clientes | 
                    Where-Object { $_.id -eq $ClienteId }
                
                if ($clienteActual.seguimiento_status -eq 'no_gestionado') {
                    Write-Host ""
                    Write-Host ""
                    Write-Host "   🎉 ¡TIMEOUT DETECTADO POR EL WORKER!" -ForegroundColor Green
                    break
                }
            }
        }
        
        Write-Host ""
        Write-Host ""
        Write-Host "   ✅ Esperamos 5 minutos" -ForegroundColor Green
    }
    
    "2" {
        Write-Host ""
        Write-Host "   ⚡ Simulando timeout..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   💡 Para simular timeout, ejecuta en la BD:" -ForegroundColor White
        Write-Host "      UPDATE clientes" -ForegroundColor Gray
        Write-Host "      SET derivado_at = DATE_SUB(NOW(), INTERVAL 6 MINUTE)" -ForegroundColor Gray
        Write-Host "      WHERE id = $ClienteId;" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Luego espera máximo 30 segundos para que el worker lo detecte" -ForegroundColor Gray
        Write-Host ""
        $continuar = Read-Host "   ¿Ya ejecutaste el UPDATE? (s/n)"
        
        if ($continuar -eq "s") {
            Write-Host ""
            Write-Host "   ⏳ Esperando detección del worker (máx 30 seg)..." -ForegroundColor Yellow
            
            for ($i = 0; $i -le 30; $i += 5) {
                Write-Host "   🔄 Verificando... ($i seg)" -ForegroundColor Cyan
                
                $clienteActual = Invoke-RestMethod -Uri "$Backend/api/clientes?limit=100" | 
                    Select-Object -ExpandProperty clientes | 
                    Where-Object { $_.id -eq $ClienteId }
                
                if ($clienteActual.seguimiento_status -eq 'no_gestionado') {
                    Write-Host ""
                    Write-Host "   🎉 ¡TIMEOUT DETECTADO POR EL WORKER EN $i SEGUNDOS!" -ForegroundColor Green
                    break
                }
                
                if ($i -lt 30) {
                    Start-Sleep -Seconds 5
                }
            }
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "   ✅ Simulando apertura de wizard..." -ForegroundColor Green
        Write-Host ""
        
        try {
            $openPayload = @{
                asesorId = $AsesorId
                lockToken = "test-token-$(Get-Date -Format 'yyyyMMddHHmmss')"
            } | ConvertTo-Json
            
            $openResult = Invoke-RestMethod -Uri "$Backend/api/clientes/$ClienteId/open-wizard" -Method POST -Body $openPayload -ContentType "application/json"
            
            Write-Host "   ✅ Wizard abierto exitosamente" -ForegroundColor Green
            Write-Host "      Estado: en_gestion" -ForegroundColor Gray
            Write-Host "      Opened at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
            Write-Host ""
            Write-Host "   ℹ️  El timeout NO se activará porque el wizard fue abierto" -ForegroundColor Cyan
        } catch {
            Write-Host "   ❌ Error al abrir wizard: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    "4" {
        Write-Host ""
        Write-Host "   🔍 Saliendo sin esperar..." -ForegroundColor Gray
    }
    
    default {
        Write-Host ""
        Write-Host "   ⚠️  Opción inválida" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# PASO 5: Verificar resultado final
# ============================================================================
Write-Host "🔍 PASO 5: Verificando resultado final..." -ForegroundColor Cyan
Write-Host ""

Start-Sleep -Seconds 2

$clienteFinal = Invoke-RestMethod -Uri "$Backend/api/clientes?limit=100" | 
    Select-Object -ExpandProperty clientes | 
    Where-Object { $_.id -eq $ClienteId }

Write-Host "   📊 Estado final del cliente:" -ForegroundColor White
Write-Host "      ID: $($clienteFinal.id)" -ForegroundColor Gray
Write-Host "      Asesor asignado: $(if ($clienteFinal.asesor_asignado) { $clienteFinal.asesor_asignado } else { 'NULL (VOLVIÓ A GTR)' })" -ForegroundColor $(if ($clienteFinal.asesor_asignado) { 'Yellow' } else { 'Green' })
Write-Host "      Seguimiento status: $($clienteFinal.seguimiento_status)" -ForegroundColor $(
    switch ($clienteFinal.seguimiento_status) {
        'no_gestionado' { 'Green' }
        'en_gestion' { 'Cyan' }
        'derivado' { 'Yellow' }
        default { 'White' }
    }
)
Write-Host "      Derivado at: $($clienteFinal.derivado_at)" -ForegroundColor Gray
Write-Host "      Opened at: $(if ($clienteFinal.opened_at) { $clienteFinal.opened_at } else { 'NULL' })" -ForegroundColor Gray

Write-Host ""

# Análisis del resultado
if ($clienteFinal.seguimiento_status -eq 'no_gestionado' -and !$clienteFinal.asesor_asignado) {
    Write-Host "   ✅ PRUEBA EXITOSA" -ForegroundColor Green -BackgroundColor Black
    Write-Host ""
    Write-Host "      El sistema funcionó correctamente:" -ForegroundColor White
    Write-Host "      • Cliente detectado en timeout" -ForegroundColor Gray
    Write-Host "      • Worker procesó automáticamente" -ForegroundColor Gray
    Write-Host "      • Cliente devuelto a GTR" -ForegroundColor Gray
    Write-Host "      • Estado: no_gestionado" -ForegroundColor Gray
} elseif ($clienteFinal.seguimiento_status -eq 'en_gestion') {
    Write-Host "   ✅ WIZARD ABIERTO" -ForegroundColor Cyan -BackgroundColor Black
    Write-Host ""
    Write-Host "      El asesor abrió el wizard:" -ForegroundColor White
    Write-Host "      • Timeout prevenido exitosamente" -ForegroundColor Gray
    Write-Host "      • Cliente en gestión activa" -ForegroundColor Gray
} elseif ($clienteFinal.seguimiento_status -eq 'derivado') {
    Write-Host "   ⏳ ESPERANDO TIMEOUT" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host ""
    Write-Host "      El cliente aún está asignado:" -ForegroundColor White
    Write-Host "      • Worker verificará en próximos 30 seg" -ForegroundColor Gray
    Write-Host "      • Si no abre wizard, volverá a GTR" -ForegroundColor Gray
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# PASO 6: Verificar logs del worker
# ============================================================================
Write-Host "📋 PASO 6: Verificando logs del worker..." -ForegroundColor Cyan
Write-Host ""

Write-Host "   🔍 Últimos eventos del worker:" -ForegroundColor White
Write-Host ""

try {
    $logs = docker-compose logs backend --tail=100 2>&1 | Select-String -Pattern "CLIENT_RETURNED_TO_GTR|seguimientoWorker|Timeout" | Select-Object -Last 5
    
    if ($logs) {
        foreach ($log in $logs) {
            Write-Host "      $log" -ForegroundColor Gray
        }
    } else {
        Write-Host "      ℹ️  No hay eventos recientes del worker" -ForegroundColor Gray
    }
} catch {
    Write-Host "      ⚠️  No se pudieron recuperar los logs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Prueba completada" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   • Revisar logs completos: docker-compose logs -f backend" -ForegroundColor Gray
Write-Host "   • Ver cliente en GTR: $Frontend/dashboard/gtr" -ForegroundColor Gray
Write-Host "   • Monitorear worker: docker-compose logs -f backend | Select-String 'seguimiento'" -ForegroundColor Gray
Write-Host ""
