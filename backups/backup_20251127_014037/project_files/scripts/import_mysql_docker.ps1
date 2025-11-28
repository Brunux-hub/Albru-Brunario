<#
.SYNOPSIS
  Importa un archivo SQL a la base de datos MySQL dentro del contenedor Docker.

.DESCRIPTION
  Script para importar archivos SQL específicamente al contenedor MySQL de Docker.
  Usa el contenedor 'albru-base' por defecto.

.PARAMETER ContainerName
  Nombre del contenedor MySQL (por defecto: albru-base)

.PARAMETER User
  Usuario MySQL (por defecto: root)

.PARAMETER Password
  Contraseña del usuario MySQL (por defecto: root_password_here)

.PARAMETER DbName
  Nombre de la base de datos a crear/importar (por defecto: albru)

.PARAMETER SqlFile
  Ruta al archivo SQL a importar. Por defecto: src/database/albru_consolidado_completo.sql

.EXAMPLE
  .\import_mysql_docker.ps1
  
.EXAMPLE
  .\import_mysql_docker.ps1 -Password "mi_password" -DbName "mi_base"
#>

param(
  [string]$ContainerName = 'albru-base',
  [string]$User = 'root',
  [string]$Password = 'root_password_here',
  [string]$DbName = 'albru',
  [string]$SqlFile = (Join-Path $PSScriptRoot '..\src\database\albru_consolidado_completo.sql')
)

Write-Host "[import_mysql_docker] Inicio: contenedor=$ContainerName, usuario=$User, db=$DbName" -ForegroundColor Green
Write-Host "[import_mysql_docker] Archivo SQL: $SqlFile" -ForegroundColor Yellow

# Verificar que Docker está corriendo
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "Docker no está instalado o no está en PATH."
  exit 1
}

# Verificar que el contenedor existe y está corriendo
$containerStatus = docker ps --filter "name=$ContainerName" --format "{{.Status}}"
if (-not $containerStatus) {
  Write-Error "Contenedor '$ContainerName' no está corriendo. Ejecuta 'docker-compose up -d' primero."
  exit 1
}

Write-Host "[import_mysql_docker] Contenedor '$ContainerName' está corriendo: $containerStatus" -ForegroundColor Green

# Verificar que el archivo SQL existe
if (-not (Test-Path $SqlFile)) {
  Write-Error "Archivo SQL no encontrado: $SqlFile"
  exit 1
}

try {
  # Crear base de datos si no existe (usando docker exec)
  Write-Host "[import_mysql_docker] Creando base de datos '$DbName' si no existe..." -ForegroundColor Yellow
  $createCmd = "CREATE DATABASE IF NOT EXISTS $DbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  
  docker exec -i $ContainerName mysql -u $User -p"$Password" -e $createCmd
  if ($LASTEXITCODE -ne 0) { 
    Throw "Error al crear la base de datos. Exit code: $LASTEXITCODE" 
  }

  # Importar SQL usando Get-Content y pipeline
  Write-Host "[import_mysql_docker] Importando archivo SQL... (esto puede tardar)" -ForegroundColor Yellow
  
  Get-Content $SqlFile -Encoding UTF8 | docker exec -i $ContainerName mysql -u $User -p"$Password" $DbName
  if ($LASTEXITCODE -ne 0) { 
    Throw "Error al importar el archivo SQL. Exit code: $LASTEXITCODE" 
  }

  Write-Host "[import_mysql_docker] ✅ Importación completada exitosamente" -ForegroundColor Green
  
  # Verificar que se importó correctamente
  Write-Host "[import_mysql_docker] Verificando tablas importadas..." -ForegroundColor Yellow
  docker exec -i $ContainerName mysql -u $User -p"$Password" -e "USE $DbName; SHOW TABLES;" 2>$null
  
  Write-Host "[import_mysql_docker] ✅ Proceso completado" -ForegroundColor Green
  exit 0

} catch {
  Write-Error "[import_mysql_docker] ❌ Error: $($_.Exception.Message)"
  exit 2
}