@echo off
echo.
echo ============================================================
echo INSTALACION SISTEMA ALBRU - WINDOWS
echo Reasignacion GTR - Asesor con Backend y Base de Datos
echo ============================================================
echo.

echo 📦 Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado. Descárgalo desde https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js encontrado

echo.
echo 🐘 Verificando PostgreSQL...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL no está instalado. Descárgalo desde https://postgresql.org/
    pause
    exit /b 1
)
echo ✅ PostgreSQL encontrado

echo.
echo 🗄️ Configurando base de datos...
createdb albru 2>nul
echo 📊 Ejecutando script de base de datos...
psql -d albru -f "src/database/albru_completo.sql"

echo.
echo ⚙️ Instalando dependencias del backend...
cd backend
call npm install

echo.
echo 🔧 Configurando variables de entorno...
(
echo NODE_ENV=production
echo PORT=3001
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=albru
echo DB_USER=albru_user
echo DB_PASSWORD=password
) > .env

cd ..
echo.
echo 🎨 Instalando dependencias del frontend...
call npm install

echo.
echo 🎉 ¡Instalación completada!
echo.
echo 📋 PASOS PARA EJECUTAR EN PRODUCCION:
echo ==================================
echo.
echo 1️⃣ Abrir terminal y ejecutar backend:
echo    cd backend
echo    npm start
echo.
echo 2️⃣ Abrir otra terminal y ejecutar frontend:
echo    npm start
echo.
echo 3️⃣ Acceder a:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:3001
echo.
echo 🔗 API Endpoints disponibles:
echo    - POST /api/clientes/reasignar
echo    - GET /api/clientes/asesor/:id
echo    - GET /api/asesores
echo    - GET /api/asesores/buscar/:nombre
echo.
echo ✅ El sistema está listo para produccion!
echo.
pause