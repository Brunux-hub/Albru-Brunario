#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema de Backup y Diagnóstico Inteligente - Albru Brunario CRM
=================================================================
Script completo que:
1. Crea backup empaquetado de toda la BD, historial, JSON y archivos esenciales
2. Genera dump SQL compatible con el formato de producción
3. Verifica integridad de todos los archivos y estructura
4. Muestra diagnóstico inteligente estilo IA evaluadora
5. Confirma si el backup está listo para migración a otra PC
"""

import os
import sys
import json
import shutil
import subprocess
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple, Optional
import mysql.connector
from mysql.connector import Error
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich import box
from rich.tree import Tree
import tarfile
import zipfile

console = Console()

# ==================== CONFIGURACIÓN ====================
BASE_DIR = Path(__file__).resolve().parent.parent
BACKUP_BASE_DIR = BASE_DIR / "backups"
EXPORTS_DIR = BASE_DIR / "exports"

# Configuración de BD desde .env o valores por defecto
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3308)),
    'user': os.getenv('DB_USER', 'albru'),
    'password': os.getenv('DB_PASSWORD', 'albru12345'),
    'database': os.getenv('DB_NAME', 'albru'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

# ==================== CLASE PRINCIPAL ====================
class SistemaBackupDiagnostico:
    """Sistema completo de backup y diagnóstico inteligente"""
    
    def __init__(self):
        self.console = console
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.backup_dir = BACKUP_BASE_DIR / f"backup_{self.timestamp}"
        self.diagnostico = {
            'errores': [],
            'advertencias': [],
            'exitos': [],
            'verificaciones': {}
        }
        self.conn = None
    
    def ejecutar_backup_completo(self) -> bool:
        """Ejecutar proceso completo de backup y diagnóstico"""
        self.mostrar_banner()
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            console=self.console
        ) as progress:
            
            # Fase 1: Preparación
            task1 = progress.add_task("[cyan]Preparando entorno...", total=100)
            if not self.preparar_entorno():
                return False
            progress.update(task1, advance=100)
            
            # Fase 2: Conexión BD
            task2 = progress.add_task("[cyan]Conectando a base de datos...", total=100)
            if not self.conectar_bd():
                progress.update(task2, advance=100)
                self.console.print("[red]✗ No se pudo conectar a la BD[/red]")
                return False
            progress.update(task2, advance=100)
            
            # Fase 3: Dump SQL
            task3 = progress.add_task("[cyan]Generando dump SQL completo...", total=100)
            if not self.generar_dump_sql():
                self.diagnostico['errores'].append("Error al generar dump SQL")
            else:
                self.diagnostico['exitos'].append("Dump SQL generado correctamente")
            progress.update(task3, advance=100)
            
            # Fase 4: Backup tablas JSON
            task4 = progress.add_task("[cyan]Exportando datos a JSON...", total=100)
            self.exportar_datos_json()
            progress.update(task4, advance=100)
            
            # Fase 5: Copiar archivos esenciales
            task5 = progress.add_task("[cyan]Copiando archivos del proyecto...", total=100)
            self.copiar_archivos_proyecto()
            progress.update(task5, advance=100)
            
            # Fase 6: Empaquetar backup
            task6 = progress.add_task("[cyan]Empaquetando backup...", total=100)
            self.empaquetar_backup()
            progress.update(task6, advance=100)
        
        # Fase 7: Diagnóstico inteligente
        self.console.print("\n")
        self.ejecutar_diagnostico_inteligente()
        
        # Fase 8: Reporte final
        self.generar_reporte_final()
        
        # Cerrar conexión
        if self.conn:
            self.conn.close()
        
        return len(self.diagnostico['errores']) == 0
    
    def mostrar_banner(self):
        """Mostrar banner del sistema"""
        banner = """
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║        SISTEMA DE BACKUP Y DIAGNÓSTICO INTELIGENTE                    ║
║        ALBRU BRUNARIO CRM - Versión 1.0                               ║
║                                                                       ║
║        Backup completo + Verificación de integridad                   ║
║        Preparado para migración a otra PC                             ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
        """
        self.console.print(Panel(banner, style="bold blue"))
        self.console.print(f"\n[dim]Timestamp: {self.timestamp}[/dim]")
        self.console.print(f"[dim]Directorio de backup: {self.backup_dir}[/dim]\n")
    
    def preparar_entorno(self) -> bool:
        """Preparar directorios y entorno"""
        try:
            self.backup_dir.mkdir(parents=True, exist_ok=True)
            (self.backup_dir / "database").mkdir(exist_ok=True)
            (self.backup_dir / "json_data").mkdir(exist_ok=True)
            (self.backup_dir / "project_files").mkdir(exist_ok=True)
            (self.backup_dir / "logs").mkdir(exist_ok=True)
            
            self.diagnostico['exitos'].append("Estructura de directorios creada")
            return True
        except Exception as e:
            self.diagnostico['errores'].append(f"Error al crear directorios: {str(e)}")
            return False
    
    def conectar_bd(self) -> bool:
        """Conectar a la base de datos"""
        try:
            self.conn = mysql.connector.connect(**DB_CONFIG)
            if self.conn.is_connected():
                self.diagnostico['exitos'].append(f"Conectado a MySQL Server")
                return True
        except Error as e:
            self.diagnostico['errores'].append(f"Error de conexión BD: {str(e)}")
            return False
    
    def generar_dump_sql(self) -> bool:
        """Generar dump SQL completo compatible con el formato de producción"""
        try:
            sql_file = self.backup_dir / "database" / "albru_backup.sql"
            
            self.console.print("[cyan]📦 Generando dump SQL completo de la base de datos...[/cyan]")
            
            # Intentar usar mysqldump si está disponible
            mysqldump_cmd = [
                'mysqldump',
                f'--host={DB_CONFIG["host"]}',
                f'--port={DB_CONFIG["port"]}',
                f'--user={DB_CONFIG["user"]}',
                f'--password={DB_CONFIG["password"]}',
                '--single-transaction',
                '--routines',
                '--triggers',
                '--events',
                '--add-drop-table',
                '--complete-insert',
                '--extended-insert',
                '--default-character-set=utf8mb4',
                '--set-charset',
                '--result-file=' + str(sql_file),
                DB_CONFIG['database']
            ]
            
            try:
                subprocess.run(mysqldump_cmd, check=True, capture_output=True, text=True)
                self.console.print(f"[green]✓ Dump SQL generado con mysqldump: {sql_file.name}[/green]")
                
                # Verificar tamaño
                size_mb = sql_file.stat().st_size / (1024 * 1024)
                self.console.print(f"[dim]  Tamaño: {size_mb:.2f} MB[/dim]")
                
                self.diagnostico['verificaciones']['dump_sql'] = {
                    'existe': True,
                    'tamaño_mb': round(size_mb, 2),
                    'metodo': 'mysqldump'
                }
                
                return True
                
            except (subprocess.CalledProcessError, FileNotFoundError):
                self.console.print("[yellow]⚠ mysqldump no disponible, usando exportación Python...[/yellow]")
                return self._generar_dump_python(sql_file)
            
        except Exception as e:
            self.diagnostico['errores'].append(f"Error al generar dump SQL: {str(e)}")
            return False
    
    def _generar_dump_python(self, sql_file: Path) -> bool:
        """Generar dump SQL usando Python (fallback)"""
        try:
            cursor = self.conn.cursor()
            
            with open(sql_file, 'w', encoding='utf-8') as f:
                # Header SQL
                f.write(f"""-- MySQL dump generado con Python
-- Host: {DB_CONFIG['host']}    Database: {DB_CONFIG['database']}
-- ------------------------------------------------------
-- Server version\t{self.conn.get_server_info()}

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

""")
                
                # Obtener todas las tablas
                cursor.execute("SHOW TABLES")
                tablas = [tabla[0] for tabla in cursor.fetchall()]
                
                for tabla in tablas:
                    self.console.print(f"[dim]  Exportando tabla: {tabla}[/dim]")
                    
                    # DROP TABLE
                    f.write(f"\n--\n-- Table structure for table `{tabla}`\n--\n\n")
                    f.write(f"DROP TABLE IF EXISTS `{tabla}`;\n")
                    
                    # CREATE TABLE
                    cursor.execute(f"SHOW CREATE TABLE `{tabla}`")
                    create_table = cursor.fetchone()[1]
                    f.write(f"/*!40101 SET @saved_cs_client     = @@character_set_client */;\n")
                    f.write(f"/*!50503 SET character_set_client = utf8mb4 */;\n")
                    f.write(create_table + ";\n")
                    f.write(f"/*!40101 SET character_set_client = @saved_cs_client */;\n\n")
                    
                    # INSERT DATA
                    f.write(f"--\n-- Dumping data for table `{tabla}`\n--\n\n")
                    f.write(f"LOCK TABLES `{tabla}` WRITE;\n")
                    f.write(f"/*!40000 ALTER TABLE `{tabla}` DISABLE KEYS */;\n")
                    
                    cursor.execute(f"SELECT * FROM `{tabla}`")
                    rows = cursor.fetchall()
                    
                    if rows:
                        # Obtener nombres de columnas
                        cursor.execute(f"SHOW COLUMNS FROM `{tabla}`")
                        columnas = [col[0] for col in cursor.fetchall()]
                        
                        # Generar INSERTs en lotes
                        batch_size = 100
                        for i in range(0, len(rows), batch_size):
                            batch = rows[i:i+batch_size]
                            valores = []
                            for row in batch:
                                row_valores = []
                                for val in row:
                                    if val is None:
                                        row_valores.append('NULL')
                                    elif isinstance(val, str):
                                        val_escaped = val.replace('\\', '\\\\').replace("'", "\\'")
                                        row_valores.append(f"'{val_escaped}'")
                                    elif isinstance(val, (datetime, )):
                                        row_valores.append(f"'{val}'")
                                    else:
                                        row_valores.append(str(val))
                                valores.append(f"({','.join(row_valores)})")
                            
                            insert_stmt = f"INSERT INTO `{tabla}` VALUES {','.join(valores)};\n"
                            f.write(insert_stmt)
                    
                    f.write(f"/*!40000 ALTER TABLE `{tabla}` ENABLE KEYS */;\n")
                    f.write(f"UNLOCK TABLES;\n\n")
                
                # Footer
                f.write("""
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "\n")
            
            cursor.close()
            
            size_mb = sql_file.stat().st_size / (1024 * 1024)
            self.console.print(f"[green]✓ Dump SQL generado: {sql_file.name} ({size_mb:.2f} MB)[/green]")
            
            self.diagnostico['verificaciones']['dump_sql'] = {
                'existe': True,
                'tamaño_mb': round(size_mb, 2),
                'metodo': 'python'
            }
            
            return True
            
        except Exception as e:
            self.diagnostico['errores'].append(f"Error en dump Python: {str(e)}")
            return False
    
    def exportar_datos_json(self):
        """Exportar todas las tablas importantes a JSON"""
        try:
            self.console.print("[cyan]📋 Exportando datos a JSON...[/cyan]")
            
            tablas_importantes = [
                'clientes',
                'usuarios',
                'asesores',
                'gtr',
                'historial_estados',
                'historial_gestiones',
                'asesor_stats_daily',
                'cliente_locks'
            ]
            
            cursor = self.conn.cursor(dictionary=True)
            
            for tabla in tablas_importantes:
                try:
                    # Verificar si la tabla existe
                    cursor.execute(f"SHOW TABLES LIKE '{tabla}'")
                    if not cursor.fetchone():
                        self.diagnostico['advertencias'].append(f"Tabla '{tabla}' no existe")
                        continue
                    
                    # Exportar datos
                    cursor.execute(f"SELECT * FROM {tabla}")
                    datos = cursor.fetchall()
                    
                    # Convertir fechas a string
                    for row in datos:
                        for key, value in row.items():
                            if isinstance(value, datetime):
                                row[key] = value.isoformat()
                    
                    json_file = self.backup_dir / "json_data" / f"{tabla}.json"
                    with open(json_file, 'w', encoding='utf-8') as f:
                        json.dump(datos, f, ensure_ascii=False, indent=2, default=str)
                    
                    self.console.print(f"[green]  ✓ {tabla}.json ({len(datos)} registros)[/green]")
                    
                    self.diagnostico['verificaciones'][f'json_{tabla}'] = {
                        'existe': True,
                        'registros': len(datos)
                    }
                    
                except Exception as e:
                    self.diagnostico['advertencias'].append(f"No se pudo exportar {tabla}: {str(e)}")
            
            cursor.close()
            self.diagnostico['exitos'].append("Datos exportados a JSON")
            
        except Exception as e:
            self.diagnostico['errores'].append(f"Error al exportar JSON: {str(e)}")
    
    def copiar_archivos_proyecto(self):
        """Copiar archivos esenciales del proyecto"""
        try:
            self.console.print("[cyan]📁 Copiando archivos del proyecto...[/cyan]")
            
            archivos_esenciales = [
                '.env',
                'docker-compose.yml',
                'package.json',
                'README.md',
                'LEEME-PRIMERO.md',
                'AI_HANDOFF.md'
            ]
            
            directorios_importantes = [
                'backend/config',
                'backend/controllers',
                'backend/routes',
                'backend/middleware',
                'backend/migrations',
                'src',
                'public',
                'scripts'
            ]
            
            # Copiar archivos individuales
            for archivo in archivos_esenciales:
                src = BASE_DIR / archivo
                if src.exists():
                    dst = self.backup_dir / "project_files" / archivo
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src, dst)
                    self.console.print(f"[green]  ✓ {archivo}[/green]")
                else:
                    self.diagnostico['advertencias'].append(f"Archivo no encontrado: {archivo}")
            
            # Copiar directorios
            for directorio in directorios_importantes:
                src = BASE_DIR / directorio
                if src.exists():
                    dst = self.backup_dir / "project_files" / directorio
                    shutil.copytree(src, dst, dirs_exist_ok=True, ignore=shutil.ignore_patterns(
                        'node_modules', '__pycache__', '*.pyc', '.git', 'dist', 'build', '*.log'
                    ))
                    self.console.print(f"[green]  ✓ {directorio}/[/green]")
                else:
                    self.diagnostico['advertencias'].append(f"Directorio no encontrado: {directorio}")
            
            self.diagnostico['exitos'].append("Archivos del proyecto copiados")
            
        except Exception as e:
            self.diagnostico['errores'].append(f"Error al copiar archivos: {str(e)}")
    
    def empaquetar_backup(self):
        """Empaquetar todo el backup en un archivo comprimido"""
        try:
            self.console.print("[cyan]📦 Empaquetando backup completo...[/cyan]")
            
            zip_file = BACKUP_BASE_DIR / f"backup_completo_{self.timestamp}.zip"
            
            with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(self.backup_dir):
                    for file in files:
                        file_path = Path(root) / file
                        arcname = file_path.relative_to(self.backup_dir.parent)
                        zipf.write(file_path, arcname)
            
            size_mb = zip_file.stat().st_size / (1024 * 1024)
            self.console.print(f"[green]✓ Backup empaquetado: {zip_file.name} ({size_mb:.2f} MB)[/green]")
            
            self.diagnostico['verificaciones']['paquete_zip'] = {
                'existe': True,
                'tamaño_mb': round(size_mb, 2),
                'ruta': str(zip_file)
            }
            
            self.diagnostico['exitos'].append("Backup empaquetado correctamente")
            
        except Exception as e:
            self.diagnostico['advertencias'].append(f"No se pudo empaquetar: {str(e)}")
    
    def ejecutar_diagnostico_inteligente(self):
        """Ejecutar diagnóstico inteligente completo del sistema"""
        self.console.print("\n" + "="*80)
        self.console.print(Panel(
            "[bold cyan]🔍 DIAGNÓSTICO INTELIGENTE DEL SISTEMA[/bold cyan]",
            box=box.DOUBLE
        ))
        self.console.print("="*80 + "\n")
        
        # 1. Verificar estructura de BD
        self._verificar_estructura_bd()
        
        # 2. Verificar integridad de datos
        self._verificar_integridad_datos()
        
        # 3. Verificar archivos JSON
        self._verificar_json_frontend()
        
        # 4. Verificar estructura del proyecto
        self._verificar_estructura_proyecto()
        
        # 5. Verificar configuración
        self._verificar_configuracion()
    
    def _verificar_estructura_bd(self):
        """Verificar estructura de la base de datos"""
        self.console.print("[bold blue]📊 1. VERIFICACIÓN DE ESTRUCTURA DE BASE DE DATOS[/bold blue]\n")
        
        tablas_requeridas = [
            ('clientes', ['id', 'nombre', 'telefono', 'dni', 'asesor_asignado', 
                         'estatus_comercial_categoria', 'estatus_comercial_subcategoria',
                         'wizard_completado', 'created_at']),
            ('usuarios', ['id', 'nombre', 'email', 'password', 'tipo', 'estado']),
            ('asesores', ['id', 'usuario_id', 'gtr_asignado', 'clientes_asignados']),
            ('historial_estados', ['id', 'cliente_id', 'usuario_id', 'tipo', 'estado_anterior', 'estado_nuevo']),
            ('historial_gestiones', ['id', 'cliente_id', 'paso', 'asesor_id', 'categoria', 'subcategoria']),
            ('gtr', ['id', 'usuario_id']),
            ('asesor_stats_daily', ['id', 'asesor_id', 'fecha', 'clientes_atendidos'])
        ]
        
        cursor = self.conn.cursor()
        errores_estructura = []
        
        for tabla, columnas_requeridas in tablas_requeridas:
            # Verificar si existe la tabla
            cursor.execute(f"SHOW TABLES LIKE '{tabla}'")
            if not cursor.fetchone():
                errores_estructura.append(f"❌ Tabla '{tabla}' NO EXISTE")
                self.console.print(f"[red]  ❌ Tabla '{tabla}' NO EXISTE[/red]")
                continue
            
            # Verificar columnas
            cursor.execute(f"SHOW COLUMNS FROM {tabla}")
            columnas_existentes = {col[0] for col in cursor.fetchall()}
            
            columnas_faltantes = set(columnas_requeridas) - columnas_existentes
            
            if columnas_faltantes:
                error = f"Tabla '{tabla}' le faltan columnas: {', '.join(columnas_faltantes)}"
                errores_estructura.append(error)
                self.console.print(f"[yellow]  ⚠ {error}[/yellow]")
            else:
                self.console.print(f"[green]  ✓ Tabla '{tabla}' - Estructura completa[/green]")
        
        cursor.close()
        
        if not errores_estructura:
            self.console.print("\n[bold green]✅ Estructura de BD: PERFECTA[/bold green]\n")
            self.diagnostico['verificaciones']['estructura_bd'] = 'OK'
        else:
            self.console.print(f"\n[bold yellow]⚠ Estructura de BD: {len(errores_estructura)} problemas detectados[/bold yellow]\n")
            self.diagnostico['verificaciones']['estructura_bd'] = 'CON_ADVERTENCIAS'
    
    def _verificar_integridad_datos(self):
        """Verificar integridad de los datos"""
        self.console.print("[bold blue]🔍 2. VERIFICACIÓN DE INTEGRIDAD DE DATOS[/bold blue]\n")
        
        cursor = self.conn.cursor(dictionary=True)
        problemas = []
        
        # 1. Clientes sin nombre o teléfono
        cursor.execute("SELECT COUNT(*) as total FROM clientes WHERE nombre IS NULL OR nombre = '' OR telefono IS NULL OR telefono = ''")
        clientes_incompletos = cursor.fetchone()['total']
        if clientes_incompletos > 0:
            problemas.append(f"{clientes_incompletos} clientes sin nombre o teléfono")
            self.console.print(f"[yellow]  ⚠ {clientes_incompletos} clientes sin nombre o teléfono[/yellow]")
        else:
            self.console.print("[green]  ✓ Todos los clientes tienen nombre y teléfono[/green]")
        
        # 2. Clientes con asesor inexistente
        cursor.execute("""
            SELECT COUNT(*) as total FROM clientes c 
            LEFT JOIN asesores a ON c.asesor_asignado = a.id 
            WHERE c.asesor_asignado IS NOT NULL AND a.id IS NULL
        """)
        asesores_invalidos = cursor.fetchone()['total']
        if asesores_invalidos > 0:
            problemas.append(f"{asesores_invalidos} clientes con asesor inexistente")
            self.console.print(f"[yellow]  ⚠ {asesores_invalidos} clientes con asesor inexistente[/yellow]")
        else:
            self.console.print("[green]  ✓ Todos los asesores asignados son válidos[/green]")
        
        # 3. Usuarios sin tipo definido
        cursor.execute("SELECT COUNT(*) as total FROM usuarios WHERE tipo IS NULL OR tipo = ''")
        usuarios_sin_tipo = cursor.fetchone()['total']
        if usuarios_sin_tipo > 0:
            problemas.append(f"{usuarios_sin_tipo} usuarios sin tipo definido")
            self.console.print(f"[yellow]  ⚠ {usuarios_sin_tipo} usuarios sin tipo definido[/yellow]")
        else:
            self.console.print("[green]  ✓ Todos los usuarios tienen tipo definido[/green]")
        
        # 4. Historial huérfano
        cursor.execute("""
            SELECT COUNT(*) as total FROM historial_estados he 
            LEFT JOIN clientes c ON he.cliente_id = c.id 
            WHERE c.id IS NULL
        """)
        historial_huerfano = cursor.fetchone()['total']
        if historial_huerfano > 0:
            problemas.append(f"{historial_huerfano} registros de historial sin cliente")
            self.console.print(f"[yellow]  ⚠ {historial_huerfano} registros de historial sin cliente[/yellow]")
        else:
            self.console.print("[green]  ✓ Todo el historial tiene cliente válido[/green]")
        
        # 5. Duplicados de teléfono
        cursor.execute("""
            SELECT COUNT(*) as total FROM (
                SELECT telefono, COUNT(*) as cnt 
                FROM clientes 
                WHERE (es_duplicado = FALSE OR es_duplicado IS NULL)
                GROUP BY telefono 
                HAVING cnt > 1
            ) as dups
        """)
        telefonos_duplicados = cursor.fetchone()['total']
        if telefonos_duplicados > 0:
            problemas.append(f"{telefonos_duplicados} teléfonos duplicados")
            self.console.print(f"[yellow]  ⚠ {telefonos_duplicados} teléfonos duplicados[/yellow]")
        else:
            self.console.print("[green]  ✓ No hay teléfonos duplicados[/green]")
        
        cursor.close()
        
        if not problemas:
            self.console.print("\n[bold green]✅ Integridad de Datos: PERFECTA[/bold green]\n")
            self.diagnostico['verificaciones']['integridad_datos'] = 'OK'
        else:
            self.console.print(f"\n[bold yellow]⚠ Integridad de Datos: {len(problemas)} problemas menores detectados[/bold yellow]\n")
            self.diagnostico['verificaciones']['integridad_datos'] = 'CON_ADVERTENCIAS'
    
    def _verificar_json_frontend(self):
        """Verificar archivos JSON del frontend"""
        self.console.print("[bold blue]📄 3. VERIFICACIÓN DE ARCHIVOS JSON[/bold blue]\n")
        
        json_dir = self.backup_dir / "json_data"
        problemas_json = []
        
        if not json_dir.exists():
            self.console.print("[red]  ❌ Directorio JSON no existe[/red]")
            self.diagnostico['verificaciones']['json_frontend'] = 'ERROR'
            return
        
        archivos_json = list(json_dir.glob("*.json"))
        
        for archivo_json in archivos_json:
            try:
                with open(archivo_json, 'r', encoding='utf-8') as f:
                    datos = json.load(f)
                    
                    if not isinstance(datos, list):
                        problemas_json.append(f"{archivo_json.name} no es un array")
                        self.console.print(f"[yellow]  ⚠ {archivo_json.name} no es un array[/yellow]")
                    else:
                        self.console.print(f"[green]  ✓ {archivo_json.name} ({len(datos)} registros)[/green]")
                        
            except json.JSONDecodeError as e:
                problemas_json.append(f"{archivo_json.name} tiene errores de sintaxis")
                self.console.print(f"[red]  ❌ {archivo_json.name} tiene errores de sintaxis[/red]")
            except Exception as e:
                problemas_json.append(f"{archivo_json.name}: {str(e)}")
                self.console.print(f"[red]  ❌ {archivo_json.name}: Error al leer[/red]")
        
        if not problemas_json:
            self.console.print("\n[bold green]✅ Archivos JSON: CORRECTOS[/bold green]\n")
            self.diagnostico['verificaciones']['json_frontend'] = 'OK'
        else:
            self.console.print(f"\n[bold yellow]⚠ Archivos JSON: {len(problemas_json)} problemas[/bold yellow]\n")
            self.diagnostico['verificaciones']['json_frontend'] = 'CON_ADVERTENCIAS'
    
    def _verificar_estructura_proyecto(self):
        """Verificar estructura completa del proyecto"""
        self.console.print("[bold blue]📁 4. VERIFICACIÓN DE ESTRUCTURA DEL PROYECTO[/bold blue]\n")
        
        directorios_criticos = [
            'project_files/backend/controllers',
            'project_files/backend/routes',
            'project_files/backend/config',
            'project_files/src'
        ]
        
        archivos_criticos = [
            'project_files/.env',
            'project_files/docker-compose.yml',
            'project_files/package.json'
        ]
        
        problemas_proyecto = []
        
        # Verificar directorios
        for directorio in directorios_criticos:
            path = self.backup_dir / directorio
            if path.exists():
                archivos_count = len(list(path.rglob('*.*')))
                self.console.print(f"[green]  ✓ {directorio}/ ({archivos_count} archivos)[/green]")
            else:
                problemas_proyecto.append(f"Directorio faltante: {directorio}")
                self.console.print(f"[yellow]  ⚠ {directorio}/ NO EXISTE[/yellow]")
        
        # Verificar archivos
        for archivo in archivos_criticos:
            path = self.backup_dir / archivo
            if path.exists():
                size_kb = path.stat().st_size / 1024
                self.console.print(f"[green]  ✓ {archivo} ({size_kb:.1f} KB)[/green]")
            else:
                problemas_proyecto.append(f"Archivo faltante: {archivo}")
                self.console.print(f"[yellow]  ⚠ {archivo} NO EXISTE[/yellow]")
        
        if not problemas_proyecto:
            self.console.print("\n[bold green]✅ Estructura del Proyecto: COMPLETA[/bold green]\n")
            self.diagnostico['verificaciones']['estructura_proyecto'] = 'OK'
        else:
            self.console.print(f"\n[bold yellow]⚠ Estructura del Proyecto: {len(problemas_proyecto)} elementos faltantes[/bold yellow]\n")
            self.diagnostico['verificaciones']['estructura_proyecto'] = 'CON_ADVERTENCIAS'
    
    def _verificar_configuracion(self):
        """Verificar archivos de configuración"""
        self.console.print("[bold blue]⚙️  5. VERIFICACIÓN DE CONFIGURACIÓN[/bold blue]\n")
        
        env_file = self.backup_dir / "project_files" / ".env"
        
        if env_file.exists():
            with open(env_file, 'r', encoding='utf-8') as f:
                contenido = f.read()
                
                variables_criticas = [
                    'DB_HOST',
                    'DB_USER',
                    'DB_PASSWORD',
                    'DB_NAME',
                    'JWT_SECRET'
                ]
                
                faltantes = []
                for var in variables_criticas:
                    if var not in contenido:
                        faltantes.append(var)
                        self.console.print(f"[yellow]  ⚠ Variable faltante: {var}[/yellow]")
                    else:
                        self.console.print(f"[green]  ✓ Variable configurada: {var}[/green]")
                
                if not faltantes:
                    self.console.print("\n[bold green]✅ Configuración: COMPLETA[/bold green]\n")
                    self.diagnostico['verificaciones']['configuracion'] = 'OK'
                else:
                    self.console.print(f"\n[bold yellow]⚠ Configuración: {len(faltantes)} variables faltantes[/bold yellow]\n")
                    self.diagnostico['verificaciones']['configuracion'] = 'CON_ADVERTENCIAS'
        else:
            self.console.print("[red]  ❌ Archivo .env NO EXISTE[/red]\n")
            self.diagnostico['verificaciones']['configuracion'] = 'ERROR'
    
    def generar_reporte_final(self):
        """Generar reporte final del diagnóstico"""
        self.console.print("\n" + "="*80)
        self.console.print(Panel(
            "[bold cyan]📋 REPORTE FINAL DEL DIAGNÓSTICO[/bold cyan]",
            box=box.DOUBLE
        ))
        self.console.print("="*80 + "\n")
        
        # Resumen de verificaciones
        tabla_resumen = Table(title="Resumen de Verificaciones", box=box.ROUNDED)
        tabla_resumen.add_column("Componente", style="cyan", width=35)
        tabla_resumen.add_column("Estado", style="white", width=20)
        tabla_resumen.add_column("Observación", style="dim", width=20)
        
        for componente, estado in self.diagnostico['verificaciones'].items():
            if isinstance(estado, dict):
                continue
            
            if estado == 'OK':
                tabla_resumen.add_row(
                    componente.replace('_', ' ').title(),
                    "[green]✅ PERFECTO[/green]",
                    "Sin problemas"
                )
            elif estado == 'CON_ADVERTENCIAS':
                tabla_resumen.add_row(
                    componente.replace('_', ' ').title(),
                    "[yellow]⚠ CON ADVERTENCIAS[/yellow]",
                    "Revisar logs"
                )
            else:
                tabla_resumen.add_row(
                    componente.replace('_', ' ').title(),
                    "[red]❌ ERROR[/red]",
                    "Requiere atención"
                )
        
        self.console.print(tabla_resumen)
        
        # Estadísticas
        self.console.print(f"\n[bold]Estadísticas del Backup:[/bold]")
        self.console.print(f"  • Éxitos: [green]{len(self.diagnostico['exitos'])}[/green]")
        self.console.print(f"  • Advertencias: [yellow]{len(self.diagnostico['advertencias'])}[/yellow]")
        self.console.print(f"  • Errores: [red]{len(self.diagnostico['errores'])}[/red]")
        
        # Información del dump SQL
        if 'dump_sql' in self.diagnostico['verificaciones']:
            dump_info = self.diagnostico['verificaciones']['dump_sql']
            self.console.print(f"\n[bold]Dump SQL:[/bold]")
            self.console.print(f"  • Tamaño: [cyan]{dump_info['tamaño_mb']} MB[/cyan]")
            self.console.print(f"  • Método: [cyan]{dump_info['metodo']}[/cyan]")
        
        # Información del paquete
        if 'paquete_zip' in self.diagnostico['verificaciones']:
            zip_info = self.diagnostico['verificaciones']['paquete_zip']
            self.console.print(f"\n[bold]Paquete Completo:[/bold]")
            self.console.print(f"  • Tamaño: [cyan]{zip_info['tamaño_mb']} MB[/cyan]")
            self.console.print(f"  • Ubicación: [dim]{zip_info['ruta']}[/dim]")
        
        # Conclusión final
        self.console.print("\n" + "="*80)
        
        errores_criticos = len(self.diagnostico['errores'])
        advertencias = len(self.diagnostico['advertencias'])
        
        if errores_criticos == 0 and advertencias == 0:
            self.console.print(Panel(
                "[bold green]✅ BACKUP COMPLETAMENTE FUNCIONAL[/bold green]\n\n"
                "El backup está perfectamente preparado para migración.\n"
                "Todos los componentes han sido verificados y están en orden.\n"
                "Puede proceder con confianza a migrar a otra PC.",
                title="🎉 DIAGNÓSTICO: EXCELENTE",
                style="green",
                box=box.DOUBLE
            ))
        elif errores_criticos == 0:
            self.console.print(Panel(
                f"[bold yellow]⚠ BACKUP FUNCIONAL CON ADVERTENCIAS[/bold yellow]\n\n"
                f"Se detectaron {advertencias} advertencias menores.\n"
                "El backup es usable pero revise los detalles arriba.\n"
                "La migración debería funcionar correctamente.",
                title="✓ DIAGNÓSTICO: BUENO",
                style="yellow",
                box=box.DOUBLE
            ))
        else:
            self.console.print(Panel(
                f"[bold red]❌ BACKUP CON PROBLEMAS[/bold red]\n\n"
                f"Se detectaron {errores_criticos} errores críticos.\n"
                "Revise los problemas antes de migrar.\n"
                "La migración podría no funcionar correctamente.",
                title="⚠ DIAGNÓSTICO: REQUIERE ATENCIÓN",
                style="red",
                box=box.DOUBLE
            ))
        
        self.console.print("="*80 + "\n")
        
        # Guardar reporte en archivo
        self._guardar_reporte_archivo()
    
    def _guardar_reporte_archivo(self):
        """Guardar reporte detallado en archivo de texto"""
        try:
            reporte_file = self.backup_dir / "REPORTE_DIAGNOSTICO.txt"
            
            with open(reporte_file, 'w', encoding='utf-8') as f:
                f.write("="*80 + "\n")
                f.write("REPORTE DE BACKUP Y DIAGNÓSTICO - ALBRU BRUNARIO CRM\n")
                f.write("="*80 + "\n\n")
                f.write(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Directorio: {self.backup_dir}\n\n")
                
                f.write("RESUMEN:\n")
                f.write(f"  • Éxitos: {len(self.diagnostico['exitos'])}\n")
                f.write(f"  • Advertencias: {len(self.diagnostico['advertencias'])}\n")
                f.write(f"  • Errores: {len(self.diagnostico['errores'])}\n\n")
                
                if self.diagnostico['exitos']:
                    f.write("ÉXITOS:\n")
                    for exito in self.diagnostico['exitos']:
                        f.write(f"  ✓ {exito}\n")
                    f.write("\n")
                
                if self.diagnostico['advertencias']:
                    f.write("ADVERTENCIAS:\n")
                    for advertencia in self.diagnostico['advertencias']:
                        f.write(f"  ⚠ {advertencia}\n")
                    f.write("\n")
                
                if self.diagnostico['errores']:
                    f.write("ERRORES:\n")
                    for error in self.diagnostico['errores']:
                        f.write(f"  ✗ {error}\n")
                    f.write("\n")
                
                f.write("="*80 + "\n")
                f.write("VERIFICACIONES DETALLADAS:\n")
                f.write("="*80 + "\n\n")
                
                for componente, resultado in self.diagnostico['verificaciones'].items():
                    f.write(f"{componente}: {resultado}\n")
            
            self.console.print(f"[green]✓ Reporte guardado en: {reporte_file}[/green]")
            
        except Exception as e:
            self.console.print(f"[yellow]⚠ No se pudo guardar el reporte: {e}[/yellow]")

# ==================== PUNTO DE ENTRADA ====================
def main():
    """Función principal"""
    try:
        sistema = SistemaBackupDiagnostico()
        exito = sistema.ejecutar_backup_completo()
        
        if exito:
            console.print("\n[bold green]Proceso completado exitosamente[/bold green]")
            return 0
        else:
            console.print("\n[bold yellow]Proceso completado con advertencias[/bold yellow]")
            return 1
            
    except KeyboardInterrupt:
        console.print("\n\n[yellow]Proceso cancelado por el usuario[/yellow]\n")
        return 2
    except Exception as e:
        console.print(f"\n[red]Error fatal: {e}[/red]\n")
        import traceback
        traceback.print_exc()
        return 3

if __name__ == "__main__":
    sys.exit(main())
