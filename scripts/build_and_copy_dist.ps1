# Build frontend and copy dist into backend/dist (idempotent)
param(
  [string]$ProjectRoot = "$PSScriptRoot\..",
  [string]$DistSrc = "$PSScriptRoot\..\dist",
  [string]$DistDest = "$PSScriptRoot\..\backend\dist"
)

Write-Host "Building frontend (root)..."
Push-Location $ProjectRoot
npm install
npm run build
Pop-Location

Write-Host "Copying dist to backend/dist..."
if (Test-Path $DistDest) { Remove-Item -Recurse -Force $DistDest }
Copy-Item -Recurse -Force $DistSrc $DistDest
Write-Host "Done. backend\dist updated."
