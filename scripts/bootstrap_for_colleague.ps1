<#
Bootstrap completo para compañeros: automatiza la preparación del entorno.

Uso recomendado:
  # Si tu compañero quiere que el script importe la BD automáticamente:
  .\scripts\bootstrap_for_colleague.ps1 -ImportDb -DBUser root -DBPassword "" -DBName albru -CopyDist -StartServer

  # Si tu compañero prefiere importar con Workbench (más seguro):
  .\scripts\bootstrap_for_colleague.ps1 -UseWorkbench -CopyDist

Parámetros:
  -ImportDb       Ejecuta import_mysql.ps1 (requiere cliente mysql en PATH)
  -UseWorkbench   Muestra instrucciones para importar con MySQL Workbench/PhpMyAdmin (no intenta importar)
  -DBUser         Usuario MySQL (por defecto: root)
  -DBPassword     Contraseña MySQL (por defecto: vacío)
  -DBName         Nombre BD (por defecto: albru)
  -CopyDist       Copia dist a backend/dist después del build
  -StartServer    Inicia el backend en una nueva ventana PowerShell (ejecuta npm run start:prod en backend)

NOTA: no ejecuta nada sin confirmación interactiva en la mayoría de pasos.
#>

param(
  [switch]$ImportDb,
  [switch]$UseWorkbench,
  [string]$DBUser = 'root',
  [string]$DBPassword = '',
  [string]$DBName = 'albru',
  [switch]$CopyDist,
  [switch]$StartServer
)

function Confirm-OrExit($msg) {
  $r = Read-Host "$msg (Y/n)"
  if ($r -and $r -match '^[nN]') { Write-Host "Aborting."; exit 0 }
}

Write-Host "Bootstrap iniciado. Opciones: ImportDb=$ImportDb UseWorkbench=$UseWorkbench CopyDist=$CopyDist StartServer=$StartServer"

if ($UseWorkbench) {
  Write-Host "==> Has elegido usar MySQL Workbench/PhpMyAdmin para importar la BD."
  Write-Host "Importa el fichero: src\database\albru_consolidado_completo.sql en el schema '$DBName'."
  Confirm-OrExit "¿Confirmas que ya importaste la base de datos con Workbench?"
} elseif ($ImportDb) {
  # Llamar al import_mysql.ps1
  Write-Host "==> Intentando importar la BD automáticamente con scripts/import_mysql.ps1"
  Confirm-OrExit "¿Deseas proceder con la importación automática ahora?"
  $importScript = Join-Path $PSScriptRoot 'import_mysql.ps1'
  if (-not (Test-Path $importScript)) { Write-Error "No se encuentra $importScript"; exit 1 }
  & $importScript -User $DBUser -Password $DBPassword -DbName $DBName
  if ($LASTEXITCODE -ne 0) { Write-Error "Import falló (código $LASTEXITCODE). Revisa logs."; exit 1 }
}

# Crear backend/.env
Write-Host "==> Crear/actualizar backend/.env desde .env.example"
Confirm-OrExit "¿Deseas crear o actualizar backend/.env ahora?"
$createEnv = Join-Path $PSScriptRoot 'create_backend_env.ps1'
if (-not (Test-Path $createEnv)) { Write-Error "No se encuentra $createEnv"; exit 1 }
& $createEnv -DB_USER $DBUser -DB_PASSWORD $DBPassword -DB_NAME $DBName

# Instalar dependencias y build
Write-Host "==> Instalando dependencias (root y backend) y construyendo frontend"
Confirm-OrExit "¿Procedo con npm install y build? Esto descargará dependencias (internet requerido)."

Push-Location (Join-Path $PSScriptRoot '..')
try {
  Write-Host "Running npm install (root)..."
  npm install

  Write-Host "Running npm install (backend)..."
  Push-Location 'backend'
  npm install
  Pop-Location

  Write-Host "Running npm run build (root)..."
  npm run build
} finally {
  Pop-Location
}

if ($CopyDist) {
  Write-Host "==> Copiando dist a backend/dist"
  .\scripts\build_and_copy_dist.ps1
}

Write-Host "==> Setup finalizado."

if ($StartServer) {
  Confirm-OrExit "¿Deseas iniciar el backend ahora en una nueva ventana PowerShell?"
  $backendPath = Join-Path $PSScriptRoot '..\backend'
  $psCommand = "cd `"$backendPath`"; npm run start:prod"
  Start-Process -FilePath powershell -ArgumentList '-NoExit','-Command',$psCommand -WorkingDirectory $backendPath
  Write-Host "Backend iniciado en nueva ventana PowerShell (siempre puedes usar pm2 para producción)."
}

Write-Host "Bootstrap completo. Revisa README-PRODUCTION.md para detalles adicionales."
