<#
.SYNOPSIS
  Crea la base de datos MySQL y la importa desde un archivo SQL.

.DESCRIPTION
  Script idempotente para entornos Windows. Comprueba que el cliente 'mysql' está en PATH,
  crea la base de datos si no existe e importa el archivo SQL especificado.

.PARAMETER User
  Usuario MySQL (por defecto: root)

.PARAMETER Password
  Contraseña del usuario MySQL (por defecto: vacío). Si se deja vacía, se intentará la conexión sin contraseña.

.PARAMETER DbName
  Nombre de la base de datos a crear/importar (por defecto: albru)

.PARAMETER SqlFile
  Ruta al archivo SQL a importar. Por defecto: src/database/albru_completo_mysql.sql

USAGE
  .\import_mysql.ps1 -User root -Password "miPass" -DbName albru
  # o interactivo
  .\import_mysql.ps1
#>

param(
  [string]$User = 'root',
  [string]$Password = '',
  [string]$DbName = 'albru',
  [string]$SqlFile = (Join-Path $PSScriptRoot '..\src\database\albru_completo_mysql.sql')
)

Write-Host "[import_mysql] Inicio: usuario=$User, db=$DbName, sqlFile=$SqlFile"

# Comprobar cliente mysql
if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) {
  Write-Error "Cliente 'mysql' no se encuentra en PATH. Instala MySQL o añade el cliente al PATH."
  exit 1
}

if (-not (Test-Path $SqlFile)) {
  Write-Error "Archivo SQL no encontrado: $SqlFile"
  exit 1
}

try {
  # Crear base de datos si no existe
  $createCmd = "CREATE DATABASE IF NOT EXISTS `$DbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  $argsCreate = @("--user=$User")
  if ($Password -ne '') { $argsCreate += "--password=$Password" }
  $argsCreate += @("-e", $createCmd)

  Write-Host "[import_mysql] Creando base de datos (si no existe)..."
  $proc = Start-Process -FilePath mysql -ArgumentList $argsCreate -NoNewWindow -Wait -PassThru -ErrorAction Stop
  if ($proc.ExitCode -ne 0) { Throw "mysql returned exit code $($proc.ExitCode)" }

  # Importar SQL
  Write-Host "[import_mysql] Importando archivo SQL a la base de datos '$DbName'... (esto puede tardar)"

  # Construir comando de importación con cmd.exe para usar redirección '<'
  $pwdEscaped = $SqlFile -replace '/', '\\'
  $cmd = "mysql --user=$User " + (if ($Password -ne '') { "--password=$Password " } else { "" }) + "$DbName < \"$pwdEscaped\""

  $full = "cmd /c $cmd"
  $proc2 = Start-Process -FilePath cmd -ArgumentList '/c', $cmd -NoNewWindow -Wait -PassThru -ErrorAction Stop
  if ($proc2.ExitCode -ne 0) { Throw "Import failed, mysql returned exit code $($proc2.ExitCode)" }

  Write-Host "[import_mysql] Import completed successfully."
  exit 0

} catch {
  Write-Error "[import_mysql] Error: $($_.Exception.Message)"
  exit 2
}
