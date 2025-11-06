<#
Watch frontend source and automatically rebuild & restart frontend container when files change.
Usage (PowerShell):
  Set-Location C:\Users\DARIO\Albru-Brunario
  .\scripts\watch-and-rebuild-frontend.ps1

Notes: requires Docker and docker compose available in PATH. This script uses a simple debounce to avoid repeated builds.
#>

$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Write-Host "Watching frontend files under: $root\src and package*.json"

$filesToWatch = @(
    Join-Path $root 'src'
    Join-Path $root 'package.json'
    Join-Path $root 'package-lock.json'
    Join-Path $root 'vite.config.ts'
    Join-Path $root 'postcss.config.js'
    Join-Path $root 'tailwind.config.js'
)

$changed = $false
$timer = $null
$debounceMs = 2500

function Trigger-Rebuild {
    if ($timer) {
        $timer.Stop()
        $timer.Dispose()
        $timer = $null
    }
    Start-Sleep -Milliseconds 500
    Write-Host "[watch] Cambios detectados. Construyendo frontend y reiniciando contenedor..." -ForegroundColor Cyan
    try {
        Set-Location -Path $root
        docker compose build frontend
        docker compose up -d frontend
        Write-Host "[watch] Rebuild + restart completado." -ForegroundColor Green
    } catch {
        Write-Host "[watch] Error durante rebuild: $_" -ForegroundColor Red
    }
}

# Register watchers
$fsw = New-Object System.IO.FileSystemWatcher
$fsw.Path = Join-Path $root 'src'
$fsw.IncludeSubdirectories = $true
$fsw.Filter = '*.*'
$fsw.EnableRaisingEvents = $true

Register-ObjectEvent $fsw 'Changed' -Action {
    # Debounce: reset timer on every change
    if ($timer -eq $null) {
        $timer = New-Object System.Timers.Timer $debounceMs
        $timer.AutoReset = $false
        $timer.add_Elapsed({ Trigger-Rebuild })
        $timer.Start()
    } else {
        $timer.Stop()
        $timer.Start()
    }
}

# Also watch package.json and other root files
foreach ($f in @('package.json','package-lock.json','vite.config.ts','postcss.config.js','tailwind.config.js')) {
    $full = Join-Path $root $f
    if (Test-Path $full) {
        $fsw2 = New-Object System.IO.FileSystemWatcher
        $fsw2.Path = $root
        $fsw2.Filter = $f
        $fsw2.IncludeSubdirectories = $false
        $fsw2.EnableRaisingEvents = $true
        Register-ObjectEvent $fsw2 'Changed' -Action {
            if ($timer -eq $null) {
                $timer = New-Object System.Timers.Timer $debounceMs
                $timer.AutoReset = $false
                $timer.add_Elapsed({ Trigger-Rebuild })
                $timer.Start()
            } else {
                $timer.Stop()
                $timer.Start()
            }
        }
    }
}

Write-Host "Watcher activo. Presiona Ctrl+C para salir." -ForegroundColor Yellow

# Keep script running
while ($true) { Start-Sleep -Seconds 3600 }
