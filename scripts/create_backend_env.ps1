<#
.CHECK
 Script to create backend\.env from .env.example interactively or with params
#>
param(
  [string]$File = "$PSScriptRoot\..\backend\.env",
  [string]$Example = "$PSScriptRoot\..\backend\.env.example",
  [string]$DB_HOST = 'localhost',
  [string]$DB_PORT = '3306',
  [string]$DB_USER = 'root',
  [string]$DB_PASSWORD = '',
  [string]$DB_NAME = 'albru',
  [string]$PORT = '3001'
)

Write-Host "Creating $File from example $Example"
if (-not (Test-Path $Example)) {
  Write-Error "$Example not found"
  exit 1
}

Copy-Item -Force $Example $File
(Get-Content $File) -replace 'DB_HOST=.*', "DB_HOST=$DB_HOST" | Set-Content $File
(Get-Content $File) -replace 'DB_PORT=.*', "DB_PORT=$DB_PORT" | Set-Content $File
(Get-Content $File) -replace 'DB_USER=.*', "DB_USER=$DB_USER" | Set-Content $File
(Get-Content $File) -replace 'DB_PASSWORD=.*', "DB_PASSWORD=$DB_PASSWORD" | Set-Content $File
(Get-Content $File) -replace 'DB_NAME=.*', "DB_NAME=$DB_NAME" | Set-Content $File
(Get-Content $File) -replace 'PORT=.*', "PORT=$PORT" | Set-Content $File

Write-Host "Created $File"
