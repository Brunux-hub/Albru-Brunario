@echo off
REM Script para ejecutar el importador de historial de gestiones CSV
REM Requiere: Python 3.x, pandas, mysql-connector-python

echo ========================================
echo  Importador de Historial CSV a MySQL
echo ========================================
echo.

REM Verificar que Python este instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no esta instalado o no esta en el PATH
    echo Por favor instala Python 3.x desde https://www.python.org/
    pause
    exit /b 1
)

echo [OK] Python instalado
echo.

REM Verificar que pandas este instalado
python -c "import pandas" >nul 2>&1
if errorlevel 1 (
    echo ADVERTENCIA: pandas no esta instalado
    echo Instalando pandas...
    pip install pandas
    echo.
)

REM Verificar que mysql-connector-python este instalado
python -c "import mysql.connector" >nul 2>&1
if errorlevel 1 (
    echo ADVERTENCIA: mysql-connector-python no esta instalado
    echo Instalando mysql-connector-python...
    pip install mysql-connector-python
    echo.
)

REM Verificar que openpyxl este instalado (para leer Excel)
python -c "import openpyxl" >nul 2>&1
if errorlevel 1 (
    echo ADVERTENCIA: openpyxl no esta instalado
    echo Instalando openpyxl...
    pip install openpyxl
    echo.
)

echo [OK] Dependencias verificadas
echo.
echo Iniciando interfaz grafica...
echo.

REM Ejecutar el script
python "%~dp0importar_csv_historial.py"

echo.
echo Importacion finalizada.
pause
