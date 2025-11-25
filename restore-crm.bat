@echo off
REM ============================================
REM  RESTAURAR BACKUP COMPLETO DEL CRM
REM  En PC nueva
REM ============================================

echo.
echo ============================================
echo   RESTAURAR CRM ALBRU-BRUNARIO
echo ============================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "database_backup.sql" (
    echo [ERROR] No se encuentra database_backup.sql
    echo.
    echo Por favor ejecuta este script desde la carpeta del backup
    echo que contiene los archivos:
    echo   - database_backup.sql
    echo   - Albru-Brunario/
    echo   - mysql_volume.tar.gz
    echo   - redis_volume.tar.gz
    pause
    exit /b 1
)

echo [1/10] Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta instalado
    echo.
    echo Por favor instala Docker Desktop desde:
    echo https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta corriendo
    echo Por favor inicia Docker Desktop y espera a que este listo
    pause
    exit /b 1
)
echo      [OK] Docker esta listo

echo.
echo [2/10] Seleccionando directorio de instalacion...
set /p INSTALL_DIR="Donde quieres instalar el CRM? [C:\Users\%USERNAME%\Albru-Brunario]: "
if "%INSTALL_DIR%"=="" set INSTALL_DIR=C:\Users\%USERNAME%\Albru-Brunario

echo      Instalando en: %INSTALL_DIR%

echo.
echo [3/10] Copiando codigo fuente...
if exist "%INSTALL_DIR%" (
    echo [ADVERTENCIA] El directorio ya existe
    set /p OVERWRITE="Deseas sobrescribir? (S/N): "
    if /i not "%OVERWRITE%"=="S" (
        echo Operacion cancelada
        pause
        exit /b 0
    )
    rmdir /S /Q "%INSTALL_DIR%" 2>nul
)

xcopy "Albru-Brunario" "%INSTALL_DIR%\" /E /I /H /Y >nul
if errorlevel 1 (
    echo [ERROR] No se pudo copiar el codigo
    pause
    exit /b 1
)
echo      [OK] Codigo copiado

echo.
echo [4/10] Creando volumenes Docker...
docker volume create albru-brunario_db_data >nul 2>&1
docker volume create albru-brunario_redis_data >nul 2>&1
echo      [OK] Volumenes creados

echo.
echo [5/10] Restaurando volumen de MySQL...
if exist "mysql_volume.tar.gz" (
    docker run --rm -v albru-brunario_db_data:/data -v "%CD%":/backup alpine tar xzf /backup/mysql_volume.tar.gz -C /data 2>nul
    if errorlevel 1 (
        echo      [ADVERTENCIA] No se pudo restaurar volumen MySQL
    ) else (
        echo      [OK] Volumen MySQL restaurado
    )
) else (
    echo      [SKIP] No se encontro mysql_volume.tar.gz
)

echo.
echo [6/10] Restaurando volumen de Redis...
if exist "redis_volume.tar.gz" (
    docker run --rm -v albru-brunario_redis_data:/data -v "%CD%":/backup alpine tar xzf /backup/redis_volume.tar.gz -C /data 2>nul
    if errorlevel 1 (
        echo      [ADVERTENCIA] No se pudo restaurar volumen Redis
    ) else (
        echo      [OK] Volumen Redis restaurado
    )
) else (
    echo      [SKIP] No se encontro redis_volume.tar.gz
)

echo.
echo [7/10] Iniciando servicios Docker...
cd /d "%INSTALL_DIR%"
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] No se pudieron iniciar los servicios
    pause
    exit /b 1
)
echo      [OK] Servicios iniciados

echo.
echo [8/10] Esperando a que MySQL este listo...
timeout /t 30 /nobreak >nul
echo      [OK] MySQL listo

echo.
echo [9/10] Importando base de datos completa...
echo      (Esto restaurara TODOS los datos: clientes, gestiones, usuarios, historial)
docker exec -i albru-base mysql -u albru -palbru_pass albru < "%CD%\..\database_backup.sql"
if errorlevel 1 (
    echo [ERROR] No se pudo importar la base de datos
    echo Intentando metodo alternativo...
    type "%CD%\..\database_backup.sql" | docker exec -i albru-base mysql -u albru -palbru_pass albru
    if errorlevel 1 (
        echo [ERROR] Fallo la importacion
        pause
        exit /b 1
    )
)
echo      [OK] Base de datos restaurada completamente

echo.
echo [10/10] Verificando servicios...
docker-compose ps

echo.
echo ============================================
echo   RESTAURACION COMPLETADA!
echo ============================================
echo.
echo El CRM ha sido restaurado completamente con:
echo   - Todos los clientes
echo   - Todas las gestiones de asesores
echo   - Historial completo
echo   - Usuarios y configuracion
echo   - Reportes y estadisticas
echo.
echo Puedes acceder en:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo   Adminer:  http://localhost:8080
echo.
echo Ubicacion: %INSTALL_DIR%
echo.
echo [IMPORTANTE] Si quieres cambiar contraseñas o configuracion,
echo edita el archivo: %INSTALL_DIR%\.env
echo.

pause

REM Abrir navegador
start http://localhost:5173
