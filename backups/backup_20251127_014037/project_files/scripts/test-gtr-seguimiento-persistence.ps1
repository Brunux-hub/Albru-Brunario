#!/usr/bin/env pwsh
# Script para probar la persistencia del seguimiento en el panel GTR

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
Write-Host "  PRUEBA DE PERSISTENCIA DEL SEGUIMIENTO EN GTR" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# PASO 1: Asignar cliente a asesor
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

    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/clientes/$ClienteId/estatus" `
        -Method PATCH `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $body

    if ($response.success) {
        Write-Host "   ✅ Cliente asignado exitosamente" -ForegroundColor Green
        Write-Host "   📊 Seguimiento Status: $($response.cliente.seguimiento_status)" -ForegroundColor Cyan
        Write-Host "   📅 Derivado At: $($response.cliente.derivado_at)" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ Error: $($response.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error en asignación: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# PASO 2: Verificar que el cliente aparece en la lista del GTR
Write-Host "📋 PASO 2: Verificando cliente en lista del GTR (GET /api/clientes)..." -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 2

try {
    $clientes = Invoke-RestMethod -Uri "http://localhost:3001/api/clientes?limit=100"
    
    if ($clientes.success) {
        $clienteEncontrado = $clientes.clientes | Where-Object { $_.id -eq $ClienteId }
        
        if ($clienteEncontrado) {
            Write-Host "   ✅ Cliente encontrado en la lista del GTR" -ForegroundColor Green
            Write-Host "   📊 ID: $($clienteEncontrado.id)" -ForegroundColor Cyan
            Write-Host "   👤 Nombre: $($clienteEncontrado.nombre)" -ForegroundColor Cyan
            Write-Host "   📌 Seguimiento Status: $($clienteEncontrado.seguimiento_status)" -ForegroundColor Cyan
            Write-Host "   📅 Derivado At: $($clienteEncontrado.derivado_at)" -ForegroundColor Cyan
            Write-Host "   👨‍💼 Asesor Asignado: $($clienteEncontrado.asesor_asignado)" -ForegroundColor Cyan
            Write-Host "   👨‍💼 Asesor Nombre: $($clienteEncontrado.asesor_nombre)" -ForegroundColor Cyan
        } else {
            Write-Host "   ❌ Cliente NO encontrado en la lista del GTR" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   ❌ Error obteniendo clientes: $($clientes.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error verificando lista: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# PASO 3: Simular recarga - volver a consultar la lista
Write-Host "📋 PASO 3: Simulando recarga de GTR (nueva consulta)..." -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 1

try {
    $clientes2 = Invoke-RestMethod -Uri "http://localhost:3001/api/clientes?limit=100"
    
    if ($clientes2.success) {
        $clienteEncontrado2 = $clientes2.clientes | Where-Object { $_.id -eq $ClienteId }
        
        if ($clienteEncontrado2) {
            Write-Host "   ✅ Cliente SIGUE apareciendo después de recarga en GTR" -ForegroundColor Green
            Write-Host "   📊 ID: $($clienteEncontrado2.id)" -ForegroundColor Cyan
            Write-Host "   👤 Nombre: $($clienteEncontrado2.nombre)" -ForegroundColor Cyan
            Write-Host "   📌 Seguimiento Status: $($clienteEncontrado2.seguimiento_status)" -ForegroundColor Cyan
            
            # Verificar que seguimiento_status no sea null
            if ($clienteEncontrado2.seguimiento_status) {
                Write-Host ""
                Write-Host "   ✅ SEGUIMIENTO_STATUS SE MANTIENE EN GTR: $($clienteEncontrado2.seguimiento_status)" -ForegroundColor Green -BackgroundColor Black
                Write-Host ""
            } else {
                Write-Host ""
                Write-Host "   ❌ SEGUIMIENTO_STATUS ES NULL EN GTR - PROBLEMA ENCONTRADO" -ForegroundColor Red -BackgroundColor Black
                Write-Host ""
                exit 1
            }
        } else {
            Write-Host "   ❌ Cliente DESAPARECIÓ después de recarga - PROBLEMA ENCONTRADO" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   ❌ Error en segunda consulta: $($clientes2.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error en recarga: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ PRUEBA EXITOSA - SEGUIMIENTO SE MANTIENE EN GTR AL RECARGAR" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
