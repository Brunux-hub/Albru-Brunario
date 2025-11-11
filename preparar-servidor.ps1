# 🚀 Script de Preparación para Despliegue en Servidor
# Ejecutar este script en tu PC para preparar los archivos

Write-Host "🚀 PREPARANDO DESPLIEGUE PARA SERVIDOR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Crear carpeta de despliegue
Write-Host "📁 Paso 1: Creando carpeta deploy-servidor..." -ForegroundColor Yellow
if (Test-Path ".\deploy-servidor") {
    Remove-Item ".\deploy-servidor" -Recurse -Force
}
New-Item -ItemType Directory -Force -Path ".\deploy-servidor" | Out-Null
Write-Host "✅ Carpeta creada" -ForegroundColor Green
Write-Host ""

# Paso 2: Copiar archivos de configuración raíz
Write-Host "📋 Paso 2: Copiando archivos de configuración..." -ForegroundColor Yellow
$rootFiles = @(
    "docker-compose.yml",
    "nginx.conf",
    "Dockerfile",
    "package.json",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "postcss.config.js",
    "tailwind.config.js",
    "eslint.config.js",
    "index.html"
)

foreach ($file in $rootFiles) {
    if (Test-Path $file) {
        Copy-Item $file ".\deploy-servidor\" -Force
        Write-Host "  ✓ $file" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠ $file no encontrado (opcional)" -ForegroundColor DarkGray
    }
}
Write-Host "✅ Archivos de configuración copiados" -ForegroundColor Green
Write-Host ""

# Paso 3: Copiar carpetas completas
Write-Host "📦 Paso 3: Copiando carpetas del proyecto..." -ForegroundColor Yellow
$folders = @("backend", "src", "public", "database")

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Copy-Item $folder ".\deploy-servidor\" -Recurse -Force
        $itemCount = (Get-ChildItem ".\deploy-servidor\$folder" -Recurse -File).Count
        Write-Host "  ✓ $folder ($itemCount archivos)" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠ $folder no encontrado" -ForegroundColor Red
    }
}
Write-Host "✅ Carpetas copiadas" -ForegroundColor Green
Write-Host ""

# Paso 4: Exportar base de datos
Write-Host "🗄️ Paso 4: Exportando base de datos actual..." -ForegroundColor Yellow
docker exec albru-base mysqldump -u albru -palbru12345 --no-tablespaces albru > ".\deploy-servidor\database\init.sql" 2>$null
if (Test-Path ".\deploy-servidor\database\init.sql") {
    $dbSize = (Get-Item ".\deploy-servidor\database\init.sql").Length / 1MB
    Write-Host "✅ Base de datos exportada ($([math]::Round($dbSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "❌ Error al exportar base de datos" -ForegroundColor Red
}
Write-Host ""

# Paso 5: Preparar archivo .env
Write-Host "⚙️ Paso 5: Configurando archivo .env..." -ForegroundColor Yellow
Copy-Item ".env.servidor" ".\deploy-servidor\.env" -Force
Write-Host "✅ Archivo .env copiado" -ForegroundColor Green
Write-Host ""

# Paso 6: Crear README para el servidor
Write-Host "📝 Paso 6: Creando README de instalación..." -ForegroundColor Yellow
$readmeContent = @"
# 🚀 INSTALACIÓN EN SERVIDOR

## ⚡ INSTRUCCIONES RÁPIDAS

### 1. Obtener IP del Servidor
``````powershell
ipconfig
# Anota la IPv4 (ejemplo: 192.168.1.100)
``````

### 2. Configurar .env
``````powershell
notepad .env

# Reemplazar TODAS las apariciones de 192.168.1.XXX con tu IP real
# Ejemplo: Si IP es 192.168.1.100
VITE_API_URL=http://192.168.1.100:3001
VITE_BACKEND_URL=http://192.168.1.100:3001
VITE_WS_URL=http://192.168.1.100:3001
CORS_ORIGINS=http://192.168.1.100:5173,http://192.168.1.100,http://localhost
``````

### 3. Levantar Docker
``````powershell
docker compose up -d --build
``````

### 4. Importar Base de Datos
``````powershell
# Esperar 10 segundos
Start-Sleep -Seconds 10

# Importar
Get-Content database\init.sql | docker exec -i albru-base mysql -u albru -palbru12345 albru
``````

### 5. Configurar Firewall
``````powershell
# Como Administrador:
New-NetFirewallRule -DisplayName "Albru Frontend" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Albru Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
``````

### 6. Verificar
Desde cualquier PC en la red:
- Frontend: ``http://IP_SERVIDOR``
- API: ``http://IP_SERVIDOR:3001/health``

## 🔑 Credenciales
- **Admin**: admin@albru.com / admin123
- **GTR**: mcaceresv@albru.pe / password

## 🐛 Troubleshooting
``````powershell
# Ver logs
docker compose logs -f

# Reiniciar servicios
docker compose restart

# Verificar contenedores
docker ps
``````

¡Listo! 🎉
"@

$readmeContent | Out-File -FilePath ".\deploy-servidor\README-INSTALACION.md" -Encoding UTF8
Write-Host "✅ README creado" -ForegroundColor Green
Write-Host ""

# Resumen final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ PREPARACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalSize = (Get-ChildItem ".\deploy-servidor" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
$fileCount = (Get-ChildItem ".\deploy-servidor" -Recurse -File).Count

Write-Host "📊 ESTADÍSTICAS:" -ForegroundColor Cyan
Write-Host "  • Tamaño total: $([math]::Round($totalSize, 2)) MB" -ForegroundColor White
Write-Host "  • Archivos: $fileCount" -ForegroundColor White
Write-Host "  • Ubicación: .\deploy-servidor\" -ForegroundColor White
Write-Host ""

Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 📂 Copiar carpeta 'deploy-servidor' al servidor por AnyDesk" -ForegroundColor White
Write-Host "   → Pegar en: C:\AlbruApp\" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 🌐 En el servidor, obtener IP:" -ForegroundColor White
Write-Host "   → ipconfig" -ForegroundColor Gray
Write-Host ""
Write-Host "3. ⚙️ Editar .env con la IP correcta:" -ForegroundColor White
Write-Host "   → notepad C:\AlbruApp\.env" -ForegroundColor Gray
Write-Host "   → Reemplazar 192.168.1.XXX con IP real" -ForegroundColor Gray
Write-Host ""
Write-Host "4. 🚀 Levantar Docker:" -ForegroundColor White
Write-Host "   → cd C:\AlbruApp" -ForegroundColor Gray
Write-Host "   → docker compose up -d --build" -ForegroundColor Gray
Write-Host ""
Write-Host "5. 🗄️ Importar base de datos:" -ForegroundColor White
Write-Host "   → Get-Content database\init.sql | docker exec -i albru-base mysql -u albru -palbru12345 albru" -ForegroundColor Gray
Write-Host ""
Write-Host "6. 🔥 Configurar firewall (como Admin):" -ForegroundColor White
Write-Host "   → Ver README-INSTALACION.md en deploy-servidor" -ForegroundColor Gray
Write-Host ""
Write-Host "7. ✅ Probar desde tu PC:" -ForegroundColor White
Write-Host "   → http://IP_SERVIDOR" -ForegroundColor Gray
Write-Host ""

Write-Host "📖 Para más detalles, consulta:" -ForegroundColor Cyan
Write-Host "  • DEPLOY-SERVIDOR.md (guía completa)" -ForegroundColor White
Write-Host "  • deploy-servidor\README-INSTALACION.md (guía rápida)" -ForegroundColor White
Write-Host ""

Write-Host "¡Listo para copiar al servidor! 🎉" -ForegroundColor Green
