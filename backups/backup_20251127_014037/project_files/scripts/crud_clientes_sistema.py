#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema CRUD Completo para Gestión de Clientes - Albru Brunario CRM
====================================================================
Sistema completo de gestión de clientes con pandas que permite:
- Búsqueda por número, DNI, ID o nombre
- Visualización completa de historial de categorías, subcategorías y asesores
- CRUD completo (crear, editar, modificar, eliminar)
- Sincronización automática con frontend mediante JSON
- Validación de duplicados
- Interfaz de consola con rich
- Exportaciones
- Estructura modular lista para producción
"""

import os
import sys
import json
import pandas as pd
import mysql.connector
from mysql.connector import Error
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Any, Tuple
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich import box
from rich.layout import Layout
from rich.live import Live
from rich.text import Text
import warnings

warnings.filterwarnings('ignore')

# ==================== CONFIGURACIÓN ====================
console = Console()

# Ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
PUBLIC_DIR = BACKEND_DIR / "public"
DATA_EXPORT_DIR = BASE_DIR / "exports"

# Crear directorios si no existen
DATA_EXPORT_DIR.mkdir(exist_ok=True)
PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

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
class SistemaCRUDClientes:
    """Sistema completo de gestión de clientes con sincronización al frontend"""
    
    def __init__(self):
        self.conn = None
        self.df_clientes = None
        self.df_historial = None
        self.df_asesores = None
        self.df_gestiones = None
        self.console = console
        
    def conectar_bd(self) -> bool:
        """Conectar a la base de datos MySQL"""
        try:
            self.console.print("\n[bold blue]🔌 Conectando a base de datos...[/bold blue]")
            self.conn = mysql.connector.connect(**DB_CONFIG)
            
            if self.conn.is_connected():
                db_info = self.conn.get_server_info()
                self.console.print(f"[green]✓ Conectado a MySQL Server {db_info}[/green]")
                return True
        except Error as e:
            self.console.print(f"[red]✗ Error al conectar: {e}[/red]")
            return False
    
    def cargar_datos(self) -> bool:
        """Cargar todos los datos de la BD a DataFrames de pandas"""
        try:
            self.console.print("[bold blue]📥 Cargando datos desde la base de datos...[/bold blue]")
            
            # Cargar clientes (solo principales, no duplicados)
            query_clientes = """
                SELECT 
                    c.*,
                    u.nombre as asesor_nombre,
                    u.email as asesor_email,
                    u.telefono as asesor_telefono
                FROM clientes c
                LEFT JOIN usuarios u ON c.asesor_asignado = u.id AND u.tipo = 'asesor'
                WHERE (c.es_duplicado = FALSE OR c.es_duplicado IS NULL)
                ORDER BY c.id DESC
            """
            self.df_clientes = pd.read_sql(query_clientes, self.conn)
            
            # Cargar historial de estados
            query_historial = """
                SELECT 
                    he.*,
                    u.nombre as usuario_nombre,
                    u.tipo as usuario_tipo
                FROM historial_estados he
                LEFT JOIN usuarios u ON he.usuario_id = u.id
                ORDER BY he.created_at DESC
            """
            self.df_historial = pd.read_sql(query_historial, self.conn)
            
            # Cargar historial de gestiones (stepper)
            query_gestiones = """
                SELECT 
                    hg.*,
                    u.nombre as usuario_nombre_completo
                FROM historial_gestiones hg
                LEFT JOIN usuarios u ON hg.asesor_id = u.id
                ORDER BY hg.paso ASC, hg.fecha_gestion ASC
            """
            self.df_gestiones = pd.read_sql(query_gestiones, self.conn)
            
            # Cargar asesores
            query_asesores = """
                SELECT 
                    a.*,
                    u.nombre,
                    u.email,
                    u.telefono,
                    u.estado,
                    u.tipo,
                    gtr_u.nombre as gtr_nombre
                FROM asesores a
                JOIN usuarios u ON a.usuario_id = u.id
                LEFT JOIN gtr gt ON a.gtr_asignado = gt.id
                LEFT JOIN usuarios gtr_u ON gt.usuario_id = gtr_u.id
                WHERE u.tipo = 'asesor'
            """
            self.df_asesores = pd.read_sql(query_asesores, self.conn)
            
            self.console.print(f"[green]✓ Clientes cargados: {len(self.df_clientes)}[/green]")
            self.console.print(f"[green]✓ Historial de estados: {len(self.df_historial)}[/green]")
            self.console.print(f"[green]✓ Historial de gestiones: {len(self.df_gestiones)}[/green]")
            self.console.print(f"[green]✓ Asesores: {len(self.df_asesores)}[/green]")
            
            return True
            
        except Error as e:
            self.console.print(f"[red]✗ Error al cargar datos: {e}[/red]")
            return False
    
    def buscar_cliente(self, termino: str) -> pd.DataFrame:
        """Buscar cliente por número, DNI, ID o nombre"""
        if self.df_clientes is None or self.df_clientes.empty:
            return pd.DataFrame()
        
        termino = str(termino).strip().lower()
        
        # Normalizar teléfono (sin espacios, guiones, +51)
        termino_normalizado = termino.replace(' ', '').replace('-', '').replace('+', '').replace('51', '', 1)
        
        # Buscar en múltiples campos
        mask = (
            self.df_clientes['id'].astype(str).str.contains(termino, case=False, na=False) |
            self.df_clientes['nombre'].str.contains(termino, case=False, na=False) |
            self.df_clientes['telefono'].str.replace(' ', '').str.replace('-', '').str.contains(termino_normalizado, case=False, na=False) |
            self.df_clientes['dni'].astype(str).str.contains(termino, case=False, na=False) |
            (self.df_clientes['leads_original_telefono'].notna() & 
             self.df_clientes['leads_original_telefono'].str.replace(' ', '').str.replace('-', '').str.contains(termino_normalizado, case=False, na=False))
        )
        
        return self.df_clientes[mask]
    
    def mostrar_cliente_completo(self, cliente_id: int):
        """Mostrar todos los datos completos de un cliente con su historial"""
        cliente = self.df_clientes[self.df_clientes['id'] == cliente_id]
        
        if cliente.empty:
            self.console.print(f"[red]✗ Cliente con ID {cliente_id} no encontrado[/red]")
            return
        
        cliente_data = cliente.iloc[0]
        
        # Panel principal con información del cliente
        self.console.print("\n" + "="*80)
        self.console.print(Panel(
            f"[bold cyan]CLIENTE ID: {cliente_id}[/bold cyan]",
            box=box.DOUBLE
        ))
        
        # Información personal
        tabla_personal = Table(title="📋 INFORMACIÓN PERSONAL", box=box.ROUNDED)
        tabla_personal.add_column("Campo", style="cyan", width=30)
        tabla_personal.add_column("Valor", style="white", width=45)
        
        tabla_personal.add_row("Nombre Completo", str(cliente_data.get('nombre', 'N/A')))
        tabla_personal.add_row("DNI", str(cliente_data.get('dni', 'N/A')))
        tabla_personal.add_row("Teléfono Principal", str(cliente_data.get('telefono', 'N/A')))
        tabla_personal.add_row("Teléfono Original", str(cliente_data.get('leads_original_telefono', 'N/A')))
        tabla_personal.add_row("Email", str(cliente_data.get('email', 'N/A')))
        tabla_personal.add_row("Fecha Nacimiento", str(cliente_data.get('fecha_nacimiento', 'N/A')))
        tabla_personal.add_row("Edad", str(cliente_data.get('edad', 'N/A')))
        tabla_personal.add_row("Género", str(cliente_data.get('genero', 'N/A')))
        tabla_personal.add_row("Estado Civil", str(cliente_data.get('estado_civil', 'N/A')))
        tabla_personal.add_row("Ocupación", str(cliente_data.get('ocupacion', 'N/A')))
        
        self.console.print(tabla_personal)
        
        # Información de contacto y ubicación
        tabla_contacto = Table(title="📍 UBICACIÓN Y CONTACTO", box=box.ROUNDED)
        tabla_contacto.add_column("Campo", style="cyan", width=30)
        tabla_contacto.add_column("Valor", style="white", width=45)
        
        tabla_contacto.add_row("Dirección Completa", str(cliente_data.get('direccion_completa', 'N/A')))
        tabla_contacto.add_row("Ciudad", str(cliente_data.get('ciudad', 'N/A')))
        tabla_contacto.add_row("Departamento", str(cliente_data.get('departamento', 'N/A')))
        tabla_contacto.add_row("Distrito", str(cliente_data.get('distrito', 'N/A')))
        tabla_contacto.add_row("Teléfono Referencia", str(cliente_data.get('telefono_referencia_wizard', 'N/A')))
        
        self.console.print(tabla_contacto)
        
        # Estado comercial y gestión
        tabla_comercial = Table(title="💼 ESTADO COMERCIAL", box=box.ROUNDED)
        tabla_comercial.add_column("Campo", style="cyan", width=30)
        tabla_comercial.add_column("Valor", style="white", width=45)
        
        tabla_comercial.add_row("Categoría", str(cliente_data.get('estatus_comercial_categoria', 'N/A')))
        tabla_comercial.add_row("Subcategoría", str(cliente_data.get('estatus_comercial_subcategoria', 'N/A')))
        tabla_comercial.add_row("Campaña", str(cliente_data.get('campana', 'N/A')))
        tabla_comercial.add_row("Canal Adquisición", str(cliente_data.get('canal_adquisicion', 'N/A')))
        tabla_comercial.add_row("Estado Seguimiento", str(cliente_data.get('seguimiento_status', 'N/A')))
        tabla_comercial.add_row("Wizard Completado", "✓ SI" if cliente_data.get('wizard_completado') == 1 else "✗ NO")
        tabla_comercial.add_row("Fecha Wizard", str(cliente_data.get('fecha_wizard_completado', 'N/A')))
        
        self.console.print(tabla_comercial)
        
        # Asesor asignado
        if pd.notna(cliente_data.get('asesor_asignado')):
            tabla_asesor = Table(title="👤 ASESOR ASIGNADO", box=box.ROUNDED)
            tabla_asesor.add_column("Campo", style="cyan", width=30)
            tabla_asesor.add_column("Valor", style="white", width=45)
            
            tabla_asesor.add_row("Nombre", str(cliente_data.get('asesor_nombre', 'N/A')))
            tabla_asesor.add_row("ID Asesor", str(cliente_data.get('asesor_asignado', 'N/A')))
            tabla_asesor.add_row("Email", str(cliente_data.get('asesor_email', 'N/A')))
            tabla_asesor.add_row("Teléfono", str(cliente_data.get('asesor_telefono', 'N/A')))
            tabla_asesor.add_row("Fecha Asignación", str(cliente_data.get('fecha_asignacion_asesor', 'N/A')))
            
            self.console.print(tabla_asesor)
        
        # Historial de cambios de estado
        historial_cliente = self.df_historial[self.df_historial['cliente_id'] == cliente_id]
        
        if not historial_cliente.empty:
            tabla_historial = Table(title=f"📜 HISTORIAL DE ESTADOS ({len(historial_cliente)} registros)", box=box.ROUNDED)
            tabla_historial.add_column("Fecha", style="cyan", width=18)
            tabla_historial.add_column("Usuario", style="yellow", width=15)
            tabla_historial.add_column("Tipo", style="magenta", width=10)
            tabla_historial.add_column("Estado Anterior", style="red", width=15)
            tabla_historial.add_column("Estado Nuevo", style="green", width=15)
            tabla_historial.add_column("Comentarios", style="white", width=25)
            
            for _, row in historial_cliente.head(10).iterrows():
                tabla_historial.add_row(
                    str(row['created_at'])[:19] if pd.notna(row['created_at']) else 'N/A',
                    str(row['usuario_nombre'])[:15] if pd.notna(row['usuario_nombre']) else 'N/A',
                    str(row['tipo'])[:10] if pd.notna(row['tipo']) else 'N/A',
                    str(row['estado_anterior'])[:15] if pd.notna(row['estado_anterior']) else 'N/A',
                    str(row['estado_nuevo'])[:15] if pd.notna(row['estado_nuevo']) else 'N/A',
                    str(row['comentarios'])[:25] if pd.notna(row['comentarios']) else 'N/A'
                )
            
            self.console.print(tabla_historial)
            if len(historial_cliente) > 10:
                self.console.print(f"[dim]... y {len(historial_cliente) - 10} registros más[/dim]")
        
        # Historial de gestiones (stepper)
        gestiones_cliente = self.df_gestiones[self.df_gestiones['cliente_id'] == cliente_id]
        
        if not gestiones_cliente.empty:
            tabla_gestiones = Table(title=f"🎯 HISTORIAL DE GESTIONES ({len(gestiones_cliente)} pasos)", box=box.ROUNDED)
            tabla_gestiones.add_column("Paso", style="cyan", width=5)
            tabla_gestiones.add_column("Fecha", style="yellow", width=18)
            tabla_gestiones.add_column("Asesor", style="magenta", width=15)
            tabla_gestiones.add_column("Categoría", style="green", width=20)
            tabla_gestiones.add_column("Subcategoría", style="blue", width=20)
            tabla_gestiones.add_column("Resultado", style="white", width=15)
            
            for _, row in gestiones_cliente.iterrows():
                tabla_gestiones.add_row(
                    str(row['paso']) if pd.notna(row['paso']) else 'N/A',
                    str(row['fecha_gestion'])[:19] if pd.notna(row['fecha_gestion']) else 'N/A',
                    str(row['asesor_nombre'])[:15] if pd.notna(row['asesor_nombre']) else 'N/A',
                    str(row['categoria'])[:20] if pd.notna(row['categoria']) else 'N/A',
                    str(row['subcategoria'])[:20] if pd.notna(row['subcategoria']) else 'N/A',
                    str(row['resultado'])[:15] if pd.notna(row['resultado']) else 'N/A'
                )
            
            self.console.print(tabla_gestiones)
        
        self.console.print("="*80 + "\n")
    
    def crear_cliente(self, datos: Dict[str, Any]) -> Tuple[bool, str]:
        """Crear nuevo cliente con validación de duplicados"""
        try:
            # Validar campos requeridos
            if 'nombre' not in datos or 'telefono' not in datos:
                return False, "Nombre y teléfono son obligatorios"
            
            # Validar duplicados por teléfono
            telefono_normalizado = datos['telefono'].replace(' ', '').replace('-', '').replace('+', '')
            
            # Buscar duplicados existentes
            cursor = self.conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, nombre, telefono FROM clientes 
                WHERE REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '-', ''), '+', '') = %s
                LIMIT 1
            """, (telefono_normalizado,))
            
            duplicado = cursor.fetchone()
            
            if duplicado:
                return False, f"Ya existe un cliente con ese teléfono: ID {duplicado['id']} - {duplicado['nombre']}"
            
            # Preparar datos para inserción
            campos = []
            valores = []
            placeholders = []
            
            # Mapeo de campos permitidos
            campos_permitidos = {
                'nombre', 'telefono', 'dni', 'email', 'direccion', 'ciudad', 'departamento',
                'edad', 'genero', 'estado_civil', 'ocupacion', 'campana', 'asesor_asignado',
                'estatus_comercial_categoria', 'estatus_comercial_subcategoria', 'observaciones_asesor'
            }
            
            for campo, valor in datos.items():
                if campo in campos_permitidos:
                    campos.append(campo)
                    valores.append(valor)
                    placeholders.append('%s')
            
            if not campos:
                return False, "No se proporcionaron campos válidos"
            
            # Agregar timestamp
            campos.append('created_at')
            campos.append('updated_at')
            valores.append(datetime.now())
            valores.append(datetime.now())
            placeholders.append('NOW()')
            placeholders.append('NOW()')
            
            # Ejecutar inserción
            query = f"INSERT INTO clientes ({', '.join(campos)}) VALUES ({', '.join(placeholders)})"
            cursor.execute(query, valores[:-2])  # Excluir los NOW() de valores
            self.conn.commit()
            
            nuevo_id = cursor.lastrowid
            cursor.close()
            
            # Recargar datos
            self.cargar_datos()
            
            # Sincronizar con frontend
            self.sincronizar_frontend()
            
            return True, f"Cliente creado exitosamente con ID: {nuevo_id}"
            
        except Error as e:
            return False, f"Error al crear cliente: {str(e)}"
    
    def editar_cliente(self, cliente_id: int, datos: Dict[str, Any]) -> Tuple[bool, str]:
        """Editar datos de un cliente existente"""
        try:
            # Verificar que existe
            cursor = self.conn.cursor()
            cursor.execute("SELECT id FROM clientes WHERE id = %s", (cliente_id,))
            if not cursor.fetchone():
                return False, f"Cliente con ID {cliente_id} no encontrado"
            
            # Preparar datos para actualización
            campos_valores = []
            valores = []
            
            # Mapeo de campos editables
            campos_editables = {
                'nombre', 'telefono', 'dni', 'email', 'direccion', 'ciudad', 'departamento',
                'edad', 'genero', 'estado_civil', 'ocupacion', 'ingresos_mensuales',
                'direccion_completa', 'distrito', 'campana', 'asesor_asignado',
                'estatus_comercial_categoria', 'estatus_comercial_subcategoria',
                'observaciones_asesor', 'seguimiento_status'
            }
            
            for campo, valor in datos.items():
                if campo in campos_editables:
                    campos_valores.append(f"{campo} = %s")
                    valores.append(valor)
            
            if not campos_valores:
                return False, "No se proporcionaron campos válidos para actualizar"
            
            # Agregar updated_at
            campos_valores.append("updated_at = NOW()")
            
            # Ejecutar actualización
            valores.append(cliente_id)
            query = f"UPDATE clientes SET {', '.join(campos_valores)} WHERE id = %s"
            cursor.execute(query, valores)
            self.conn.commit()
            cursor.close()
            
            # Registrar en historial si cambió el estado
            if 'estatus_comercial_categoria' in datos or 'estatus_comercial_subcategoria' in datos:
                self._registrar_cambio_estado(cliente_id, datos)
            
            # Recargar datos
            self.cargar_datos()
            
            # Sincronizar con frontend
            self.sincronizar_frontend()
            
            return True, f"Cliente {cliente_id} actualizado exitosamente"
            
        except Error as e:
            return False, f"Error al editar cliente: {str(e)}"
    
    def eliminar_cliente(self, cliente_id: int) -> Tuple[bool, str]:
        """Eliminar un cliente (soft delete recomendado)"""
        try:
            cursor = self.conn.cursor()
            
            # Verificar que existe
            cursor.execute("SELECT id, nombre FROM clientes WHERE id = %s", (cliente_id,))
            cliente = cursor.fetchone()
            
            if not cliente:
                return False, f"Cliente con ID {cliente_id} no encontrado"
            
            # Eliminar permanentemente (usar con cuidado)
            cursor.execute("DELETE FROM clientes WHERE id = %s", (cliente_id,))
            self.conn.commit()
            cursor.close()
            
            # Recargar datos
            self.cargar_datos()
            
            # Sincronizar con frontend
            self.sincronizar_frontend()
            
            return True, f"Cliente {cliente_id} eliminado exitosamente"
            
        except Error as e:
            return False, f"Error al eliminar cliente: {str(e)}"
    
    def _registrar_cambio_estado(self, cliente_id: int, datos: Dict[str, Any]):
        """Registrar cambio de estado en historial"""
        try:
            cursor = self.conn.cursor(dictionary=True)
            
            # Obtener estado anterior
            cursor.execute("""
                SELECT estatus_comercial_categoria, estatus_comercial_subcategoria 
                FROM clientes WHERE id = %s
            """, (cliente_id,))
            anterior = cursor.fetchone()
            
            # Insertar en historial_estados
            cursor.execute("""
                INSERT INTO historial_estados 
                (cliente_id, tipo, estado_anterior, estado_nuevo, comentarios, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
            """, (
                cliente_id,
                'sistema',
                anterior.get('estatus_comercial_categoria'),
                datos.get('estatus_comercial_categoria'),
                f"Actualización desde CRUD Python: {datos.get('estatus_comercial_subcategoria', '')}"
            ))
            
            self.conn.commit()
            cursor.close()
        except:
            pass  # No crítico
    
    def sincronizar_frontend(self):
        """Sincronizar datos con el frontend mediante archivos JSON"""
        try:
            self.console.print("[bold blue]🔄 Sincronizando con frontend...[/bold blue]")
            
            # 1. Exportar clientes activos para el frontend
            clientes_activos = self.df_clientes[
                (self.df_clientes['seguimiento_status'] != 'gestionado') | 
                (self.df_clientes['seguimiento_status'].isna())
            ].copy()
            
            # Convertir a formato JSON-friendly
            clientes_json = clientes_activos.to_dict('records')
            
            # Limpiar valores NaN y convertir a None
            for cliente in clientes_json:
                for key, value in cliente.items():
                    if pd.isna(value):
                        cliente[key] = None
                    elif isinstance(value, pd.Timestamp):
                        cliente[key] = value.isoformat()
            
            # Guardar JSON para frontend
            json_path = PUBLIC_DIR / "clientes_activos.json"
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(clientes_json, f, ensure_ascii=False, indent=2, default=str)
            
            self.console.print(f"[green]✓ Clientes exportados a: {json_path}[/green]")
            
            # 2. Exportar estadísticas
            stats = {
                'total_clientes': len(self.df_clientes),
                'clientes_activos': len(clientes_activos),
                'clientes_gestionados': len(self.df_clientes[self.df_clientes['wizard_completado'] == 1]),
                'ultima_actualizacion': datetime.now().isoformat(),
                'asesores_activos': len(self.df_asesores[self.df_asesores['estado'] == 'activo'])
            }
            
            stats_path = PUBLIC_DIR / "stats_clientes.json"
            with open(stats_path, 'w', encoding='utf-8') as f:
                json.dump(stats, f, ensure_ascii=False, indent=2)
            
            self.console.print(f"[green]✓ Estadísticas exportadas a: {stats_path}[/green]")
            
            return True
            
        except Exception as e:
            self.console.print(f"[red]✗ Error en sincronización: {e}[/red]")
            return False
    
    def exportar_excel(self, archivo: str = None):
        """Exportar todos los datos a Excel"""
        try:
            if archivo is None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                archivo = DATA_EXPORT_DIR / f"clientes_export_{timestamp}.xlsx"
            
            self.console.print(f"[bold blue]📊 Exportando a Excel: {archivo}[/bold blue]")
            
            with pd.ExcelWriter(archivo, engine='openpyxl') as writer:
                self.df_clientes.to_excel(writer, sheet_name='Clientes', index=False)
                self.df_historial.to_excel(writer, sheet_name='Historial Estados', index=False)
                self.df_gestiones.to_excel(writer, sheet_name='Historial Gestiones', index=False)
                self.df_asesores.to_excel(writer, sheet_name='Asesores', index=False)
            
            self.console.print(f"[green]✓ Exportado exitosamente a: {archivo}[/green]")
            return True
            
        except Exception as e:
            self.console.print(f"[red]✗ Error al exportar: {e}[/red]")
            return False
    
    def exportar_csv(self, archivo: str = None):
        """Exportar clientes a CSV"""
        try:
            if archivo is None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                archivo = DATA_EXPORT_DIR / f"clientes_export_{timestamp}.csv"
            
            self.console.print(f"[bold blue]📄 Exportando a CSV: {archivo}[/bold blue]")
            
            self.df_clientes.to_csv(archivo, index=False, encoding='utf-8-sig')
            
            self.console.print(f"[green]✓ Exportado exitosamente a: {archivo}[/green]")
            return True
            
        except Exception as e:
            self.console.print(f"[red]✗ Error al exportar: {e}[/red]")
            return False
    
    def cerrar_conexion(self):
        """Cerrar conexión a la BD"""
        if self.conn and self.conn.is_connected():
            self.conn.close()
            self.console.print("[dim]Conexión cerrada[/dim]")

# ==================== INTERFAZ DE USUARIO ====================
class InterfazCRUD:
    """Interfaz de consola para el sistema CRUD"""
    
    def __init__(self):
        self.sistema = SistemaCRUDClientes()
        self.console = console
    
    def iniciar(self):
        """Iniciar el sistema"""
        self.mostrar_banner()
        
        # Conectar y cargar datos
        if not self.sistema.conectar_bd():
            self.console.print("[red]No se pudo conectar a la base de datos. Saliendo...[/red]")
            return
        
        if not self.sistema.cargar_datos():
            self.console.print("[red]No se pudieron cargar los datos. Saliendo...[/red]")
            return
        
        # Menú principal
        self.menu_principal()
    
    def mostrar_banner(self):
        """Mostrar banner del sistema"""
        banner = """
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║          SISTEMA CRUD CLIENTES - ALBRU BRUNARIO CRM                   ║
║                                                                       ║
║          Gestión Completa de Clientes con Pandas                      ║
║          Sincronización automática con Frontend                       ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
        """
        self.console.print(Panel(banner, style="bold blue"))
    
    def menu_principal(self):
        """Menú principal del sistema"""
        while True:
            self.console.print("\n" + "="*70)
            self.console.print("[bold cyan]MENÚ PRINCIPAL[/bold cyan]")
            self.console.print("="*70)
            
            opciones = {
                "1": "🔍 Buscar Cliente",
                "2": "➕ Crear Nuevo Cliente",
                "3": "✏️  Editar Cliente",
                "4": "❌ Eliminar Cliente",
                "5": "📊 Exportar a Excel",
                "6": "📄 Exportar a CSV",
                "7": "🔄 Sincronizar con Frontend",
                "8": "📋 Ver Estadísticas",
                "9": "🔄 Recargar Datos",
                "0": "🚪 Salir"
            }
            
            for key, value in opciones.items():
                self.console.print(f"  [{key}] {value}")
            
            opcion = Prompt.ask("\n[bold]Seleccione una opción[/bold]", choices=list(opciones.keys()))
            
            if opcion == "1":
                self.buscar_y_mostrar()
            elif opcion == "2":
                self.crear_nuevo()
            elif opcion == "3":
                self.editar_existente()
            elif opcion == "4":
                self.eliminar_existente()
            elif opcion == "5":
                self.sistema.exportar_excel()
            elif opcion == "6":
                self.sistema.exportar_csv()
            elif opcion == "7":
                self.sistema.sincronizar_frontend()
            elif opcion == "8":
                self.mostrar_estadisticas()
            elif opcion == "9":
                self.sistema.cargar_datos()
            elif opcion == "0":
                if Confirm.ask("¿Está seguro de salir?"):
                    self.sistema.cerrar_conexion()
                    self.console.print("\n[green]¡Hasta luego![/green]\n")
                    break
    
    def buscar_y_mostrar(self):
        """Buscar y mostrar cliente"""
        termino = Prompt.ask("\n[bold]Ingrese número, DNI, ID o nombre a buscar[/bold]")
        
        resultados = self.sistema.buscar_cliente(termino)
        
        if resultados.empty:
            self.console.print("[yellow]No se encontraron resultados[/yellow]")
            return
        
        # Mostrar resultados
        if len(resultados) == 1:
            self.sistema.mostrar_cliente_completo(resultados.iloc[0]['id'])
        else:
            self.console.print(f"\n[green]Se encontraron {len(resultados)} resultados:[/green]\n")
            
            tabla = Table(title="Resultados de Búsqueda", box=box.ROUNDED)
            tabla.add_column("ID", style="cyan", width=8)
            tabla.add_column("Nombre", style="white", width=25)
            tabla.add_column("Teléfono", style="yellow", width=15)
            tabla.add_column("DNI", style="magenta", width=12)
            tabla.add_column("Campaña", style="green", width=15)
            
            for _, row in resultados.iterrows():
                tabla.add_row(
                    str(row['id']),
                    str(row['nombre'])[:25],
                    str(row['telefono']),
                    str(row['dni']) if pd.notna(row['dni']) else 'N/A',
                    str(row['campana'])[:15] if pd.notna(row['campana']) else 'N/A'
                )
            
            self.console.print(tabla)
            
            # Preguntar si quiere ver uno en detalle
            if Confirm.ask("\n¿Desea ver los detalles de algún cliente?"):
                cliente_id = Prompt.ask("Ingrese el ID del cliente")
                try:
                    self.sistema.mostrar_cliente_completo(int(cliente_id))
                except ValueError:
                    self.console.print("[red]ID inválido[/red]")
    
    def crear_nuevo(self):
        """Crear nuevo cliente"""
        self.console.print("\n[bold cyan]CREAR NUEVO CLIENTE[/bold cyan]\n")
        
        datos = {}
        datos['nombre'] = Prompt.ask("Nombre completo [bold red]*[/bold red]")
        datos['telefono'] = Prompt.ask("Teléfono [bold red]*[/bold red]")
        datos['dni'] = Prompt.ask("DNI", default="")
        datos['email'] = Prompt.ask("Email", default="")
        datos['direccion'] = Prompt.ask("Dirección", default="")
        datos['ciudad'] = Prompt.ask("Ciudad", default="")
        datos['campana'] = Prompt.ask("Campaña", default="")
        
        if Confirm.ask("\n¿Confirmar creación del cliente?"):
            exito, mensaje = self.sistema.crear_cliente(datos)
            if exito:
                self.console.print(f"\n[green]✓ {mensaje}[/green]")
            else:
                self.console.print(f"\n[red]✗ {mensaje}[/red]")
    
    def editar_existente(self):
        """Editar cliente existente"""
        cliente_id = Prompt.ask("\n[bold]Ingrese el ID del cliente a editar[/bold]")
        
        try:
            cliente_id = int(cliente_id)
        except ValueError:
            self.console.print("[red]ID inválido[/red]")
            return
        
        # Mostrar datos actuales
        self.sistema.mostrar_cliente_completo(cliente_id)
        
        if not Confirm.ask("\n¿Desea editar este cliente?"):
            return
        
        self.console.print("\n[dim]Deje en blanco los campos que no desea modificar[/dim]\n")
        
        datos = {}
        
        campo = Prompt.ask("Nombre completo", default="")
        if campo: datos['nombre'] = campo
        
        campo = Prompt.ask("Teléfono", default="")
        if campo: datos['telefono'] = campo
        
        campo = Prompt.ask("Email", default="")
        if campo: datos['email'] = campo
        
        campo = Prompt.ask("Categoría", default="")
        if campo: datos['estatus_comercial_categoria'] = campo
        
        campo = Prompt.ask("Subcategoría", default="")
        if campo: datos['estatus_comercial_subcategoria'] = campo
        
        if datos and Confirm.ask("\n¿Confirmar actualización?"):
            exito, mensaje = self.sistema.editar_cliente(cliente_id, datos)
            if exito:
                self.console.print(f"\n[green]✓ {mensaje}[/green]")
            else:
                self.console.print(f"\n[red]✗ {mensaje}[/red]")
    
    def eliminar_existente(self):
        """Eliminar cliente"""
        cliente_id = Prompt.ask("\n[bold red]Ingrese el ID del cliente a ELIMINAR[/bold red]")
        
        try:
            cliente_id = int(cliente_id)
        except ValueError:
            self.console.print("[red]ID inválido[/red]")
            return
        
        # Mostrar datos actuales
        self.sistema.mostrar_cliente_completo(cliente_id)
        
        if not Confirm.ask("\n[bold red]¿ESTÁ SEGURO de eliminar este cliente? Esta acción NO se puede deshacer[/bold red]"):
            self.console.print("[yellow]Operación cancelada[/yellow]")
            return
        
        if Confirm.ask("[bold red]¿Confirmar eliminación definitiva?[/bold red]"):
            exito, mensaje = self.sistema.eliminar_cliente(cliente_id)
            if exito:
                self.console.print(f"\n[green]✓ {mensaje}[/green]")
            else:
                self.console.print(f"\n[red]✗ {mensaje}[/red]")
    
    def mostrar_estadisticas(self):
        """Mostrar estadísticas del sistema"""
        self.console.print("\n" + "="*70)
        self.console.print("[bold cyan]ESTADÍSTICAS DEL SISTEMA[/bold cyan]")
        self.console.print("="*70 + "\n")
        
        tabla = Table(box=box.ROUNDED)
        tabla.add_column("Métrica", style="cyan", width=40)
        tabla.add_column("Valor", style="white", width=25)
        
        tabla.add_row("Total de Clientes", str(len(self.sistema.df_clientes)))
        tabla.add_row("Clientes con Wizard Completado", 
                     str(len(self.sistema.df_clientes[self.sistema.df_clientes['wizard_completado'] == 1])))
        tabla.add_row("Clientes sin Gestionar", 
                     str(len(self.sistema.df_clientes[
                         (self.sistema.df_clientes['wizard_completado'] != 1) | 
                         (self.sistema.df_clientes['wizard_completado'].isna())
                     ])))
        tabla.add_row("Total de Asesores", str(len(self.sistema.df_asesores)))
        tabla.add_row("Asesores Activos", 
                     str(len(self.sistema.df_asesores[self.sistema.df_asesores['estado'] == 'activo'])))
        tabla.add_row("Registros en Historial Estados", str(len(self.sistema.df_historial)))
        tabla.add_row("Registros en Historial Gestiones", str(len(self.sistema.df_gestiones)))
        
        self.console.print(tabla)

# ==================== PUNTO DE ENTRADA ====================
def main():
    """Función principal"""
    try:
        interfaz = InterfazCRUD()
        interfaz.iniciar()
    except KeyboardInterrupt:
        console.print("\n\n[yellow]Operación cancelada por el usuario[/yellow]\n")
    except Exception as e:
        console.print(f"\n[red]Error fatal: {e}[/red]\n")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
