@echo off
REM ============================================
REM  BACKUP COMPLETO DEL CRM ALBRU-BRUNARIO
REM  Incluye: Codigo + Base de Datos + Configuracion
REM ============================================

echo.
echo ============================================
echo   BACKUP COMPLETO - CRM ALBRU-BRUNARIO
echo ============================================
echo.

REM Obtener fecha y hora para el nombre del backup
for /f "tokens=2-4 delims=/ " %%a in ('date /t') eq (set FECHA=%%c%%a%%b)
for /f "tokens=1-2 delims=: " %%a in ('time /t') eq (set HORA=%%a%%b)
set TIMESTAMP=%FECHA%_%HORA%
set BACKUP_DIR=C:\Backup-CRM-%TIMESTAMP%

echo [1/8] Creando directorio de backup: %BACKUP_DIR%
mkdir "%BACKUP_DIR%" 2>nul
if errorlevel 1 (
    echo [ERROR] No se pudo crear directorio de backup
    pause
    exit /b 1
)

echo.
echo [2/8] Verificando que Docker este corriendo...
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta corriendo. Por favor inicia Docker Desktop.
    pause
    exit /b 1
)

echo.
echo [3/8] Exportando base de datos completa...
echo      (Esto incluye todos los datos: clientes, gestiones, usuarios, historial)
docker exec albru-base mysqldump -u albru -palbru_pass albru > "%BACKUP_DIR%\database_backup.sql"
if errorlevel 1 (
    echo [ERROR] No se pudo exportar la base de datos
    pause
    exit /b 1
)
echo      [OK] Base de datos exportada: database_backup.sql

echo.
echo [4/8] Exportando volumen de datos de MySQL...
docker run --rm -v albru-brunario_db_data:/data -v "%BACKUP_DIR%":/backup alpine tar czf /backup/mysql_volume.tar.gz -C /data . 2>nul
if errorlevel 1 (
    echo      [ADVERTENCIA] No se pudo exportar volumen MySQL (opcional)
) else (
    echo      [OK] Volumen MySQL exportado: mysql_volume.tar.gz
)

echo.
echo [5/8] Exportando volumen de Redis (sesiones)...
docker run --rm -v albru-brunario_redis_data:/data -v "%BACKUP_DIR%":/backup alpine tar czf /backup/redis_volume.tar.gz -C /data . 2>nul
if errorlevel 1 (
    echo      [ADVERTENCIA] No se pudo exportar volumen Redis (opcional)
) else (
    echo      [OK] Volumen Redis exportado: redis_volume.tar.gz
)

echo.
echo [6/8] Copiando codigo fuente completo...
xcopy "%~dp0*" "%BACKUP_DIR%\Albru-Brunario\" /E /I /H /Y /EXCLUDE:%~dp0.gitignore >nul 2>&1
if errorlevel 1 (
    REM Intentar sin gitignore
    xcopy "%~dp0*" "%BACKUP_DIR%\Albru-Brunario\" /E /I /H /Y >nul
)
echo      [OK] Codigo fuente copiado

echo.
echo [7/8] Copiando archivo de configuracion (.env)...
if exist "%~dp0.env" (
    copy "%~dp0.env" "%BACKUP_DIR%\Albru-Brunario\.env" >nul
    echo      [OK] Archivo .env copiado
) else (
    echo      [ADVERTENCIA] No se encontro archivo .env
)

echo.
echo [8/8] Generando archivo de informacion del backup...
(
echo ============================================
echo   BACKUP CRM ALBRU-BRUNARIO
echo ============================================
echo.
echo Fecha de backup: %DATE% %TIME%
echo Usuario: %USERNAME%
echo Computadora: %COMPUTERNAME%
echo.
echo CONTENIDO DEL BACKUP:
echo - database_backup.sql     : Base de datos completa ^(SQL dump^)
echo - mysql_volume.tar.gz     : Volumen Docker de MySQL
echo - redis_volume.tar.gz     : Volumen Docker de Redis
echo - Albru-Brunario/         : Codigo fuente completo
echo - Albru-Brunario/.env     : Configuracion y passwords
echo.
echo PARA RESTAURAR EN OTRA PC:
echo 1. Copiar esta carpeta a la nueva PC
echo 2. Instalar Docker Desktop
echo 3. Ejecutar: restore-crm.bat
echo.
echo ============================================
) > "%BACKUP_DIR%\LEEME.txt"

echo.
echo ============================================
echo   BACKUP COMPLETADO EXITOSAMENTE
echo ============================================
echo.
echo Ubicacion: %BACKUP_DIR%
echo.
dir "%BACKUP_DIR%" | find "bytes"
echo.
echo IMPORTANTE:
echo 1. Copia esta carpeta a un USB o nube
echo 2. Para restaurar, usa el archivo restore-crm.bat
echo.
echo Archivos incluidos:
echo   - Base de datos completa ^(todos los datos^)
echo   - Codigo fuente
echo   - Configuracion ^(.env^)
echo   - Volumenes Docker
echo.

REM Abrir carpeta de backup
explorer "%BACKUP_DIR%"

pause
