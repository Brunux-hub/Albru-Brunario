<#
  verify_migrations.ps1
  Verifica que las migraciones se aplicaron correctamente:
    - Comprueba existencia de tabla historial_estados
    - Comprueba existencia de columna estatus_wizard en clientes
    - Ejecuta tests backend (npm test)

  Uso:
    pwsh .\verify_migrations.ps1 -DbHost localhost -DbPort 3306 -DbUser root -DbName albru

  Soporta -UseDocker y -DockerContainerName (ejecuta consultas dentro del contenedor)
#>

param(
  [string]$DbHost = 'localhost',
  [int]$DbPort = 3306,
  [string]$DbUser = 'root',
  [string]$DbPassword = '',
  [string]$DbName = 'albru',
  [switch]$UseDocker,
  [string]$DockerContainerName
)

function Run-MySQLQuery([string]$query){
  if($UseDocker){
    if(-not $DockerContainerName){ Write-Error "-UseDocker requiere -DockerContainerName"; exit 1 }
  # Construir el comando interno y usar & para invocar 'docker' directamente (evita iex y facilita el escape)
  # Use double quotes around the SQL so internal single quotes in the SQL don't break the shell quoting
  $inner = 'mysql -N -s -u' + $DbUser + ' -p' + $DbPassword + ' -e "' + $query + '" ' + $DbName
  Write-Host "Ejecutando en contenedor: docker exec $DockerContainerName sh -c $inner"
  & docker exec $DockerContainerName sh -c $inner
  } else {
    $mysql = Get-Command mysql -ErrorAction SilentlyContinue
    if(-not $mysql){ Write-Error "No se encontró 'mysql' en PATH. Instale cliente MySQL o use -UseDocker"; exit 1 }
  # Construir comando por concatenación para evitar problemas de parsing
  $cmd = 'mysql -h ' + $DbHost + ' -P ' + $DbPort + ' -u ' + $DbUser + ' -p' + $DbPassword + ' -N -s -e "' + $query + '" ' + $DbName
  Write-Host "Ejecutando: $cmd"
  $out = cmd /c $cmd
  Write-Host $out
  }
}

Write-Host "-- Verificación: existencia de tabla historial_estados --"
Run-MySQLQuery "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DbName' AND table_name='historial_estados';"

Write-Host "-- Verificación: existencia de columna estatus_wizard en clientes --"
Run-MySQLQuery "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$DbName' AND TABLE_NAME='clientes' AND COLUMN_NAME='estatus_wizard';"

Write-Host "-- Verificación: mostrar primeras filas de historial_estados (si existe) --"
Run-MySQLQuery "SELECT id, cliente_id, usuario_id, tipo, estado_anterior, estado_nuevo, comentarios, created_at FROM historial_estados ORDER BY created_at DESC LIMIT 5;"

Write-Host "-- Ejecutando tests backend (npm test) --"
Push-Location (Join-Path $PSScriptRoot '..')
if(Test-Path "package.json"){
  # Ejecutar npm test y capturar salida
  try{
    Write-Host "Ejecutando 'npm test' en $(Get-Location)... esto puede tardar"
    $result = npm test 2>&1
    Write-Host $result
  } catch {
    Write-Error "Error al ejecutar npm test: $_"
  }
} else {
  Write-Host "package.json no encontrado en $(Get-Location), saltando tests"
}
Pop-Location

Write-Host "-- Verificación finalizada --"
