@echo off
REM Script de instalación rápida del Asistente IA

echo.
echo ============================================
echo   Instalador del Asistente de Codigo IA
echo   CRM Albru-Brunario
echo ============================================
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no esta instalado
    echo Por favor instala Python 3.9 o superior desde python.org
    pause
    exit /b 1
)

echo [OK] Python instalado

REM Verificar Ollama
ollama --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ADVERTENCIA] Ollama no esta instalado
    echo.
    echo Descarga e instala Ollama desde: https://ollama.ai
    echo.
    echo Despues de instalar Ollama, ejecuta este script nuevamente
    pause
    exit /b 1
)

echo [OK] Ollama instalado

REM Crear directorio si no existe
if not exist "ai-assistant" mkdir ai-assistant
cd ai-assistant

REM Instalar dependencias Python
echo.
echo Instalando dependencias Python...
python -m pip install --upgrade pip
pip install -r requirements.txt

if errorlevel 1 (
    echo [ERROR] Error instalando dependencias
    pause
    exit /b 1
)

echo [OK] Dependencias instaladas

REM Copiar archivo .env
if not exist ".env" (
    copy .env.example .env
    echo [OK] Archivo .env creado
)

REM Preguntar si descargar modelo
echo.
echo ============================================
echo   Descarga del Modelo de IA
echo ============================================
echo.
echo Elige el modelo segun tu RAM disponible:
echo.
echo 1) qwen2.5-coder:32b  [MEJOR CALIDAD]  (32GB RAM)
echo 2) qwen2.5-coder:14b  [BALANCE]        (16GB RAM)
echo 3) qwen2.5-coder:7b   [RAPIDO]         (8GB RAM)
echo 4) Saltar descarga (ya tengo un modelo)
echo.

set /p choice="Selecciona una opcion (1-4): "

if "%choice%"=="1" (
    echo.
    echo Descargando qwen2.5-coder:32b (~20GB)...
    echo Esto puede tomar 10-30 minutos...
    ollama pull qwen2.5-coder:32b
) else if "%choice%"=="2" (
    echo.
    echo Descargando qwen2.5-coder:14b (~9GB)...
    ollama pull qwen2.5-coder:14b
) else if "%choice%"=="3" (
    echo.
    echo Descargando qwen2.5-coder:7b (~4GB)...
    ollama pull qwen2.5-coder:7b
) else (
    echo Saltando descarga del modelo
)

echo.
echo ============================================
echo   Instalacion Completada!
echo ============================================
echo.
echo Para iniciar el asistente, ejecuta:
echo   cd ai-assistant
echo   python assistant.py chat
echo.
echo Comandos utiles:
echo   /read archivo.js     - Leer archivo
echo   /search texto        - Buscar en codigo
echo   /exec comando        - Ejecutar comando
echo   /exit                - Salir
echo.
pause
