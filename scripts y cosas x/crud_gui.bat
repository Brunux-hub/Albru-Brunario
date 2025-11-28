@echo off
REM Script para ejecutar la interfaz gráfica del CRUD de clientes
REM Requiere: Python 3.x, pandas, mysql-connector-python, PySimpleGUI

echo ========================================
echo   INTERFAZ DESKTOP - GESTOR CLIENTES - ALBRU
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
python -c "import PySimpleGUI" >nul 2>&1
if errorlevel 1 (
    echo Instalando PySimpleGUI...
    pip install PySimpleGUI
)

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

echo [OK] Dependencias verificadas
echo.
echo Iniciando interfaz gráfica...
echo.

REM Ejecutar
python "%~dp0crud_gui.py"

echo.
pause