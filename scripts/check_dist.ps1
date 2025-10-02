param(
  [string]$DistPath = "$PSScriptRoot\..\dist"
)
if (Test-Path $DistPath) {
  Write-Host "dist found: $DistPath"
  Get-ChildItem $DistPath -File | Select-Object Name, Length | Format-Table
  exit 0
} else {
  Write-Error "dist not found. Run npm run build in project root first."
  exit 1
}
