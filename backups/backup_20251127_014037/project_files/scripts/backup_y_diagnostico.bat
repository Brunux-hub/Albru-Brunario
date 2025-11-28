@echo off
REM Script para ejecutar el sistema de backup y diagnóstico
REM Requiere: Python 3.x, pandas, mysql-connector-python, gradio, rich

echo ========================================
echo  BACKUP Y DIAGNÓSTICO - ALBRU
echo ========================================
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no esta instalado
    pause
    exit /b 1
)

echo [OK] Python instalado
echo.

REM Verificar dependencias
python -c "import pandas" >nul 2>&1
if errorlevel 1 (
    echo Instalando pandas...
    pip install pandas
)

python -c "import mysql.connector" >nul 2>&1
if errorlevel 1 (
    echo Instalando mysql-connector-python...
    pip install mysql-connector-python
)

python -c "import gradio" >nul 2>&1
if errorlevel 1 (
    echo Instalando gradio...
    pip install gradio
)

python -c "import rich" >nul 2>&1
if errorlevel 1 (
    echo Instalando rich...
    pip install rich
)

echo [OK] Dependencias verificadas
echo.
echo Iniciando sistema de backup y diagnóstico...
echo.

REM Ejecutar
python "%~dp0backup_y_diagnostico.py"

echo.
pause