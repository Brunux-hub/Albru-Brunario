<#
.SYNOPSIS
  Script seguro para respaldar la base de datos MySQL y aplicar migraciones SQL.

.DESCRIPTION
  Crea un dump (mysqldump) con timestamp en la ruta indicada, aplica las migraciones listadas
  y en caso de error ofrece instrucciones para rollback (importar el dump).

.NOTES
  - Requiere `mysqldump` y `mysql` en PATH OR usar `-UseDocker -DockerContainerName <name>` para ejecutar dentro de un contenedor.
  - No envíes credenciales por chat. Ejecuta el script localmente.

.PARAMETER DbHost
  Host de la base de datos (default: localhost)
.PARAMETER DbPort
  Puerto MySQL (default: 3306)
.PARAMETER DbUser
  Usuario MySQL
.PARAMETER DbPassword
  Password MySQL (se recomienda pasar por variable de entorno MYSQL_PWD en vez de aquí)
.PARAMETER DbName
  Nombre de la base de datos (default: albru)
.PARAMETER BackupDir
  Carpeta donde guardar los dumps (default: ./database/backups)
.PARAMETER UseDocker
  Si se usa, utiliza `docker exec <container>` para ejecutar mysqldump/mysql en el contenedor.
.PARAMETER DockerContainerName
  Nombre del contenedor MySQL (solo si -UseDocker)

EXAMPLE
  # Backup y aplicar migraciones usando cliente local
  .\apply_migrations.ps1 -DbUser root -DbPassword secret -DbName albru

  # Usando MySQL dentro de Docker (container name mysql)
  .\apply_migrations.ps1 -DbUser root -DbPassword secret -DbName albru -UseDocker -DockerContainerName mysql

#>

param(
  [string]$DbHost = 'localhost',
  [int]$DbPort = 3306,
  [string]$DbUser = 'root',
  [string]$DbPassword = '',
  [string]$DbName = 'albru',
  [string]$BackupDir = (Join-Path -Path $PSScriptRoot -ChildPath '..\..\database\backups'),
  [switch]$UseDocker,
  [string]$DockerContainerName
)

function Ensure-Dir([string]$path){ if(-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path | Out-Null } }

Write-Host "[apply_migrations] Destino backup: $BackupDir"
Ensure-Dir -path $BackupDir

$timestamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
$dumpFile = Join-Path $BackupDir "${DbName}_backup_${timestamp}.sql"

if($UseDocker -and -not $DockerContainerName){
  Write-Error "Si usa -UseDocker debe pasar -DockerContainerName <container>"
  exit 1
}

if($UseDocker){
  Write-Host "[apply_migrations] Creando backup desde contenedor Docker: $DockerContainerName -> $dumpFile"
  $cmd = "docker exec $DockerContainerName mysqldump -u$DbUser -p$DbPassword $DbName"
  try{
    # Ejecutar docker exec y redirigir salida al archivo local
    iex "$cmd > `"$dumpFile`""
  } catch {
    Write-Error "Error ejecutando mysqldump en contenedor: $_"
    exit 1
  }
} else {
  # Local mysqldump
  $mysqldump = Get-Command mysqldump -ErrorAction SilentlyContinue
  if(-not $mysqldump){
    Write-Error "No se encontró 'mysqldump' en PATH. Instale cliente MySQL o use -UseDocker <container>"
    exit 1
  }

  Write-Host "[apply_migrations] Creando backup local con mysqldump -> $dumpFile"
  $dumpArgs = "-h $DbHost -P $DbPort -u $DbUser -p$DbPassword $DbName"
  $fullCmd = "mysqldump $dumpArgs > `"$dumpFile`""
  $rc = cmd /c $fullCmd
}

if(-not (Test-Path $dumpFile)){
  Write-Error "El dump no fue creado: $dumpFile"
  exit 1
}

Write-Host "Backup creado: $dumpFile"

# Lista de migraciones (ordenadas)
$migrations = @(
  (Join-Path $PSScriptRoot '..\migrations\002_historial_estados.sql'),
  (Join-Path $PSScriptRoot '..\migrations\003_add_estatus_wizard.sql')
)

foreach($mig in $migrations){
  if(-not (Test-Path $mig)){
    Write-Warning "Migration no encontrada, saltando: $mig"
    continue
  }

  Write-Host "[apply_migrations] Aplicando: $mig"

  if($UseDocker){
    # Copiar el SQL al contenedor temporalmente y ejecutar
  $remotePath = "/tmp/$(Split-Path $mig -Leaf)"
  # Use ${DockerContainerName} to avoid PowerShell parsing issues with ':' inside double quotes
  docker cp $mig "${DockerContainerName}:$remotePath"
  # Construir el comando por concatenación para evitar problemas de parsing con comillas y $variables
  $execCmd = 'docker exec ' + ${DockerContainerName} + ' sh -c "mysql -u' + $DbUser + ' -p' + $DbPassword + ' ' + $DbName + ' < ' + $remotePath + '"'
    Write-Host "Ejecutando en contenedor: $execCmd"
    iex $execCmd
    if($LASTEXITCODE -ne 0){
      Write-Error "Error al ejecutar comando en contenedor (código $LASTEXITCODE). Detengo ejecución. Para rollback: importar $dumpFile"
      exit 1
    }
    # opcional: docker exec rm
  docker exec ${DockerContainerName} rm -f $remotePath
  } else {
    $mysql = Get-Command mysql -ErrorAction SilentlyContinue
    if(-not $mysql){
      Write-Error "No se encontró 'mysql' en PATH. Instale cliente MySQL o use -UseDocker <container>."
      exit 1
    }

    $applyCmd = "mysql -h $DbHost -P $DbPort -u $DbUser -p$DbPassword $DbName < `"$mig`""
    Write-Host "Ejecutando: $applyCmd"
    $rc = cmd /c $applyCmd
    if($LASTEXITCODE -ne 0){
      Write-Error "Error al aplicar migración $mig (código $LASTEXITCODE). Detengo ejecución."
      Write-Host "Para rollback: importar $dumpFile usando 'mysql -uUSER -pPASSWORD $DbName < $dumpFile'"
      exit 1
    }
  }

  Write-Host "Aplicada: $mig"
}

Write-Host "Todas las migraciones aplicadas correctamente. Ejecuta las comprobaciones recomendadas (ver README en la salida)."

Write-Host "-- Verificaciones sugeridas --"
Write-Host "1) Comprobar existencia de tabla historial_estados: SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DbName' AND table_name='historial_estados';"
Write-Host "2) Comprobar columna estatus_wizard: SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$DbName' AND TABLE_NAME='clientes' AND COLUMN_NAME='estatus_wizard';"
Write-Host "3) Ejecutar tests backend: cd ..\backend; npm test"
Write-Host "4) Si falló, restaurar backup: mysql -h $DbHost -P $DbPort -u $DbUser -p$DbPassword $DbName < `"$dumpFile`""

Write-Host "Script finalizado."
