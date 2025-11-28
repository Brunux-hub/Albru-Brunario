#!/usr/bin/env pwsh
# Script para probar el flujo completo del seguimiento automático

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
Write-Host "  PRUEBA COMPLETA DEL FLUJO DE SEGUIMIENTO AUTOMÁTICO" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$backend = "http://localhost:3001"

# PASO 1: Asignar cliente desde GTR (debería quedar en "derivado")
Write-Host "📋 PASO 1: GTR asigna cliente $ClienteId al asesor $AsesorId..." -ForegroundColor Yellow
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
        Write-Host "   ✅ Cliente asignado exitosamente" -ForegroundColor Green
        Write-Host "   📊 Seguimiento Status: $($response.cliente.seguimiento_status)" -ForegroundColor Cyan
        
        if ($response.cliente.seguimiento_status -ne 'derivado') {
            Write-Host "   ❌ ERROR: Debería estar en 'derivado', está en '$($response.cliente.seguimiento_status)'" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   ❌ Error: $($response.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error en asignación: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# PASO 2: Verificar persistencia en GTR (debe mantener "derivado")
Write-Host "📋 PASO 2: Verificando persistencia en GTR al recargar..." -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 2

try {
    $clientes = Invoke-RestMethod -Uri "$backend/api/clientes?limit=100" `
        -Headers @{ 
            "Cache-Control" = "no-cache, no-store, must-revalidate"
            "Pragma" = "no-cache"
        }
    
    if ($clientes.success) {
        $clienteEnGtr = $clientes.clientes | Where-Object { $_.id -eq $ClienteId }
        
        if ($clienteEnGtr -and $clienteEnGtr.seguimiento_status) {
            Write-Host "   ✅ PERSISTENCIA GTR OK: seguimiento_status = $($clienteEnGtr.seguimiento_status)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ PERSISTENCIA GTR FALLA: seguimiento_status es null o cliente no encontrado" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "   ❌ Error verificando GTR: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# PASO 3: Verificar en lista del asesor (debe aparecer con "derivado")
Write-Host "📋 PASO 3: Verificando en lista del asesor..." -ForegroundColor Yellow
Write-Host ""

try {
    $clientesAsesor = Invoke-RestMethod -Uri "$backend/api/clientes/asesor/$AsesorId" `
        -Headers @{ 
            "Cache-Control" = "no-cache, no-store, must-revalidate"
            "Pragma" = "no-cache"
        }
    
    if ($clientesAsesor.success) {
        $clienteEnAsesor = $clientesAsesor.clientes | Where-Object { $_.id -eq $ClienteId }
        
        if ($clienteEnAsesor -and $clienteEnAsesor.seguimiento_status -eq 'derivado') {
            Write-Host "   ✅ Cliente aparece en lista del asesor con seguimiento_status = derivado" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Cliente no encontrado o seguimiento_status incorrecto en lista del asesor" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "   ❌ Error verificando lista del asesor: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# PASO 4: Simular que el asesor toma lock del cliente (abre wizard)
Write-Host "📋 PASO 4: Asesor toma lock del cliente (simula abrir wizard)..." -ForegroundColor Yellow
Write-Host ""

try {
    $lockBody = @{
        asesorId = $AsesorId
        durationSeconds = 300
    } | ConvertTo-Json

    $lockResponse = Invoke-RestMethod -Uri "$backend/api/clientes/$ClienteId/lock" `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $lockBody

    if ($lockResponse.lockToken) {
        Write-Host "   ✅ Lock tomado exitosamente" -ForegroundColor Green
        $lockToken = $lockResponse.lockToken
        
        # PASO 5: Llamar a open-wizard (debe cambiar a "en_gestion")
        Write-Host ""
        Write-Host "📋 PASO 5: Asesor abre wizard (debe cambiar a 'en_gestion')..." -ForegroundColor Yellow
        Write-Host ""
        
        $openWizardBody = @{
            asesorId = $AsesorId
            lockToken = $lockToken
        } | ConvertTo-Json

        $wizardResponse = Invoke-RestMethod -Uri "$backend/api/clientes/$ClienteId/open-wizard" `
            -Method POST `
            -Headers @{ "Content-Type" = "application/json" } `
            -Body $openWizardBody

        if ($wizardResponse.success -and $wizardResponse.cliente.seguimiento_status -eq 'en_gestion') {
            Write-Host "   ✅ CAMBIO AUTOMÁTICO OK: seguimiento_status = en_gestion" -ForegroundColor Green
        } else {
            Write-Host "   ❌ CAMBIO AUTOMÁTICO FALLA: seguimiento_status = $($wizardResponse.cliente.seguimiento_status)" -ForegroundColor Red
            exit 1
        }
        
        # PASO 6: Verificar que se mantiene en GTR después de abrir wizard
        Write-Host ""
        Write-Host "📋 PASO 6: Verificando persistencia en GTR después de abrir wizard..." -ForegroundColor Yellow
        Write-Host ""
        
        Start-Sleep -Seconds 1
        
        $clientesGtr2 = Invoke-RestMethod -Uri "$backend/api/clientes?limit=100" `
            -Headers @{ 
                "Cache-Control" = "no-cache, no-store, must-revalidate"
                "Pragma" = "no-cache"
            }
        
        $clienteEnGtr2 = $clientesGtr2.clientes | Where-Object { $_.id -eq $ClienteId }
        
        if ($clienteEnGtr2 -and $clienteEnGtr2.seguimiento_status -eq 'en_gestion') {
            Write-Host "   ✅ PERSISTENCIA FINAL GTR OK: seguimiento_status = en_gestion" -ForegroundColor Green
        } else {
            Write-Host "   ❌ PERSISTENCIA FINAL GTR FALLA: seguimiento_status = $($clienteEnGtr2.seguimiento_status)" -ForegroundColor Red
            exit 1
        }
        
        # Liberar lock
        $unlockBody = @{
            asesorId = $AsesorId
            lockToken = $lockToken
        } | ConvertTo-Json

        Invoke-RestMethod -Uri "$backend/api/clientes/$ClienteId/unlock" `
            -Method POST `
            -Headers @{ "Content-Type" = "application/json" } `
            -Body $unlockBody | Out-Null
            
    } else {
        Write-Host "   ❌ No se pudo obtener lock" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error en flujo wizard: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ PRUEBA COMPLETA EXITOSA - FLUJO DE SEGUIMIENTO FUNCIONA" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Resumen del flujo:" -ForegroundColor Cyan
Write-Host "  1. ✅ GTR asigna → seguimiento_status = 'derivado'" -ForegroundColor White
Write-Host "  2. ✅ Persistencia GTR al recargar → mantiene 'derivado'" -ForegroundColor White
Write-Host "  3. ✅ Lista del asesor → muestra 'derivado'" -ForegroundColor White
Write-Host "  4. ✅ Asesor abre wizard → cambia automáticamente a 'en_gestion'" -ForegroundColor White
Write-Host "  5. ✅ Persistencia GTR después de wizard → mantiene 'en_gestion'" -ForegroundColor White
Write-Host ""
