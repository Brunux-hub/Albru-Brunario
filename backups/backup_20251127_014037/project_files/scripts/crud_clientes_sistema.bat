@echo off
REM Script para ejecutar el sistema CRUD de clientes
REM Requiere: Python 3.x, pandas, mysql-connector-python, bcrypt, rich

echo ========================================
echo   SISTEMA CRUD CLIENTES - ALBRU
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

python -c "import bcrypt" >nul 2>&1
if errorlevel 1 (
    echo Instalando bcrypt...
    pip install bcrypt
)

python -c "import rich" >nul 2>&1
if errorlevel 1 (
    echo Instalando rich...
    pip install rich
)

echo [OK] Dependencias verificadas
echo.
echo Iniciando sistema CRUD de clientes...
echo.

REM Ejecutar
python "%~dp0crud_clientes_sistema.py"

echo.
pause