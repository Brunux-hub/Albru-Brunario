# 🤖 INSTRUCCIONES PARA CLAUDE EN EL SERVIDOR

> **Contexto:** Soy Claude ejecutándose en el servidor donde se desplegará el sistema Albru CRM. Este servidor tiene Docker instalado y está conectado al repositorio Git. Debo seguir estas instrucciones paso a paso para desplegar el sistema completo.

---

## 📋 MI MISIÓN

Desplegar completamente el sistema Albru CRM en este servidor, incluyendo:
- ✅ Frontend (React + Vite + Material-UI)
- ✅ Backend (Node.js + Express)
- ✅ Base de datos MySQL con todos los datos
- ✅ Configuración de red y firewall
- ✅ Verificación de funcionamiento

---

## 🔍 PASO 0: VERIFICAR CONTEXTO

Primero debo verificar dónde estoy y qué tengo disponible:

### Verificar ubicación y Git
```powershell
# Verificar directorio actual
Get-Location

# Verificar conexión a Git
git remote -v

# Verificar rama actual
git branch --show-current

# Ver últimos commits
git log --oneline -5
```

### Verificar Docker
```powershell
# Verificar instalación de Docker
docker --version
docker compose version

# Ver contenedores existentes (si hay)
docker ps -a
```

### Verificar IP del servidor
```powershell
# Obtener IP de red local
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.IPAddress -ne "127.0.0.1"
} | Select-Object IPAddress, InterfaceAlias
```

**Debo anotar la IP que usaré (ejemplo: 192.168.1.100)**

---

## 🚀 PASO 1: ACTUALIZAR CÓDIGO DESDE GIT

```powershell
# Hacer pull del código más reciente
git pull origin main

# Verificar que se actualizó
git log --oneline -1
```

---

## ⚙️ PASO 2: CREAR ARCHIVO .env CON LA IP CORRECTA

Debo crear el archivo `.env` en la raíz del proyecto con la IP real del servidor.

```powershell
# Primero, obtener la IP del servidor
$ServerIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.IPAddress -ne "127.0.0.1"
} | Select-Object -First 1).IPAddress

Write-Host "IP del servidor detectada: $ServerIP" -ForegroundColor Green

# Crear archivo .env
$envContent = @"
# CONFIGURACIÓN DEL SERVIDOR
NODE_ENV=production

# Base de datos
DB_HOST=albru-base
DB_USER=albru
DB_PASSWORD=albru12345
DB_NAME=albru
DB_ROOT_PASSWORD=root_password_here

# JWT
JWT_SECRET=albru_jwt_secret_key_2025_secure_production

# Puertos
BACKEND_PORT=3001
FRONTEND_PORT=80

# URLs - Configuradas con la IP del servidor
VITE_API_URL=http://${ServerIP}:3001
VITE_BACKEND_URL=http://${ServerIP}:3001
VITE_WS_URL=http://${ServerIP}:3001

# CORS - Permitir acceso desde la red local
CORS_ORIGINS=http://${ServerIP}:5173,http://${ServerIP},http://localhost:5173,http://localhost:3001,http://localhost
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline

Write-Host "✅ Archivo .env creado con IP: $ServerIP" -ForegroundColor Green
```

---

## 🗄️ PASO 3: PREPARAR BASE DE DATOS

Verificar que existe el archivo de base de datos:

```powershell
# Verificar si existe database/init.sql
if (Test-Path "database\init.sql") {
    $dbSize = (Get-Item "database\init.sql").Length / 1MB
    Write-Host "✅ Archivo de base de datos encontrado: $([math]::Round($dbSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "❌ No se encontró database\init.sql" -ForegroundColor Red
    Write-Host "   Verificando archivos SQL alternativos..." -ForegroundColor Yellow
    Get-ChildItem database\*.sql | Select-Object Name, Length
}
```

Si no existe `database/init.sql`, usar el archivo SQL más reciente:

```powershell
# Buscar el archivo SQL más grande (probablemente el dump completo)
$sqlFile = Get-ChildItem database\*.sql | Sort-Object Length -Descending | Select-Object -First 1

if ($sqlFile) {
    Write-Host "📋 Usando archivo: $($sqlFile.Name)" -ForegroundColor Cyan
    Copy-Item $sqlFile.FullName "database\init.sql" -Force
    Write-Host "✅ Archivo copiado como database\init.sql" -ForegroundColor Green
}
```

---

## 🐳 PASO 4: LIMPIAR CONTENEDORES ANTERIORES (SI EXISTEN)

```powershell
# Detener y eliminar contenedores anteriores
Write-Host "🧹 Limpiando contenedores anteriores..." -ForegroundColor Yellow
docker compose down -v 2>$null

# Eliminar imágenes antiguas (opcional, para construir desde cero)
# docker rmi albru-brunario-frontend albru-brunario-backend 2>$null

Write-Host "✅ Limpieza completada" -ForegroundColor Green
```

---

## 🏗️ PASO 5: CONSTRUIR Y LEVANTAR CONTENEDORES

Este es el paso más importante. Construirá y levantará todos los servicios:

```powershell
Write-Host "🚀 Construyendo y levantando contenedores..." -ForegroundColor Cyan
Write-Host "   (Este proceso puede tardar 5-10 minutos la primera vez)" -ForegroundColor Gray
Write-Host ""

# Construir y levantar en modo detached
docker compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Contenedores construidos y levantados exitosamente" -ForegroundColor Green
    Write-Host ""
    
    # Mostrar estado
    Write-Host "📊 Estado de los contenedores:" -ForegroundColor Cyan
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
} else {
    Write-Host ""
    Write-Host "❌ Error al construir/levantar contenedores" -ForegroundColor Red
    Write-Host "   Ver logs con: docker compose logs" -ForegroundColor Yellow
    exit 1
}
```

---

## ⏳ PASO 6: ESPERAR A QUE MYSQL ESTÉ LISTO

```powershell
Write-Host ""
Write-Host "⏳ Esperando a que MySQL esté completamente listo..." -ForegroundColor Yellow
Write-Host "   (Esperando 20 segundos para asegurar que MySQL inició)" -ForegroundColor Gray

Start-Sleep -Seconds 20

# Verificar que MySQL responde
$mysqlReady = $false
$attempts = 0
$maxAttempts = 10

while (-not $mysqlReady -and $attempts -lt $maxAttempts) {
    $attempts++
    Write-Host "   Intento $attempts de $maxAttempts..." -ForegroundColor Gray
    
    $result = docker exec albru-base mysql -u albru -palbru12345 -e "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        $mysqlReady = $true
        Write-Host "✅ MySQL está listo y respondiendo" -ForegroundColor Green
    } else {
        Start-Sleep -Seconds 3
    }
}

if (-not $mysqlReady) {
    Write-Host "❌ MySQL no respondió después de varios intentos" -ForegroundColor Red
    Write-Host "   Ver logs: docker compose logs albru-base" -ForegroundColor Yellow
    exit 1
}
```

---

## 📥 PASO 7: IMPORTAR BASE DE DATOS

```powershell
Write-Host ""
Write-Host "📥 Importando base de datos..." -ForegroundColor Cyan

if (-not (Test-Path "database\init.sql")) {
    Write-Host "❌ No se encontró database\init.sql" -ForegroundColor Red
    exit 1
}

$dbSize = (Get-Item "database\init.sql").Length / 1MB
Write-Host "   Importando $([math]::Round($dbSize, 2)) MB de datos..." -ForegroundColor Gray
Write-Host "   (Esto puede tardar 1-2 minutos)" -ForegroundColor Gray
Write-Host ""

# Importar la base de datos
Get-Content "database\init.sql" | docker exec -i albru-base mysql -u albru -palbru12345 albru 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de datos importada exitosamente" -ForegroundColor Green
    Write-Host ""
    
    # Verificar datos importados
    Write-Host "📊 Verificando datos importados:" -ForegroundColor Cyan
    
    # Contar usuarios
    $userCount = docker exec albru-base mysql -u albru -palbru12345 -s -N -e "SELECT COUNT(*) FROM albru.usuarios;" 2>$null
    Write-Host "   • Usuarios: $userCount" -ForegroundColor White
    
    # Contar clientes
    $clientCount = docker exec albru-base mysql -u albru -palbru12345 -s -N -e "SELECT COUNT(*) FROM albru.clientes;" 2>$null
    Write-Host "   • Clientes: $clientCount" -ForegroundColor White
    
    # Verificar usuario admin
    Write-Host ""
    Write-Host "🔍 Verificando usuario admin:" -ForegroundColor Cyan
    docker exec albru-base mysql -u albru -palbru12345 -e "SELECT id, nombre, email, tipo FROM albru.usuarios WHERE tipo = 'admin';" 2>$null
    
} else {
    Write-Host "❌ Error al importar base de datos" -ForegroundColor Red
    Write-Host "   Verifica el archivo database\init.sql" -ForegroundColor Yellow
    exit 1
}
```

---

## 🔥 PASO 8: CONFIGURAR FIREWALL DE WINDOWS

```powershell
Write-Host ""
Write-Host "🔥 Configurando Firewall de Windows..." -ForegroundColor Cyan

# Verificar si tengo permisos de administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
    Write-Host "   ✓ Ejecutando con permisos de Administrador" -ForegroundColor Gray
    
    # Puerto 80 (Frontend)
    $rule80 = Get-NetFirewallRule -DisplayName "Albru Frontend" -ErrorAction SilentlyContinue
    if ($null -eq $rule80) {
        New-NetFirewallRule -DisplayName "Albru Frontend" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow | Out-Null
        Write-Host "   ✓ Puerto 80 (Frontend) abierto" -ForegroundColor Gray
    } else {
        Write-Host "   ✓ Puerto 80 ya estaba abierto" -ForegroundColor Gray
    }
    
    # Puerto 3001 (Backend)
    $rule3001 = Get-NetFirewallRule -DisplayName "Albru Backend API" -ErrorAction SilentlyContinue
    if ($null -eq $rule3001) {
        New-NetFirewallRule -DisplayName "Albru Backend API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow | Out-Null
        Write-Host "   ✓ Puerto 3001 (Backend) abierto" -ForegroundColor Gray
    } else {
        Write-Host "   ✓ Puerto 3001 ya estaba abierto" -ForegroundColor Gray
    }
    
    Write-Host "✅ Firewall configurado correctamente" -ForegroundColor Green
    
} else {
    Write-Host "⚠️ No estoy ejecutando como Administrador" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Para abrir los puertos en el firewall, ejecuta estos comandos como Administrador:" -ForegroundColor Gray
    Write-Host "   New-NetFirewallRule -DisplayName 'Albru Frontend' -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow" -ForegroundColor DarkGray
    Write-Host "   New-NetFirewallRule -DisplayName 'Albru Backend API' -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "   O ejecuta este script completo como Administrador para configurar el firewall automáticamente." -ForegroundColor Gray
}
```

---

## ✅ PASO 9: VERIFICACIÓN FINAL

```powershell
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 VERIFICACIÓN FINAL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtener IP nuevamente
$ServerIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.IPAddress -ne "127.0.0.1"
} | Select-Object -First 1).IPAddress

# Estado de contenedores
Write-Host "📊 Estado de Contenedores:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Out-String | Write-Host
Write-Host ""

# Verificar salud del backend
Write-Host "🏥 Verificando salud del Backend..." -ForegroundColor Cyan
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Backend respondiendo correctamente" -ForegroundColor Green
    Write-Host "   Status: $($healthCheck.status)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️ Backend no responde aún (puede tardar unos segundos más)" -ForegroundColor Yellow
}
Write-Host ""

# Información de acceso
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ SISTEMA DESPLEGADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🌐 URLs DE ACCESO:" -ForegroundColor Cyan
Write-Host "  • Frontend:     http://$ServerIP" -ForegroundColor White
Write-Host "  • Backend API:  http://${ServerIP}:3001" -ForegroundColor White
Write-Host "  • Health Check: http://${ServerIP}:3001/health" -ForegroundColor White
Write-Host ""

Write-Host "🔑 CREDENCIALES DE ACCESO:" -ForegroundColor Cyan
Write-Host "  • Admin:  admin@albru.com / admin123" -ForegroundColor White
Write-Host "  • GTR:    mcaceresv@albru.pe / password" -ForegroundColor White
Write-Host "  • Asesor: jvenancioo@albru.pe / password" -ForegroundColor White
Write-Host ""

Write-Host "📱 COMANDOS ÚTILES:" -ForegroundColor Cyan
Write-Host "  • Ver logs:          docker compose logs -f" -ForegroundColor Gray
Write-Host "  • Ver logs backend:  docker compose logs backend -f" -ForegroundColor Gray
Write-Host "  • Ver logs frontend: docker compose logs frontend -f" -ForegroundColor Gray
Write-Host "  • Reiniciar todo:    docker compose restart" -ForegroundColor Gray
Write-Host "  • Detener todo:      docker compose down" -ForegroundColor Gray
Write-Host "  • Estado:            docker ps" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "  1. Abre un navegador en cualquier PC de la red" -ForegroundColor White
Write-Host "  2. Navega a: http://$ServerIP" -ForegroundColor White
Write-Host "  3. Inicia sesión con las credenciales admin" -ForegroundColor White
Write-Host "  4. ¡El sistema está listo para usar!" -ForegroundColor White
Write-Host ""

Write-Host "🎉 ¡DESPLIEGUE COMPLETADO!" -ForegroundColor Green
Write-Host ""
```

---

## 🐛 TROUBLESHOOTING (Si algo falla)

### Ver logs de todos los servicios
```powershell
docker compose logs
```

### Ver logs de un servicio específico
```powershell
docker compose logs backend
docker compose logs frontend
docker compose logs albru-base
```

### Reiniciar un servicio específico
```powershell
docker compose restart backend
docker compose restart frontend
```

### Reconstruir todo desde cero
```powershell
docker compose down -v
docker compose up -d --build
```

### Verificar conectividad de red
```powershell
# Ping al backend desde el host
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get

# Ver puertos en uso
netstat -ano | findstr "80 3001 3306"
```

### Ver uso de recursos
```powershell
docker stats
```

---

## 📋 CHECKLIST FINAL

Antes de reportar éxito, verificar:

- [ ] `docker ps` muestra 3 contenedores corriendo (frontend, backend, mysql)
- [ ] Base de datos importada correctamente (23 usuarios aprox.)
- [ ] Backend responde en `http://localhost:3001/health`
- [ ] Frontend accesible en `http://localhost`
- [ ] Firewall configurado (puertos 80 y 3001 abiertos)
- [ ] Puedo hacer login con admin@albru.com / admin123
- [ ] La IP del servidor está correctamente configurada en .env

---

## 🎯 COMANDO ÚNICO PARA EJECUTAR TODO

Si quiero ejecutar todo de una vez, puedo usar este script PowerShell:

```powershell
# Guardar este contenido en: ejecutar-despliegue-completo.ps1

Write-Host "🚀 INICIANDO DESPLIEGUE AUTOMÁTICO DE ALBRU CRM" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Pull desde Git
Write-Host "📥 Actualizando código desde Git..." -ForegroundColor Yellow
git pull origin main

# 2. Obtener IP
$ServerIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.IPAddress -ne "127.0.0.1"
} | Select-Object -First 1).IPAddress
Write-Host "✅ IP detectada: $ServerIP" -ForegroundColor Green

# 3. Crear .env
Write-Host "⚙️ Creando archivo .env..." -ForegroundColor Yellow
$envContent = @"
NODE_ENV=production
DB_HOST=albru-base
DB_USER=albru
DB_PASSWORD=albru12345
DB_NAME=albru
DB_ROOT_PASSWORD=root_password_here
JWT_SECRET=albru_jwt_secret_key_2025_secure_production
BACKEND_PORT=3001
FRONTEND_PORT=80
VITE_API_URL=http://${ServerIP}:3001
VITE_BACKEND_URL=http://${ServerIP}:3001
VITE_WS_URL=http://${ServerIP}:3001
CORS_ORIGINS=http://${ServerIP}:5173,http://${ServerIP},http://localhost:5173,http://localhost:3001,http://localhost
"@
$envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline
Write-Host "✅ .env creado" -ForegroundColor Green

# 4. Limpiar contenedores anteriores
Write-Host "🧹 Limpiando contenedores anteriores..." -ForegroundColor Yellow
docker compose down -v 2>$null
Write-Host "✅ Limpieza completada" -ForegroundColor Green

# 5. Construir y levantar
Write-Host "🏗️ Construyendo y levantando contenedores..." -ForegroundColor Yellow
docker compose up -d --build
Write-Host "✅ Contenedores levantados" -ForegroundColor Green

# 6. Esperar MySQL
Write-Host "⏳ Esperando MySQL..." -ForegroundColor Yellow
Start-Sleep -Seconds 20
Write-Host "✅ MySQL listo" -ForegroundColor Green

# 7. Importar BD
Write-Host "📥 Importando base de datos..." -ForegroundColor Yellow
Get-Content "database\init.sql" | docker exec -i albru-base mysql -u albru -palbru12345 albru 2>$null
Write-Host "✅ Base de datos importada" -ForegroundColor Green

# 8. Configurar Firewall
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($isAdmin) {
    Write-Host "🔥 Configurando firewall..." -ForegroundColor Yellow
    New-NetFirewallRule -DisplayName "Albru Frontend" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue | Out-Null
    New-NetFirewallRule -DisplayName "Albru Backend API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -ErrorAction SilentlyContinue | Out-Null
    Write-Host "✅ Firewall configurado" -ForegroundColor Green
}

# 9. Resumen final
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ DESPLIEGUE COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Accede a: http://$ServerIP" -ForegroundColor White
Write-Host "🔑 Admin: admin@albru.com / admin123" -ForegroundColor White
Write-Host ""
docker ps --format "table {{.Names}}\t{{.Status}}"
Write-Host ""
Write-Host "🎉 ¡Sistema listo!" -ForegroundColor Green
```

---

## 📞 NOTAS IMPORTANTES PARA CLAUDE

**Debo ejecutar cada paso en orden y verificar que no haya errores antes de continuar al siguiente.**

**Si encuentro algún error:**
1. Leer el mensaje de error completo
2. Verificar los logs con `docker compose logs`
3. Intentar solucionarlo según la sección de Troubleshooting
4. Si no puedo solucionarlo, reportar el error específico

**Después de completar todos los pasos:**
1. Verificar que los 3 contenedores estén corriendo
2. Probar el acceso al frontend en la IP del servidor
3. Verificar que puedo hacer login
4. Reportar éxito con la IP y credenciales

**¡Listos para el despliegue! 🚀**
