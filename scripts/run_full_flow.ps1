# Run full automated flow: A (tests) -> B (migration) -> C (frontend build + integration tests)
# Usage: PowerShell: .\scripts\run_full_flow.ps1
# Optional env vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
# Optional flag: $env:RUN_MIGRATION = '1' to force attempting migration

param()

function Write-Info($m) { Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Warn($m) { Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-ErrorMsg($m) { Write-Host "[ERROR] $m" -ForegroundColor Red }

# 1) Run backend unit tests
Write-Info "Ejecutando tests unitarios (backend)..."
Push-Location -Path "./backend"
npm test
$unitStatus = $LASTEXITCODE
if ($unitStatus -ne 0) {
    Write-ErrorMsg "Tests unitarios fallaron. Revisar la salida anterior. Aborting."
    Pop-Location
    exit $unitStatus
}
Write-Info "Tests unitarios OK."

# 2) Attempt migration if DB credentials present or RUN_MIGRATION=1
$shouldRunMigration = $false
if ($env:RUN_MIGRATION -eq '1') { $shouldRunMigration = $true }
if ($env:DB_HOST -and $env:DB_USER -and $env:DB_NAME) { $shouldRunMigration = $true }

if ($shouldRunMigration) {
    Write-Info "Intentando ejecutar migración SQL (scripts/run_migration.js)..."
    # Ensure env vars are available for the child process
    node .\scripts\run_migration.js
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "La migración no se pudo ejecutar (ver salida). Continuando de todas formas para pruebas locales."
    } else {
        Write-Info "Migración ejecutada (o intentada) exitosamente."
    }
} else {
    Write-Warn "No se proporcionaron credenciales DB y RUN_MIGRATION no está seteado; saltando migración."
}

# 3) Run integration tests if DB available
if ($env:RUN_INTEGRATION -eq '1') {
    Write-Info "Ejecutando pruebas de integración (backend) ..."
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Algunas pruebas de integración fallaron. Revisa la salida."
    } else {
        Write-Info "Pruebas de integración OK."
    }
} else {
    Write-Warn "RUN_INTEGRATION no está seteado. Para ejecutar integraciones, exporta RUN_INTEGRATION=1 y asegúrate de la BD."
}

Pop-Location

# 4) Build frontend
Write-Info "Construyendo frontend (production)..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Build frontend falló. Revisa errores."
    exit $LASTEXITCODE
}
Write-Info "Build completado. Artefactos en ./dist"

Write-Info "Flujo completo finalizado. Revise logs para detalles."