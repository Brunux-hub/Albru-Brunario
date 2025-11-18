# ========================================
# ALBRU CRM - SCRIPT DE INICIO RÁPIDO
# ========================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 ALBRU CRM - INICIO AUTOMÁTICO 🚀            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Docker
Write-Host "1️⃣  Verificando Docker Desktop..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    docker ps | Out-Null
    $dockerRunning = $true
    Write-Host "   ✅ Docker Desktop está corriendo" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker Desktop NO está corriendo" -ForegroundColor Red
    Write-Host "   📝 Por favor inicia Docker Desktop y espera que cargue" -ForegroundColor Yellow
    Write-Host "   ⏳ Esperando 30 segundos..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    try {
        docker ps | Out-Null
        $dockerRunning = $true
        Write-Host "   ✅ Docker Desktop ahora está corriendo" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Docker Desktop aún no responde" -ForegroundColor Red
        Write-Host "   🛑 Por favor inicia Docker Desktop manualmente" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# 2. Levantar servicios
Write-Host "2️⃣  Levantando todos los servicios..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Servicios iniciados correctamente" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Hubo un problema al iniciar servicios" -ForegroundColor Yellow
}

Write-Host ""

# 3. Esperar que los servicios estén listos
Write-Host "3️⃣  Esperando que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""

# 4. Verificar estado
Write-Host "4️⃣  Estado de los servicios:" -ForegroundColor Yellow
docker-compose ps

Write-Host ""

# 5. Verificar logs del backend
Write-Host "5️⃣  Últimos logs del backend:" -ForegroundColor Yellow
docker-compose logs --tail=20 backend

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ SISTEMA LISTO - Accede a:" -ForegroundColor Green
Write-Host ""
Write-Host "   🌐 Frontend:  http://localhost:5174" -ForegroundColor Cyan
Write-Host "   🔌 Backend:   http://localhost:3001" -ForegroundColor Cyan
Write-Host "   💾 Adminer:   http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Ver documentación: SISTEMA_IMPLEMENTADO.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   docker-compose logs -f backend    # Ver logs en tiempo real" -ForegroundColor Gray
Write-Host "   docker-compose restart backend    # Reiniciar backend" -ForegroundColor Gray
Write-Host "   docker-compose ps                 # Ver estado de servicios" -ForegroundColor Gray
Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
