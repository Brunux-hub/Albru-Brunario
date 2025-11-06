#!/usr/bin/env pwsh
# Script para probar la actualización en tiempo real del seguimiento en GTR

param(
    [Parameter(Mandatory=$false)]
    [int]$ClienteId = 2447,
    
    [Parameter(Mandatory=$false)]
    [int]$AsesorId = 4,
    
    [Parameter(Mandatory=$false)]
    [int]$GtrId = 2
)

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PRUEBA DE ACTUALIZACIÓN EN TIEMPO REAL - SEGUIMIENTO GTR" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$backend = "http://localhost:3001"

Write-Host "📋 Instrucciones:" -ForegroundColor Yellow
Write-Host "   1. Abre el panel GTR en tu navegador: http://localhost:5174/dashboard/gtr" -ForegroundColor White
Write-Host "   2. Abre el panel Asesor en otra pestaña: http://localhost:5174/dashboard/asesor" -ForegroundColor White
Write-Host "   3. Presiona ENTER cuando estés listo..." -ForegroundColor White
Write-Host ""
Read-Host "Presiona ENTER para continuar"

# PASO 1: Asignar cliente desde GTR
Write-Host ""
Write-Host "📋 PASO 1: Asignando cliente $ClienteId al asesor $AsesorId..." -ForegroundColor Yellow
Write-Host ""

try {
    $body = @{
        clienteId = $ClienteId
        asesorId = $AsesorId
        gtrId = $GtrId
        tipo = "gtr"
        estatus = "derivado"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$backend/api/clientes/$ClienteId/estatus" `
        -Method PATCH `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $body

    if ($response.success) {
        Write-Host "   ✅ Cliente asignado con seguimiento_status = $($response.cliente.seguimiento_status)" -ForegroundColor Green
        Write-Host ""
        Write-Host "   🔍 VERIFICA EN GTR: Debe aparecer chip azul 'Derivado'" -ForegroundColor Cyan
        Write-Host "   🔍 VERIFICA EN ASESOR: Cliente debe aparecer en la lista" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "   ❌ Error: $($response.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error en asignación: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Presiona ENTER cuando veas el chip 'Derivado' en ambos paneles..." -ForegroundColor White
Read-Host

# PASO 2: Simular que el asesor abre el wizard
Write-Host ""
Write-Host "📋 PASO 2: Simulando que el asesor abre el wizard..." -ForegroundColor Yellow
Write-Host ""

try {
    # Tomar lock
    $lockBody = @{
        asesorId = $AsesorId
        durationSeconds = 300
    } | ConvertTo-Json

    $lockResponse = Invoke-RestMethod -Uri "$backend/api/clientes/$ClienteId/lock" `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $lockBody

    if ($lockResponse.lockToken) {
        $lockToken = $lockResponse.lockToken
        Write-Host "   ✅ Lock tomado" -ForegroundColor Green
        
        # Llamar a open-wizard
        $openWizardBody = @{
            asesorId = $AsesorId
            lockToken = $lockToken
        } | ConvertTo-Json

        Write-Host "   🚀 Llamando a open-wizard (debe emitir CLIENT_IN_GESTION)..." -ForegroundColor Cyan
        
        $wizardResponse = Invoke-RestMethod -Uri "$backend/api/clientes/$ClienteId/open-wizard" `
            -Method POST `
            -Headers @{ "Content-Type" = "application/json" } `
            -Body $openWizardBody

        if ($wizardResponse.success) {
            Write-Host "   ✅ open-wizard exitoso: seguimiento_status = $($wizardResponse.cliente.seguimiento_status)" -ForegroundColor Green
            Write-Host ""
            Write-Host "   🎯 VERIFICA EN GTR (EN TIEMPO REAL):" -ForegroundColor Yellow
            Write-Host "      El chip debe cambiar automáticamente de 'Derivado' → 'En Gestión'" -ForegroundColor White
            Write-Host "      Sin necesidad de recargar la página (F5)" -ForegroundColor White
            Write-Host ""
            Write-Host "   🎯 VERIFICA EN ASESOR:" -ForegroundColor Yellow
            Write-Host "      El chip también debe mostrar 'En Gestión'" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "   ❌ open-wizard falló: $($wizardResponse.message)" -ForegroundColor Red
        }
        
        # Esperar para ver el cambio
        Write-Host "Esperando 3 segundos para que WebSocket actualice el GTR..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
        
        # Liberar lock
        $unlockBody = @{
            asesorId = $AsesorId
            lockToken = $lockToken
        } | ConvertTo-Json

        Invoke-RestMethod -Uri "$backend/api/clientes/$ClienteId/unlock" `
            -Method POST `
            -Headers @{ "Content-Type" = "application/json" } `
            -Body $unlockBody | Out-Null
            
        Write-Host "   ✅ Lock liberado" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ PRUEBA COMPLETADA" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Resultado esperado:" -ForegroundColor Cyan
Write-Host "  ✅ GTR: Chip cambió de 'Derivado' → 'En Gestión' SIN recargar" -ForegroundColor White
Write-Host "  ✅ Asesor: Chip muestra 'En Gestión'" -ForegroundColor White
Write-Host ""
Write-Host "Si NO viste el cambio automático en GTR:" -ForegroundColor Yellow
Write-Host "  1. Abre la consola del navegador (F12)" -ForegroundColor White
Write-Host "  2. Busca el mensaje: '🎯 GTR: Evento CLIENT_IN_GESTION recibido'" -ForegroundColor White
Write-Host "  3. Verifica que el WebSocket esté conectado" -ForegroundColor White
Write-Host ""
