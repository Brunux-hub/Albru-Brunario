"""
Script para importar historial de gestiones desde archivo CSV a MySQL
Con interfaz gráfica usando tkinter

Autor: Claude AI
Fecha: 2025-11-21
"""

import pandas as pd
import mysql.connector
from mysql.connector import Error
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import os
from datetime import datetime
import logging
from typing import Dict, List, Tuple
from pathlib import Path

# Configurar logging
log_dir = Path(__file__).parent / "logs"
log_dir.mkdir(exist_ok=True)
log_file = log_dir / f"import_historial_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class ImportadorHistorial:
    """Clase para importar CSVs de historial de gestiones a MySQL"""
    
    # Mapeo de columnas CSV a columnas de BD
    COLUMNAS_REQUERIDAS = ['cliente_id', 'usuario_id', 'accion']
    
    COLUMNAS_FECHA = ['created_at']
    
    def __init__(self):
        """Inicializar conexión a BD"""
        self.conn = None
        self.cursor = None
        self.resultados = {
            'insertados': 0,
            'errores': 0,
            'omitidos': 0
        }
        
    def conectar_bd(self, host='localhost', port=3308, user='root', 
                    password='', database='albru'):
        """Conectar a la base de datos MySQL"""
        try:
            self.conn = mysql.connector.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                database=database,
                charset='utf8mb4',
                use_unicode=True
            )
            self.cursor = self.conn.cursor(dictionary=True)
            logger.info(f"✅ Conectado a BD: {database} en {host}:{port}")
            return True
        except Error as e:
            logger.error(f"❌ Error al conectar a BD: {e}")
            messagebox.showerror("Error de Conexión", 
                               f"No se pudo conectar a la base de datos:\n{str(e)}")
            return False
    
    def desconectar_bd(self):
        """Cerrar conexión a BD"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("🔌 Desconectado de BD")
    
    def leer_archivo(self, archivo_path: str, separador: str = ';') -> pd.DataFrame:
        """Leer archivo CSV o XLSX con pandas"""
        try:
            # Detectar extensión del archivo
            extension = archivo_path.lower().split('.')[-1]
            
            if extension == 'xlsx' or extension == 'xls':
                # Leer Excel
                df = pd.read_excel(archivo_path, engine='openpyxl')
                logger.info(f"✅ Excel leído correctamente")
            else:
                # Leer CSV con diferentes encodings
                encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
                df = None
                
                for encoding in encodings:
                    try:
                        df = pd.read_csv(archivo_path, sep=separador, encoding=encoding)
                        logger.info(f"✅ CSV leído con encoding: {encoding}")
                        break
                    except UnicodeDecodeError:
                        continue
                
                if df is None:
                    raise ValueError("No se pudo leer el archivo con ningún encoding conocido")
            
            logger.info(f"📊 Archivo cargado: {len(df)} filas, {len(df.columns)} columnas")
            logger.info(f"📋 Columnas encontradas: {', '.join(df.columns.tolist())}")
            
            # Validar columnas requeridas
            columnas_faltantes = [col for col in self.COLUMNAS_REQUERIDAS 
                                 if col not in df.columns]
            if columnas_faltantes:
                raise ValueError(f"Columnas requeridas faltantes: {', '.join(columnas_faltantes)}")
            
            return df
        
        except Exception as e:
            logger.error(f"❌ Error al leer archivo: {e}")
            raise
    
    def limpiar_valor(self, valor, tipo_columna: str = 'texto'):
        """Limpiar y convertir valores según el tipo de columna"""
        # Manejar valores nulos/vacíos
        if pd.isna(valor) or valor == '' or valor == 'NULL' or valor is None:
            return None
        
        # Convertir a string y limpiar espacios
        valor_str = str(valor).strip()
        
        if tipo_columna == 'fecha':
            return self.convertir_fecha(valor_str)
        else:
            # Texto: reemplazar valores vacíos por None
            return valor_str if valor_str and valor_str.upper() != 'NULL' else None
    
    def convertir_fecha(self, fecha_str: str):
        """Convertir string de fecha a formato MySQL (YYYY-MM-DD HH:MM:SS)"""
        if not fecha_str or fecha_str.upper() == 'NULL':
            return None
        
        # Formatos comunes de fecha
        formatos = [
            '%Y/%m/%d',           # 2025/01/15
            '%Y-%m-%d',           # 2025-01-15
            '%d/%m/%Y',           # 15/01/2025
            '%d-%m-%Y',           # 15-01-2025
            '%Y/%m/%d %H:%M:%S',  # 2025/01/15 14:30:00
            '%Y-%m-%d %H:%M:%S',  # 2025-01-15 14:30:00
        ]
        
        for formato in formatos:
            try:
                dt = datetime.strptime(fecha_str, formato)
                return dt.strftime('%Y-%m-%d %H:%M:%S')
            except ValueError:
                continue
        
        logger.warning(f"⚠️ No se pudo convertir fecha: {fecha_str}")
        return None
    
    def verificar_cliente_existe(self, cliente_id: int) -> bool:
        """Verificar si existe el cliente en la tabla clientes"""
        try:
            query = "SELECT id FROM clientes WHERE id = %s LIMIT 1"
            self.cursor.execute(query, (cliente_id,))
            resultado = self.cursor.fetchone()
            return resultado is not None
        except Error as e:
            logger.error(f"❌ Error al verificar cliente: {e}")
            return False
    
    def verificar_usuario_existe(self, usuario_id: int) -> bool:
        """Verificar si existe el usuario en la tabla usuarios"""
        try:
            query = "SELECT id FROM usuarios WHERE id = %s LIMIT 1"
            self.cursor.execute(query, (usuario_id,))
            resultado = self.cursor.fetchone()
            return resultado is not None
        except Error as e:
            logger.error(f"❌ Error al verificar usuario: {e}")
            return False
    
    def procesar_fila(self, fila: pd.Series, indice: int) -> bool:
        """Procesar una fila del CSV e insertar en historial_cliente"""
        try:
            # Extraer datos y limpiar
            datos = {}
            
            for columna in fila.index:
                valor = fila[columna]
                
                # Determinar tipo de columna
                if columna in self.COLUMNAS_FECHA:
                    tipo = 'fecha'
                else:
                    tipo = 'texto'
                
                # Limpiar valor
                valor_limpio = self.limpiar_valor(valor, tipo)
                
                # Agregar a datos
                if valor_limpio is not None or columna in self.COLUMNAS_REQUERIDAS:
                    datos[columna] = valor_limpio
            
            # Validar campos requeridos
            if not all(datos.get(col) for col in self.COLUMNAS_REQUERIDAS):
                logger.warning(f"⚠️ Fila {indice + 2}: Faltan campos requeridos, omitida")
                self.resultados['omitidos'] += 1
                return False
            
            cliente_id = int(datos['cliente_id'])
            usuario_id = int(datos['usuario_id'])
            
            # Verificar que cliente y usuario existan
            if not self.verificar_cliente_existe(cliente_id):
                logger.warning(f"⚠️ Fila {indice + 2}: Cliente ID {cliente_id} no existe, omitida")
                self.resultados['omitidos'] += 1
                return False
            
            if not self.verificar_usuario_existe(usuario_id):
                logger.warning(f"⚠️ Fila {indice + 2}: Usuario ID {usuario_id} no existe, omitida")
                self.resultados['omitidos'] += 1
                return False
            
            # Construir INSERT
            columnas = list(datos.keys())
            valores = list(datos.values())
            placeholders = ', '.join(['%s'] * len(columnas))
            
            query = f"""
                INSERT INTO historial_cliente ({', '.join(columnas)})
                VALUES ({placeholders})
            """
            
            self.cursor.execute(query, valores)
            self.resultados['insertados'] += 1
            logger.info(f"✅ Fila {indice + 2}: Gestión insertada (cliente: {cliente_id})")
            
            return True
            
        except Error as e:
            logger.error(f"❌ Fila {indice + 2}: Error SQL - {e}")
            self.resultados['errores'] += 1
            return False
        except Exception as e:
            logger.error(f"❌ Fila {indice + 2}: Error - {e}")
            self.resultados['errores'] += 1
            return False
    
    def importar_csv(self, archivo_path: str, lote_size: int = 100, 
                     callback=None) -> Dict:
        """
        Importar CSV completo a la BD
        
        Args:
            archivo_path: Ruta del archivo CSV
            lote_size: Tamaño de lote para commit
            callback: Función para reportar progreso
        
        Returns:
            Dict con resultados del proceso
        """
        try:
            # Leer archivo (CSV o XLSX)
            df = self.leer_archivo(archivo_path)
            total_filas = len(df)
            
            logger.info(f"🚀 Iniciando importación: {total_filas} filas")
            
            # Reset resultados
            self.resultados = {
                'insertados': 0,
                'errores': 0,
                'omitidos': 0
            }
            
            # Procesar filas en lotes
            for i, (indice, fila) in enumerate(df.iterrows()):
                # Procesar fila
                self.procesar_fila(fila, indice)
                
                # Commit cada lote
                if (i + 1) % lote_size == 0:
                    self.conn.commit()
                    logger.info(f"💾 Commit de lote: {i + 1}/{total_filas}")
                
                # Reportar progreso
                if callback:
                    progreso = ((i + 1) / total_filas) * 100
                    callback(progreso, i + 1, total_filas)
            
            # Commit final
            self.conn.commit()
            logger.info(f"💾 Commit final")
            
            # Resumen
            logger.info("=" * 60)
            logger.info("📊 RESUMEN DE IMPORTACIÓN")
            logger.info("=" * 60)
            logger.info(f"✅ Insertados: {self.resultados['insertados']}")
            logger.info(f"⏭️ Omitidos:   {self.resultados['omitidos']}")
            logger.info(f"❌ Errores:    {self.resultados['errores']}")
            logger.info(f"📁 Total:      {total_filas}")
            logger.info("=" * 60)
            
            return self.resultados
            
        except Exception as e:
            logger.error(f"❌ Error fatal en importación: {e}")
            if self.conn:
                self.conn.rollback()
            raise


class InterfazImportador:
    """Interfaz gráfica para el importador de historial"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Importador de Historial de Gestiones CSV → MySQL")
        self.root.geometry("700x500")
        self.root.resizable(False, False)
        
        self.importador = ImportadorHistorial()
        self.archivo_seleccionado = None
        
        self.crear_interfaz()
    
    def crear_interfaz(self):
        """Crear elementos de la interfaz"""
        # Título
        titulo = tk.Label(
            self.root, 
            text="📝 Importador de Historial de Gestiones", 
            font=("Arial", 16, "bold"),
            pady=10
        )
        titulo.pack()
        
        # Frame de configuración de BD
        frame_bd = tk.LabelFrame(self.root, text="🔌 Configuración Base de Datos", padx=10, pady=10)
        frame_bd.pack(padx=20, pady=10, fill="x")
        
        # Campos de conexión
        tk.Label(frame_bd, text="Host:").grid(row=0, column=0, sticky="w", pady=5)
        self.host_entry = tk.Entry(frame_bd, width=20)
        self.host_entry.insert(0, "localhost")
        self.host_entry.grid(row=0, column=1, pady=5, sticky="w")
        
        tk.Label(frame_bd, text="Puerto:").grid(row=0, column=2, sticky="w", pady=5, padx=(20, 0))
        self.puerto_entry = tk.Entry(frame_bd, width=10)
        self.puerto_entry.insert(0, "3308")
        self.puerto_entry.grid(row=0, column=3, pady=5, sticky="w")
        
        tk.Label(frame_bd, text="Usuario:").grid(row=1, column=0, sticky="w", pady=5)
        self.user_entry = tk.Entry(frame_bd, width=20)
        self.user_entry.insert(0, "root")
        self.user_entry.grid(row=1, column=1, pady=5, sticky="w")
        
        tk.Label(frame_bd, text="Contraseña:").grid(row=1, column=2, sticky="w", pady=5, padx=(20, 0))
        self.password_entry = tk.Entry(frame_bd, width=20, show="*")
        self.password_entry.grid(row=1, column=3, pady=5, sticky="w")
        
        tk.Label(frame_bd, text="Base de Datos:").grid(row=2, column=0, sticky="w", pady=5)
        self.db_entry = tk.Entry(frame_bd, width=20)
        self.db_entry.insert(0, "albru")
        self.db_entry.grid(row=2, column=1, pady=5, sticky="w")
        
        # Frame de archivo
        frame_archivo = tk.LabelFrame(self.root, text="📁 Archivo CSV", padx=10, pady=10)
        frame_archivo.pack(padx=20, pady=10, fill="x")
        
        self.archivo_label = tk.Label(frame_archivo, text="Ningún archivo seleccionado", fg="gray")
        self.archivo_label.pack(pady=5)
        
        btn_seleccionar = tk.Button(
            frame_archivo, 
            text="Seleccionar Archivo (CSV/XLSX)", 
            command=self.seleccionar_archivo,
            bg="#007bff",
            fg="white",
            font=("Arial", 10, "bold"),
            padx=20,
            pady=5
        )
        btn_seleccionar.pack(pady=5)
        
        # Info
        info_label = tk.Label(
            frame_archivo,
            text="⚠️ El CSV debe tener: cliente_id, usuario_id, accion, descripcion, etc.",
            font=("Arial", 8),
            fg="gray"
        )
        info_label.pack(pady=5)
        
        # Frame de progreso
        frame_progreso = tk.LabelFrame(self.root, text="📈 Progreso", padx=10, pady=10)
        frame_progreso.pack(padx=20, pady=10, fill="x")
        
        self.progreso_label = tk.Label(frame_progreso, text="Esperando archivo...", fg="gray")
        self.progreso_label.pack(pady=5)
        
        self.barra_progreso = ttk.Progressbar(
            frame_progreso, 
            length=600, 
            mode='determinate'
        )
        self.barra_progreso.pack(pady=5)
        
        # Frame de botones
        frame_botones = tk.Frame(self.root)
        frame_botones.pack(pady=15)
        
        # Botón importar
        self.btn_importar = tk.Button(
            frame_botones, 
            text="🚀 IMPORTAR",
            command=self.iniciar_importacion,
            bg="#28a745",
            fg="white",
            font=("Arial", 12, "bold"),
            padx=40,
            pady=10,
            state="disabled"
        )
        self.btn_importar.pack(side="left", padx=5)
        
        # Botón cerrar
        btn_cerrar = tk.Button(
            frame_botones, 
            text="❌ CERRAR",
            command=self.root.quit,
            bg="#dc3545",
            fg="white",
            font=("Arial", 12, "bold"),
            padx=40,
            pady=10
        )
        btn_cerrar.pack(side="left", padx=5)
    
    def seleccionar_archivo(self):
        """Abrir diálogo para seleccionar archivo CSV o XLSX"""
        archivo = filedialog.askopenfilename(
            title="Seleccionar archivo CSV o Excel",
            filetypes=[
                ("Archivos soportados", "*.csv;*.xlsx;*.xls"),
                ("Archivos CSV", "*.csv"),
                ("Archivos Excel", "*.xlsx;*.xls"),
                ("Todos los archivos", "*.*")
            ]
        )
        
        if archivo:
            self.archivo_seleccionado = archivo
            nombre_archivo = os.path.basename(archivo)
            self.archivo_label.config(text=f"✅ {nombre_archivo}", fg="green")
            self.btn_importar.config(state="normal")
            logger.info(f"📁 Archivo seleccionado: {archivo}")
    
    def actualizar_progreso(self, porcentaje: float, actual: int, total: int):
        """Actualizar barra de progreso"""
        self.barra_progreso['value'] = porcentaje
        self.progreso_label.config(
            text=f"Procesando: {actual}/{total} ({porcentaje:.1f}%)",
            fg="blue"
        )
        self.root.update_idletasks()
    
    def iniciar_importacion(self):
        """Iniciar proceso de importación"""
        if not self.archivo_seleccionado:
            messagebox.showwarning("Advertencia", "Selecciona un archivo CSV primero")
            return
        
        # Obtener configuración
        host = self.host_entry.get()
        puerto = int(self.puerto_entry.get())
        usuario = self.user_entry.get()
        password = self.password_entry.get()
        database = self.db_entry.get()
        
        # Confirmar
        respuesta = messagebox.askyesno(
            "Confirmar Importación",
            f"¿Importar historial de gestiones a '{database}'?\n\n"
            f"Host: {host}:{puerto}\n"
            f"Archivo: {os.path.basename(self.archivo_seleccionado)}\n\n"
            f"⚠️ Se insertarán todos los registros del CSV"
        )
        
        if not respuesta:
            return
        
        # Deshabilitar botón
        self.btn_importar.config(state="disabled")
        self.barra_progreso['value'] = 0
        
        try:
            # Conectar a BD
            if not self.importador.conectar_bd(host, puerto, usuario, password, database):
                return
            
            # Importar
            resultados = self.importador.importar_csv(
                self.archivo_seleccionado,
                callback=self.actualizar_progreso
            )
            
            # Mostrar resultado
            mensaje = (
                f"✅ Importación completada\n\n"
                f"Insertados: {resultados['insertados']}\n"
                f"Omitidos:   {resultados['omitidos']}\n"
                f"Errores:    {resultados['errores']}\n\n"
                f"Log guardado en:\n{log_file}"
            )
            
            messagebox.showinfo("Importación Completada", mensaje)
            
            self.progreso_label.config(text="✅ Importación completada", fg="green")
            
        except Exception as e:
            messagebox.showerror("Error", f"Error durante la importación:\n{str(e)}")
            self.progreso_label.config(text="❌ Error en importación", fg="red")
            logger.error(f"❌ Error: {e}")
        
        finally:
            # Desconectar y rehabilitar botón
            self.importador.desconectar_bd()
            self.btn_importar.config(state="normal")
    
    def ejecutar(self):
        """Ejecutar la aplicación"""
        self.root.mainloop()


if __name__ == "__main__":
    app = InterfazImportador()
    app.ejecutar()
