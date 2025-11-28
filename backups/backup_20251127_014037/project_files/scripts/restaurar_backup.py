#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema de Restauración de Backups - Albru Brunario CRM
=======================================================
Script para restaurar backups completos en una nueva PC.

Uso:
    python scripts/restaurar_backup.py

El script te permitirá:
1. Seleccionar un backup ZIP disponible
2. Restaurar toda la BD desde el SQL dump
3. Restaurar archivos del proyecto (.env, backend, src, etc.)
4. Verificar que todo se restauró correctamente
"""

import os
import sys
import json
import shutil
import zipfile
from pathlib import Path
from datetime import datetime
import mysql.connector
from mysql.connector import Error
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.prompt import Prompt, Confirm
from rich import box

console = Console()

# ==================== CONFIGURACIÓN ====================
BASE_DIR = Path(__file__).resolve().parent.parent
BACKUP_BASE_DIR = BASE_DIR / "backups"

# Configuración de BD desde .env o valores por defecto
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'albru'),
    'password': os.getenv('DB_PASSWORD', 'albru_pass'),
    'database': os.getenv('DB_NAME', 'albru'),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

# ==================== CLASE DE RESTAURACIÓN ====================
class SistemaRestauracion:
    """Sistema para restaurar backups en otra PC"""
    
    def __init__(self, backup_zip: Path):
        self.console = console
        self.backup_zip = backup_zip
        self.temp_dir = Path("C:/Temp-Restore-CRM")
        self.target_dir = BASE_DIR
        self.resultados = {
            'exitos': [],
            'advertencias': [],
            'errores': []
        }
        
    def ejecutar_restauracion_completa(self) -> bool:
        """Ejecutar proceso completo de restauración"""
        self.mostrar_banner()
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            console=self.console
        ) as progress:
            
            # Fase 1: Extraer backup
            task1 = progress.add_task("[cyan]Extrayendo backup...", total=100)
            if not self.extraer_backup():
                return False
            progress.update(task1, advance=100)
            
            # Fase 2: Restaurar archivos del proyecto
            task2 = progress.add_task("[cyan]Restaurando archivos del proyecto...", total=100)
            self.restaurar_archivos_proyecto()
            progress.update(task2, advance=100)
            
            # Fase 3: Restaurar base de datos
            task3 = progress.add_task("[cyan]Restaurando base de datos...", total=100)
            self.restaurar_base_datos()
            progress.update(task3, advance=100)
            
            # Fase 4: Verificar restauración
            task4 = progress.add_task("[cyan]Verificando restauración...", total=100)
            self.verificar_restauracion()
            progress.update(task4, advance=100)
        
        self.mostrar_reporte_final()
        return True
    
    def mostrar_banner(self):
        """Mostrar banner de restauración"""
        banner = """
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║        SISTEMA DE RESTAURACIÓN - ALBRU BRUNARIO CRM              ║
║        Restaurar backup completo en nueva PC                      ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
        """
        self.console.print(Panel(banner, style="bold green"))
        self.console.print(f"\n[dim]Archivo de backup: {self.backup_zip.name}[/dim]\n")
    
    def extraer_backup(self) -> bool:
        """Extraer archivo ZIP de backup"""
        try:
            self.console.print("[cyan]📦 Extrayendo backup...[/cyan]")
            
            # Crear directorio temporal
            if self.temp_dir.exists():
                shutil.rmtree(self.temp_dir)
            self.temp_dir.mkdir(parents=True, exist_ok=True)
            
            # Extraer ZIP
            with zipfile.ZipFile(self.backup_zip, 'r') as zip_ref:
                zip_ref.extractall(self.temp_dir)
            
            self.console.print(f"[green]✓ Backup extraído en: {self.temp_dir}[/green]")
            self.resultados['exitos'].append("Backup extraído correctamente")
            return True
            
        except Exception as e:
            self.console.print(f"[red]✗ Error al extraer backup: {e}[/red]")
            self.resultados['errores'].append(f"Error al extraer: {e}")
            return False
    
    def restaurar_archivos_proyecto(self):
        """Restaurar archivos del proyecto"""
        try:
            self.console.print("\n[cyan]📁 Restaurando archivos del proyecto...[/cyan]")
            
            # Buscar directorio con archivos del proyecto
            project_files = list(self.temp_dir.glob("**/project_files"))
            
            if not project_files:
                self.console.print("[yellow]⚠ No se encontraron archivos del proyecto en el backup[/yellow]")
                self.resultados['advertencias'].append("No se encontraron archivos del proyecto")
                return
            
            project_dir = project_files[0]
            
            # Archivos esenciales a copiar
            archivos_esenciales = [
                '.env',
                'docker-compose.yml',
                'package.json',
                'vite.config.ts',
                'tsconfig.json'
            ]
            
            restaurados = 0
            for archivo in archivos_esenciales:
                src = project_dir / archivo
                dst = self.target_dir / archivo
                
                if src.exists():
                    # Backup del archivo existente si hay uno
                    if dst.exists():
                        backup_file = dst.with_suffix(dst.suffix + '.backup')
                        shutil.copy2(dst, backup_file)
                        self.console.print(f"[dim]  → Backup guardado: {archivo}.backup[/dim]")
                    
                    shutil.copy2(src, dst)
                    self.console.print(f"[green]  ✓ {archivo}[/green]")
                    restaurados += 1
                else:
                    self.console.print(f"[yellow]  ⚠ {archivo} no encontrado en backup[/yellow]")
            
            # Directorios importantes a copiar
            directorios = ['backend', 'src', 'public', 'scripts']
            
            for directorio in directorios:
                src = project_dir / directorio
                dst = self.target_dir / directorio
                
                if src.exists():
                    # Backup del directorio existente
                    if dst.exists():
                        backup_dir = Path(str(dst) + '.backup')
                        if backup_dir.exists():
                            shutil.rmtree(backup_dir)
                        shutil.copytree(dst, backup_dir)
                        shutil.rmtree(dst)
                        self.console.print(f"[dim]  → Backup guardado: {directorio}.backup/[/dim]")
                    
                    shutil.copytree(src, dst)
                    archivos_count = len(list(dst.rglob('*')))
                    self.console.print(f"[green]  ✓ {directorio}/ ({archivos_count} archivos)[/green]")
                    restaurados += 1
                else:
                    self.console.print(f"[yellow]  ⚠ {directorio}/ no encontrado en backup[/yellow]")
            
            self.console.print(f"\n[green]✓ Archivos del proyecto restaurados ({restaurados} elementos)[/green]")
            self.resultados['exitos'].append(f"Restaurados {restaurados} archivos/directorios del proyecto")
            
        except Exception as e:
            self.console.print(f"[red]✗ Error al restaurar archivos: {e}[/red]")
            self.resultados['errores'].append(f"Error al restaurar archivos: {e}")
    
    def restaurar_base_datos(self) -> bool:
        """Restaurar base de datos desde SQL dump"""
        try:
            self.console.print("\n[cyan]💾 Restaurando base de datos...[/cyan]")
            
            # Buscar archivo SQL en el backup
            sql_files = list(self.temp_dir.glob("**/database/*.sql"))
            
            if not sql_files:
                self.console.print("[red]✗ No se encontró archivo SQL en el backup[/red]")
                self.resultados['errores'].append("Archivo SQL no encontrado")
                return False
            
            sql_file = sql_files[0]
            self.console.print(f"[cyan]  Archivo SQL encontrado: {sql_file.name}[/cyan]")
            
            # Verificar conexión a BD
            try:
                self.console.print(f"[cyan]  Conectando a MySQL: {DB_CONFIG['host']}:{DB_CONFIG['port']}...[/cyan]")
                conn = mysql.connector.connect(**DB_CONFIG)
                cursor = conn.cursor()
                
                self.console.print(f"[cyan]  Leyendo y ejecutando SQL...[/cyan]")
                
                # Leer archivo SQL
                with open(sql_file, 'r', encoding='utf-8') as f:
                    sql_content = f.read()
                
                # Dividir en statements individuales
                statements = [s.strip() for s in sql_content.split(';') if s.strip()]
                total = len(statements)
                
                self.console.print(f"[cyan]  Ejecutando {total} statements SQL...[/cyan]")
                
                # Ejecutar cada statement
                ejecutados = 0
                errores_menores = 0
                
                for i, statement in enumerate(statements):
                    if statement.strip():
                        try:
                            cursor.execute(statement)
                            ejecutados += 1
                            
                            # Mostrar progreso cada 100 statements
                            if (i + 1) % 100 == 0:
                                self.console.print(f"[dim]    Progreso: {i + 1}/{total} statements[/dim]")
                        except Exception as e:
                            error_msg = str(e).lower()
                            # Ignorar algunos errores comunes que no son críticos
                            if any(x in error_msg for x in ['already exists', 'duplicate', 'doesn\'t exist']):
                                errores_menores += 1
                            else:
                                self.console.print(f"[yellow]    ⚠ Error en statement {i + 1}: {e}[/yellow]")
                                errores_menores += 1
                
                conn.commit()
                cursor.close()
                conn.close()
                
                self.console.print(f"[green]✓ Base de datos restaurada ({ejecutados} statements ejecutados)[/green]")
                if errores_menores > 0:
                    self.console.print(f"[yellow]  ⚠ {errores_menores} advertencias menores (ignoradas)[/yellow]")
                
                self.resultados['exitos'].append(f"BD restaurada ({ejecutados} statements)")
                if errores_menores > 0:
                    self.resultados['advertencias'].append(f"{errores_menores} advertencias menores en SQL")
                
                return True
                
            except Error as e:
                self.console.print(f"[red]✗ Error de conexión a BD: {e}[/red]")
                self.console.print(f"[yellow]  ℹ Verifica que Docker esté corriendo: docker-compose up -d[/yellow]")
                self.resultados['errores'].append(f"Error de conexión BD: {e}")
                return False
            
        except Exception as e:
            self.console.print(f"[red]✗ Error al restaurar BD: {e}[/red]")
            self.resultados['errores'].append(f"Error al restaurar BD: {e}")
            return False
    
    def verificar_restauracion(self):
        """Verificar que la restauración fue exitosa"""
        self.console.print("\n[cyan]🔍 Verificando restauración...[/cyan]\n")
        
        verificaciones = []
        
        # 1. Verificar archivos críticos
        archivos_criticos = [
            '.env',
            'docker-compose.yml',
            'package.json',
            'backend/server.js',
            'src/main.tsx'
        ]
        
        for archivo in archivos_criticos:
            path = self.target_dir / archivo
            if path.exists():
                size = path.stat().st_size
                self.console.print(f"[green]  ✓ {archivo} ({size} bytes)[/green]")
                verificaciones.append(('archivo', archivo, True))
            else:
                self.console.print(f"[red]  ✗ {archivo} NO existe[/red]")
                verificaciones.append(('archivo', archivo, False))
                self.resultados['errores'].append(f"Archivo faltante: {archivo}")
        
        # 2. Verificar directorios
        directorios_criticos = ['backend', 'src', 'public', 'scripts']
        
        for directorio in directorios_criticos:
            path = self.target_dir / directorio
            if path.exists() and path.is_dir():
                archivos = len(list(path.rglob('*')))
                self.console.print(f"[green]  ✓ {directorio}/ ({archivos} archivos)[/green]")
                verificaciones.append(('directorio', directorio, True))
            else:
                self.console.print(f"[red]  ✗ {directorio}/ NO existe[/red]")
                verificaciones.append(('directorio', directorio, False))
                self.resultados['errores'].append(f"Directorio faltante: {directorio}/")
        
        # 3. Verificar conexión y datos en BD
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            
            # Contar clientes
            cursor.execute("SELECT COUNT(*) FROM clientes")
            count_clientes = cursor.fetchone()[0]
            
            # Contar usuarios
            cursor.execute("SELECT COUNT(*) FROM usuarios")
            count_usuarios = cursor.fetchone()[0]
            
            # Contar asesores
            cursor.execute("SELECT COUNT(*) FROM asesores")
            count_asesores = cursor.fetchone()[0]
            
            cursor.close()
            conn.close()
            
            self.console.print(f"[green]  ✓ Base de datos conectada[/green]")
            self.console.print(f"[green]    • {count_clientes} clientes[/green]")
            self.console.print(f"[green]    • {count_usuarios} usuarios[/green]")
            self.console.print(f"[green]    • {count_asesores} asesores[/green]")
            
            verificaciones.append(('bd', 'conexion', True))
            self.resultados['exitos'].append(f"BD verificada: {count_clientes} clientes")
            
        except Exception as e:
            self.console.print(f"[yellow]  ⚠ No se pudo verificar BD: {e}[/yellow]")
            self.console.print(f"[yellow]    ℹ Asegúrate de que Docker esté corriendo[/yellow]")
            verificaciones.append(('bd', 'conexion', False))
            self.resultados['advertencias'].append("No se pudo verificar BD (¿Docker corriendo?)")
        
        # Resumen de verificaciones
        total = len(verificaciones)
        exitosas = sum(1 for _, _, ok in verificaciones if ok)
        
        self.console.print(f"\n[cyan]Verificaciones: {exitosas}/{total} exitosas[/cyan]")
    
    def mostrar_reporte_final(self):
        """Mostrar reporte final de restauración"""
        self.console.print("\n" + "="*80)
        
        # Contar resultados
        exitos = len(self.resultados['exitos'])
        advertencias = len(self.resultados['advertencias'])
        errores = len(self.resultados['errores'])
        
        # Determinar estado general
        if errores == 0 and advertencias == 0:
            estado = "[bold green]✅ RESTAURACIÓN EXITOSA[/bold green]"
            estilo = "green"
        elif errores == 0:
            estado = "[bold yellow]⚠ RESTAURACIÓN COMPLETADA CON ADVERTENCIAS[/bold yellow]"
            estilo = "yellow"
        else:
            estado = "[bold red]❌ RESTAURACIÓN COMPLETADA CON ERRORES[/bold red]"
            estilo = "red"
        
        # Construir mensaje
        mensaje = f"{estado}\n\n"
        mensaje += f"[bold]Resumen:[/bold]\n"
        mensaje += f"  • Éxitos: {exitos}\n"
        mensaje += f"  • Advertencias: {advertencias}\n"
        mensaje += f"  • Errores: {errores}\n\n"
        
        if self.resultados['exitos']:
            mensaje += "[bold green]Éxitos:[/bold green]\n"
            for exito in self.resultados['exitos']:
                mensaje += f"  ✓ {exito}\n"
            mensaje += "\n"
        
        if self.resultados['advertencias']:
            mensaje += "[bold yellow]Advertencias:[/bold yellow]\n"
            for adv in self.resultados['advertencias']:
                mensaje += f"  ⚠ {adv}\n"
            mensaje += "\n"
        
        if self.resultados['errores']:
            mensaje += "[bold red]Errores:[/bold red]\n"
            for error in self.resultados['errores']:
                mensaje += f"  ✗ {error}\n"
            mensaje += "\n"
        
        if errores == 0:
            mensaje += "[bold]Próximos pasos:[/bold]\n"
            mensaje += "1. Verificar archivo .env con tus credenciales\n"
            mensaje += "2. Iniciar Docker: docker-compose up -d\n"
            mensaje += "3. Instalar dependencias: cd backend && npm install\n"
            mensaje += "4. Iniciar backend: npm start\n"
            mensaje += "5. En otra terminal, iniciar frontend: npm run dev\n"
        
        self.console.print(Panel(
            mensaje,
            title="🎉 REPORTE DE RESTAURACIÓN",
            style=estilo,
            box=box.DOUBLE
        ))
        self.console.print("="*80 + "\n")
        
        # Limpiar directorio temporal
        try:
            if self.temp_dir.exists():
                shutil.rmtree(self.temp_dir)
                self.console.print(f"[dim]Directorio temporal eliminado: {self.temp_dir}[/dim]\n")
        except:
            pass

# ==================== PUNTO DE ENTRADA ====================
def main():
    """Función principal"""
    try:
        console.print("\n" + "="*70)
        console.print("[bold cyan]SISTEMA DE RESTAURACIÓN DE BACKUPS[/bold cyan]")
        console.print("[dim]Albru Brunario CRM[/dim]")
        console.print("="*70 + "\n")
        
        # Buscar backups disponibles
        backups = sorted(
            list(BACKUP_BASE_DIR.glob("backup_completo_*.zip")),
            key=lambda x: x.stat().st_mtime,
            reverse=True
        )
        
        if backups:
            console.print("[green]Backups disponibles:[/green]\n")
            
            table = Table(show_header=True, header_style="bold cyan")
            table.add_column("#", style="dim", width=3)
            table.add_column("Archivo", style="cyan")
            table.add_column("Tamaño", justify="right")
            table.add_column("Fecha", style="dim")
            
            for i, backup in enumerate(backups[:10], 1):  # Mostrar últimos 10
                size_mb = backup.stat().st_size / (1024 * 1024)
                fecha = datetime.fromtimestamp(backup.stat().st_mtime)
                table.add_row(
                    str(i),
                    backup.name,
                    f"{size_mb:.2f} MB",
                    fecha.strftime('%Y-%m-%d %H:%M')
                )
            
            console.print(table)
            console.print("\n[dim]Mostrando últimos 10 backups[/dim]\n")
            
            opciones = [str(i) for i in range(1, min(len(backups), 10) + 1)] + ["0"]
            seleccion = Prompt.ask(
                "Seleccione backup (0 para especificar ruta manualmente)",
                choices=opciones
            )
            
            if seleccion == "0":
                backup_path = Prompt.ask("Ingrese la ruta completa del archivo ZIP de backup")
                backup_zip = Path(backup_path)
            else:
                backup_zip = backups[int(seleccion) - 1]
        else:
            console.print("[yellow]No se encontraron backups en el directorio[/yellow]")
            console.print(f"[dim]Directorio de backups: {BACKUP_BASE_DIR}[/dim]\n")
            
            backup_path = Prompt.ask("Ingrese la ruta completa del archivo ZIP de backup")
            backup_zip = Path(backup_path)
        
        # Verificar que existe
        if not backup_zip.exists():
            console.print(f"\n[red]✗ Archivo no encontrado: {backup_zip}[/red]\n")
            return 1
        
        # Confirmar restauración
        console.print(f"\n[bold yellow]⚠ ADVERTENCIA:[/bold yellow]")
        console.print(f"Esta operación sobrescribirá archivos existentes.")
        console.print(f"Se crearán copias de seguridad con extensión .backup\n")
        
        if not Confirm.ask(f"¿Restaurar desde [cyan]{backup_zip.name}[/cyan]?", default=False):
            console.print("\n[yellow]Operación cancelada[/yellow]\n")
            return 0
        
        # Ejecutar restauración
        restaurador = SistemaRestauracion(backup_zip)
        exito = restaurador.ejecutar_restauracion_completa()
        
        return 0 if exito else 1
            
    except KeyboardInterrupt:
        console.print("\n\n[yellow]Operación cancelada por el usuario[/yellow]\n")
        return 2
    except Exception as e:
        console.print(f"\n[red]Error fatal: {e}[/red]\n")
        import traceback
        traceback.print_exc()
        return 3

if __name__ == "__main__":
    sys.exit(main())
