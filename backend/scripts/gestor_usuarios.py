"""
Gestor de Usuarios con Interfaz Gráfica
Permite agregar usuarios individuales o desde CSV con validaciones completas

Autor: Claude AI
Fecha: 2025-11-21
"""

import pandas as pd
import mysql.connector
from mysql.connector import Error
import bcrypt
import tkinter as tk
from tkinter import filedialog, messagebox, ttk, scrolledtext
import os
from datetime import datetime
import logging
from typing import Dict, List, Tuple, Optional
from pathlib import Path
import json

# Configurar logging
log_dir = Path(__file__).parent / "logs"
log_dir.mkdir(exist_ok=True)
log_file = log_dir / f"gestor_usuarios_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class GestorUsuarios:
    """Clase para gestionar usuarios en la base de datos"""
    
    ROLES_DISPONIBLES = ['admin', 'gtr', 'asesor', 'supervisor', 'validador']
    
    PERMISOS_POR_ROL = {
        'admin': ["full_access", "manage_users", "view_all_data", "system_settings"],
        'gtr': ["view_all_clients", "assign_clients", "view_asesores", "manage_assignments"],
        'asesor': ["view_clients", "edit_clients", "create_clients", "wizard_access"],
        'supervisor': ["view_all_clients", "view_reports", "monitor_asesores", "manage_team"],
        'validador': ["view_validations", "process_validations", "approve_documents"]
    }
    
    DASHBOARD_POR_ROL = {
        'admin': '/dashboard/admin',
        'gtr': '/dashboard/gtr',
        'asesor': '/dashboard/asesor',
        'supervisor': '/dashboard/supervisor',
        'validador': '/dashboard/validaciones'
    }
    
    def __init__(self):
        """Inicializar conexión a BD"""
        self.conn = None
        self.cursor = None
        self.resultados = {
            'insertados': 0,
            'errores': 0,
            'duplicados': 0
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
    
    def generar_email(self, nombre_completo: str) -> str:
        """
        Genera email en formato: inicial_nombre + apellido_paterno + inicial_apellido_materno@albru.pe
        Ejemplo: Sebastián Antonio André Aguirre Fiestas -> saguirref@albru.pe
        """
        partes = nombre_completo.strip().split()
        
        if len(partes) < 3:
            if len(partes) == 2:
                inicial_nombre = partes[0][0].lower()
                apellido = partes[1].lower()
                email = f"{inicial_nombre}{apellido}@albru.pe"
            else:
                email = f"{partes[0].lower()}@albru.pe"
        else:
            inicial_nombre = partes[0][0].lower()
            apellido_paterno = partes[-2].lower()
            inicial_apellido_materno = partes[-1][0].lower()
            email = f"{inicial_nombre}{apellido_paterno}{inicial_apellido_materno}@albru.pe"
        
        # Normalizar caracteres especiales
        email = (email.replace('á', 'a').replace('é', 'e').replace('í', 'i')
                     .replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')
                     .replace('ü', 'u'))
        
        return email
    
    def generar_username(self, email: str) -> str:
        """Genera username desde el email (sin @albru.pe)"""
        return email.split('@')[0]
    
    def hashear_password(self, password: str) -> str:
        """Hashea la contraseña usando bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def verificar_duplicado(self, email: str = None, username: str = None, 
                           telefono: int = None) -> Dict:
        """Verificar si existe un usuario con los mismos datos"""
        try:
            condiciones = []
            valores = []
            
            if email:
                condiciones.append("email = %s")
                valores.append(email)
            if username:
                condiciones.append("username = %s")
                valores.append(username)
            if telefono:
                condiciones.append("telefono = %s")
                valores.append(telefono)
            
            if not condiciones:
                return None
            
            query = f"""
                SELECT id, nombre, email, username, tipo 
                FROM usuarios 
                WHERE {' OR '.join(condiciones)}
            """
            
            self.cursor.execute(query, valores)
            return self.cursor.fetchone()
            
        except Error as e:
            logger.error(f"❌ Error al verificar duplicado: {e}")
            return None
    
    def agregar_usuario(self, nombre: str, dni: str, rol: str, 
                       password: str = None, email_custom: str = None) -> Tuple[bool, str, Dict]:
        """
        Agregar un usuario a la BD
        
        Returns:
            Tuple[bool, str, Dict]: (éxito, mensaje, credenciales)
        """
        try:
            # Validar rol
            if rol not in self.ROLES_DISPONIBLES:
                return False, f"Rol '{rol}' no válido. Roles: {', '.join(self.ROLES_DISPONIBLES)}", {}
            
            # Generar credenciales
            email = email_custom if email_custom else self.generar_email(nombre)
            username = self.generar_username(email)
            password_plain = password if password else dni
            password_hash = self.hashear_password(password_plain)
            
            # Verificar duplicados
            duplicado = self.verificar_duplicado(email, username, int(dni) if dni.isdigit() else None)
            
            if duplicado:
                msg = (f"Usuario ya existe:\n"
                      f"ID: {duplicado['id']}\n"
                      f"Nombre: {duplicado['nombre']}\n"
                      f"Email: {duplicado['email']}\n"
                      f"Tipo: {duplicado['tipo']}")
                logger.warning(f"⏭️ {msg}")
                self.resultados['duplicados'] += 1
                return False, msg, {}
            
            # Preparar permisos y dashboard
            permisos = json.dumps(self.PERMISOS_POR_ROL.get(rol, []))
            dashboard = self.DASHBOARD_POR_ROL.get(rol, '/dashboard')
            
            # Insertar usuario
            query_usuario = """
                INSERT INTO usuarios (
                    nombre, email, username, password, telefono, tipo, estado,
                    permissions, dashboard_path, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, 'activo', %s, %s, NOW())
            """
            
            telefono_val = int(dni) if dni.isdigit() else None
            
            self.cursor.execute(query_usuario, (
                nombre, email, username, password_hash, telefono_val, rol,
                permisos, dashboard
            ))
            
            usuario_id = self.cursor.lastrowid
            
            # Si es asesor, agregar a tabla asesores
            if rol == 'asesor':
                query_asesor = """
                    INSERT INTO asesores (usuario_id, meta_mensual, comision_porcentaje, created_at)
                    VALUES (%s, 50, 5.00, NOW())
                """
                self.cursor.execute(query_asesor, (usuario_id,))
            
            self.conn.commit()
            
            credenciales = {
                'id': usuario_id,
                'nombre': nombre,
                'email': email,
                'username': username,
                'password': password_plain,
                'rol': rol,
                'dni': dni
            }
            
            logger.info(f"✅ Usuario agregado: {nombre} ({rol})")
            self.resultados['insertados'] += 1
            
            return True, "Usuario agregado exitosamente", credenciales
            
        except Error as e:
            logger.error(f"❌ Error SQL al agregar usuario: {e}")
            self.resultados['errores'] += 1
            return False, f"Error de base de datos: {str(e)}", {}
        except Exception as e:
            logger.error(f"❌ Error al agregar usuario: {e}")
            self.resultados['errores'] += 1
            return False, f"Error: {str(e)}", {}
    
    def obtener_usuarios(self, filtro_rol: str = None) -> List[Dict]:
        """Obtener lista de usuarios de la BD"""
        try:
            if filtro_rol and filtro_rol != 'Todos':
                query = """
                    SELECT id, nombre, email, username, telefono, tipo, estado, created_at
                    FROM usuarios
                    WHERE tipo = %s
                    ORDER BY created_at DESC
                """
                self.cursor.execute(query, (filtro_rol.lower(),))
            else:
                query = """
                    SELECT id, nombre, email, username, telefono, tipo, estado, created_at
                    FROM usuarios
                    ORDER BY created_at DESC
                """
                self.cursor.execute(query)
            
            return self.cursor.fetchall()
        except Error as e:
            logger.error(f"❌ Error al obtener usuarios: {e}")
            return []
    
    def importar_csv(self, archivo_path: str, callback=None) -> Dict:
        """
        Importar usuarios desde CSV
        
        CSV debe tener columnas: nombre, dni, rol, [password], [email]
        """
        try:
            # Leer CSV
            encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
            df = None
            
            for encoding in encodings:
                try:
                    df = pd.read_csv(archivo_path, sep=';', encoding=encoding)
                    logger.info(f"✅ CSV leído con encoding: {encoding}")
                    break
                except UnicodeDecodeError:
                    continue
            
            if df is None:
                raise ValueError("No se pudo leer el archivo CSV")
            
            # Validar columnas requeridas
            columnas_requeridas = ['nombre', 'dni', 'rol']
            columnas_faltantes = [col for col in columnas_requeridas if col not in df.columns]
            
            if columnas_faltantes:
                raise ValueError(f"Columnas faltantes: {', '.join(columnas_faltantes)}")
            
            logger.info(f"📊 CSV: {len(df)} usuarios a procesar")
            
            # Reset resultados
            self.resultados = {'insertados': 0, 'errores': 0, 'duplicados': 0}
            credenciales_lista = []
            
            # Procesar cada fila
            for i, (_, fila) in enumerate(df.iterrows()):
                nombre = str(fila['nombre']).strip()
                dni = str(fila['dni']).strip()
                rol = str(fila['rol']).strip().lower()
                
                # Columnas opcionales
                password = str(fila['password']).strip() if 'password' in fila and pd.notna(fila['password']) else None
                email = str(fila['email']).strip() if 'email' in fila and pd.notna(fila['email']) else None
                
                # Agregar usuario
                exito, mensaje, creds = self.agregar_usuario(nombre, dni, rol, password, email)
                
                if exito and creds:
                    credenciales_lista.append(creds)
                
                # Reportar progreso
                if callback:
                    progreso = ((i + 1) / len(df)) * 100
                    callback(progreso, i + 1, len(df))
            
            self.conn.commit()
            
            # Guardar credenciales
            if credenciales_lista:
                self.guardar_credenciales(credenciales_lista)
            
            logger.info("=" * 60)
            logger.info("📊 RESUMEN DE IMPORTACIÓN")
            logger.info("=" * 60)
            logger.info(f"✅ Insertados:  {self.resultados['insertados']}")
            logger.info(f"⏭️ Duplicados:  {self.resultados['duplicados']}")
            logger.info(f"❌ Errores:     {self.resultados['errores']}")
            logger.info("=" * 60)
            
            return self.resultados
            
        except Exception as e:
            logger.error(f"❌ Error en importación CSV: {e}")
            if self.conn:
                self.conn.rollback()
            raise
    
    def guardar_credenciales(self, credenciales_lista: List[Dict]):
        """Guardar credenciales generadas en archivo TXT"""
        try:
            output_dir = Path(__file__).parent / "credenciales"
            output_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            archivo = output_dir / f"credenciales_usuarios_{timestamp}.txt"
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write("=" * 70 + "\n")
                f.write("  CREDENCIALES DE USUARIOS GENERADOS\n")
                f.write("=" * 70 + "\n\n")
                
                for cred in credenciales_lista:
                    f.write(f"Nombre:     {cred['nombre']}\n")
                    f.write(f"Rol:        {cred['rol'].upper()}\n")
                    f.write(f"DNI:        {cred['dni']}\n")
                    f.write(f"Email:      {cred['email']}\n")
                    f.write(f"Username:   {cred['username']}\n")
                    f.write(f"Contraseña: {cred['password']}\n")
                    f.write(f"ID:         {cred['id']}\n")
                    f.write("-" * 70 + "\n\n")
                
                f.write(f"\nTotal usuarios: {len(credenciales_lista)}\n")
                f.write(f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            
            logger.info(f"📄 Credenciales guardadas en: {archivo}")
            return str(archivo)
            
        except Exception as e:
            logger.error(f"❌ Error al guardar credenciales: {e}")
            return None


class InterfazGestorUsuarios:
    """Interfaz gráfica para el gestor de usuarios"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Gestor de Usuarios - Sistema ALBRU")
        self.root.geometry("900x700")
        self.root.resizable(False, False)
        
        self.gestor = GestorUsuarios()
        self.archivo_csv = None
        
        self.crear_interfaz()
    
    def crear_interfaz(self):
        """Crear elementos de la interfaz"""
        # Notebook (pestañas)
        notebook = ttk.Notebook(self.root)
        notebook.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Pestaña 1: Agregar usuario individual
        tab_individual = tk.Frame(notebook)
        notebook.add(tab_individual, text="➕ Agregar Usuario")
        self.crear_tab_individual(tab_individual)
        
        # Pestaña 2: Importar desde CSV
        tab_importar = tk.Frame(notebook)
        notebook.add(tab_importar, text="📁 Importar CSV")
        self.crear_tab_importar(tab_importar)
        
        # Pestaña 3: Ver usuarios
        tab_ver = tk.Frame(notebook)
        notebook.add(tab_ver, text="👥 Ver Usuarios")
        self.crear_tab_ver(tab_ver)
    
    def crear_tab_individual(self, parent):
        """Crear pestaña para agregar usuario individual"""
        # Frame de configuración BD
        frame_bd = tk.LabelFrame(parent, text="🔌 Configuración Base de Datos", padx=10, pady=10)
        frame_bd.pack(padx=20, pady=10, fill="x")
        
        tk.Label(frame_bd, text="Host:").grid(row=0, column=0, sticky="w", pady=5)
        self.host_entry = tk.Entry(frame_bd, width=15)
        self.host_entry.insert(0, "localhost")
        self.host_entry.grid(row=0, column=1, pady=5, sticky="w")
        
        tk.Label(frame_bd, text="Puerto:").grid(row=0, column=2, sticky="w", pady=5, padx=(10, 0))
        self.puerto_entry = tk.Entry(frame_bd, width=8)
        self.puerto_entry.insert(0, "3308")
        self.puerto_entry.grid(row=0, column=3, pady=5, sticky="w")
        
        tk.Label(frame_bd, text="Usuario:").grid(row=0, column=4, sticky="w", pady=5, padx=(10, 0))
        self.user_entry = tk.Entry(frame_bd, width=12)
        self.user_entry.insert(0, "root")
        self.user_entry.grid(row=0, column=5, pady=5, sticky="w")
        
        tk.Label(frame_bd, text="Contraseña:").grid(row=1, column=0, sticky="w", pady=5)
        self.password_entry = tk.Entry(frame_bd, width=20, show="*")
        self.password_entry.grid(row=1, column=1, columnspan=2, pady=5, sticky="w")
        
        tk.Label(frame_bd, text="BD:").grid(row=1, column=4, sticky="w", pady=5, padx=(10, 0))
        self.db_entry = tk.Entry(frame_bd, width=12)
        self.db_entry.insert(0, "albru")
        self.db_entry.grid(row=1, column=5, pady=5, sticky="w")
        
        # Frame de datos del usuario
        frame_datos = tk.LabelFrame(parent, text="👤 Datos del Usuario", padx=10, pady=10)
        frame_datos.pack(padx=20, pady=10, fill="x")
        
        tk.Label(frame_datos, text="Nombre Completo:").grid(row=0, column=0, sticky="w", pady=5)
        self.nombre_entry = tk.Entry(frame_datos, width=50)
        self.nombre_entry.grid(row=0, column=1, columnspan=3, pady=5, sticky="w")
        
        tk.Label(frame_datos, text="DNI:").grid(row=1, column=0, sticky="w", pady=5)
        self.dni_entry = tk.Entry(frame_datos, width=20)
        self.dni_entry.grid(row=1, column=1, pady=5, sticky="w")
        
        tk.Label(frame_datos, text="Rol:").grid(row=1, column=2, sticky="w", pady=5, padx=(20, 0))
        self.rol_var = tk.StringVar(value="asesor")
        rol_combo = ttk.Combobox(frame_datos, textvariable=self.rol_var, 
                                 values=GestorUsuarios.ROLES_DISPONIBLES, 
                                 state="readonly", width=15)
        rol_combo.grid(row=1, column=3, pady=5, sticky="w")
        
        tk.Label(frame_datos, text="Email (opcional):").grid(row=2, column=0, sticky="w", pady=5)
        self.email_entry = tk.Entry(frame_datos, width=40)
        self.email_entry.grid(row=2, column=1, columnspan=3, pady=5, sticky="w")
        tk.Label(frame_datos, text="Dejar vacío para auto-generar", 
                font=("Arial", 8), fg="gray").grid(row=3, column=1, sticky="w")
        
        tk.Label(frame_datos, text="Contraseña (opcional):").grid(row=4, column=0, sticky="w", pady=5)
        self.user_password_entry = tk.Entry(frame_datos, width=20, show="*")
        self.user_password_entry.grid(row=4, column=1, pady=5, sticky="w")
        tk.Label(frame_datos, text="Dejar vacío para usar DNI", 
                font=("Arial", 8), fg="gray").grid(row=5, column=1, sticky="w")
        
        # Preview del email
        self.email_preview_label = tk.Label(frame_datos, text="", fg="blue", font=("Arial", 9))
        self.email_preview_label.grid(row=6, column=0, columnspan=4, pady=10)
        
        # Bind para preview en tiempo real
        self.nombre_entry.bind('<KeyRelease>', self.actualizar_preview_email)
        
        # Frame de resultado
        frame_resultado = tk.LabelFrame(parent, text="📋 Resultado", padx=10, pady=10)
        frame_resultado.pack(padx=20, pady=10, fill="both", expand=True)
        
        self.resultado_text = scrolledtext.ScrolledText(frame_resultado, height=8, width=80, 
                                                        font=("Consolas", 9))
        self.resultado_text.pack(fill="both", expand=True)
        
        # Frame de botones
        frame_botones = tk.Frame(parent)
        frame_botones.pack(pady=15)
        
        btn_agregar = tk.Button(
            frame_botones,
            text="➕ AGREGAR USUARIO",
            command=self.agregar_usuario_individual,
            bg="#28a745",
            fg="white",
            font=("Arial", 11, "bold"),
            padx=30,
            pady=8
        )
        btn_agregar.pack(side="left", padx=5)
        
        btn_limpiar = tk.Button(
            frame_botones,
            text="🗑️ LIMPIAR",
            command=self.limpiar_formulario,
            bg="#ffc107",
            fg="black",
            font=("Arial", 11, "bold"),
            padx=30,
            pady=8
        )
        btn_limpiar.pack(side="left", padx=5)
    
    def crear_tab_importar(self, parent):
        """Crear pestaña para importar desde CSV"""
        # Info
        info_frame = tk.LabelFrame(parent, text="ℹ️ Información", padx=10, pady=10)
        info_frame.pack(padx=20, pady=10, fill="x")
        
        info_text = (
            "El archivo CSV debe tener las siguientes columnas:\n"
            "• nombre (obligatorio) - Nombre completo del usuario\n"
            "• dni (obligatorio) - DNI del usuario\n"
            "• rol (obligatorio) - admin, gtr, asesor, supervisor, validador\n"
            "• password (opcional) - Contraseña personalizada\n"
            "• email (opcional) - Email personalizado\n\n"
            "Separador: punto y coma (;)"
        )
        
        tk.Label(info_frame, text=info_text, justify="left", fg="#555").pack()
        
        # Frame de archivo
        frame_archivo = tk.LabelFrame(parent, text="📁 Archivo CSV", padx=10, pady=10)
        frame_archivo.pack(padx=20, pady=10, fill="x")
        
        self.archivo_csv_label = tk.Label(frame_archivo, text="Ningún archivo seleccionado", fg="gray")
        self.archivo_csv_label.pack(pady=5)
        
        btn_seleccionar = tk.Button(
            frame_archivo,
            text="Seleccionar Archivo CSV",
            command=self.seleccionar_csv,
            bg="#007bff",
            fg="white",
            font=("Arial", 10, "bold"),
            padx=20,
            pady=5
        )
        btn_seleccionar.pack(pady=5)
        
        # Frame de progreso
        frame_progreso = tk.LabelFrame(parent, text="📈 Progreso", padx=10, pady=10)
        frame_progreso.pack(padx=20, pady=10, fill="x")
        
        self.progreso_csv_label = tk.Label(frame_progreso, text="Esperando archivo...", fg="gray")
        self.progreso_csv_label.pack(pady=5)
        
        self.barra_progreso_csv = ttk.Progressbar(frame_progreso, length=700, mode='determinate')
        self.barra_progreso_csv.pack(pady=5)
        
        # Log
        frame_log = tk.LabelFrame(parent, text="📋 Log", padx=10, pady=10)
        frame_log.pack(padx=20, pady=10, fill="both", expand=True)
        
        self.log_text = scrolledtext.ScrolledText(frame_log, height=10, width=90, 
                                                  font=("Consolas", 9))
        self.log_text.pack(fill="both", expand=True)
        
        # Botones
        frame_botones = tk.Frame(parent)
        frame_botones.pack(pady=15)
        
        self.btn_importar_csv = tk.Button(
            frame_botones,
            text="🚀 IMPORTAR CSV",
            command=self.importar_csv,
            bg="#28a745",
            fg="white",
            font=("Arial", 11, "bold"),
            padx=30,
            pady=8,
            state="disabled"
        )
        self.btn_importar_csv.pack(side="left", padx=5)
        
        btn_cerrar = tk.Button(
            frame_botones,
            text="❌ CERRAR",
            command=self.root.quit,
            bg="#dc3545",
            fg="white",
            font=("Arial", 11, "bold"),
            padx=30,
            pady=8
        )
        btn_cerrar.pack(side="left", padx=5)
    
    def crear_tab_ver(self, parent):
        """Crear pestaña para ver usuarios existentes"""
        # Filtros
        frame_filtro = tk.LabelFrame(parent, text="🔍 Filtros", padx=10, pady=10)
        frame_filtro.pack(padx=20, pady=10, fill="x")
        
        tk.Label(frame_filtro, text="Filtrar por rol:").pack(side="left", padx=5)
        
        self.filtro_rol_var = tk.StringVar(value="Todos")
        roles_filtro = ['Todos'] + [r.capitalize() for r in GestorUsuarios.ROLES_DISPONIBLES]
        filtro_combo = ttk.Combobox(frame_filtro, textvariable=self.filtro_rol_var,
                                    values=roles_filtro, state="readonly", width=15)
        filtro_combo.pack(side="left", padx=5)
        
        btn_cargar = tk.Button(
            frame_filtro,
            text="🔄 CARGAR USUARIOS",
            command=self.cargar_usuarios,
            bg="#007bff",
            fg="white",
            font=("Arial", 10, "bold"),
            padx=20,
            pady=5
        )
        btn_cargar.pack(side="left", padx=10)
        
        # Botones de acción
        btn_editar = tk.Button(
            frame_filtro,
            text="✏️ EDITAR",
            command=self.editar_usuario,
            bg="#ffc107",
            fg="black",
            font=("Arial", 10, "bold"),
            padx=20,
            pady=5
        )
        btn_editar.pack(side="left", padx=5)
        
        btn_eliminar = tk.Button(
            frame_filtro,
            text="🗑️ ELIMINAR",
            command=self.eliminar_usuario,
            bg="#dc3545",
            fg="white",
            font=("Arial", 10, "bold"),
            padx=20,
            pady=5
        )
        btn_eliminar.pack(side="left", padx=5)
        
        # Tabla de usuarios
        frame_tabla = tk.LabelFrame(parent, text="👥 Usuarios", padx=10, pady=10)
        frame_tabla.pack(padx=20, pady=10, fill="both", expand=True)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(frame_tabla)
        scrollbar.pack(side="right", fill="y")
        
        # Treeview
        columnas = ("ID", "Nombre", "Email", "Username", "DNI", "Rol", "Estado", "Creado")
        self.tree_usuarios = ttk.Treeview(frame_tabla, columns=columnas, show="headings",
                                         yscrollcommand=scrollbar.set, height=15)
        
        scrollbar.config(command=self.tree_usuarios.yview)
        
        # Configurar columnas
        self.tree_usuarios.heading("ID", text="ID")
        self.tree_usuarios.heading("Nombre", text="Nombre")
        self.tree_usuarios.heading("Email", text="Email")
        self.tree_usuarios.heading("Username", text="Username")
        self.tree_usuarios.heading("DNI", text="DNI")
        self.tree_usuarios.heading("Rol", text="Rol")
        self.tree_usuarios.heading("Estado", text="Estado")
        self.tree_usuarios.heading("Creado", text="Fecha Creación")
        
        self.tree_usuarios.column("ID", width=50)
        self.tree_usuarios.column("Nombre", width=200)
        self.tree_usuarios.column("Email", width=200)
        self.tree_usuarios.column("Username", width=120)
        self.tree_usuarios.column("DNI", width=80)
        self.tree_usuarios.column("Rol", width=100)
        self.tree_usuarios.column("Estado", width=80)
        self.tree_usuarios.column("Creado", width=130)
        
        self.tree_usuarios.pack(fill="both", expand=True)
        
        # Label de total
        self.total_usuarios_label = tk.Label(parent, text="Total: 0 usuarios", 
                                            font=("Arial", 10, "bold"))
        self.total_usuarios_label.pack(pady=5)
    
    def actualizar_preview_email(self, event=None):
        """Actualizar preview del email en tiempo real"""
        nombre = self.nombre_entry.get().strip()
        if nombre:
            email_preview = self.gestor.generar_email(nombre)
            username_preview = self.gestor.generar_username(email_preview)
            self.email_preview_label.config(
                text=f"📧 Email: {email_preview} | Username: {username_preview}"
            )
        else:
            self.email_preview_label.config(text="")
    
    def limpiar_formulario(self):
        """Limpiar todos los campos del formulario"""
        self.nombre_entry.delete(0, tk.END)
        self.dni_entry.delete(0, tk.END)
        self.email_entry.delete(0, tk.END)
        self.user_password_entry.delete(0, tk.END)
        self.rol_var.set("asesor")
        self.email_preview_label.config(text="")
        self.resultado_text.delete(1.0, tk.END)
    
    def agregar_usuario_individual(self):
        """Agregar un usuario individual desde el formulario"""
        # Obtener datos
        nombre = self.nombre_entry.get().strip()
        dni = self.dni_entry.get().strip()
        rol = self.rol_var.get()
        email_custom = self.email_entry.get().strip() or None
        password = self.user_password_entry.get().strip() or None
        
        # Validar
        if not nombre or not dni:
            messagebox.showwarning("Datos Incompletos", 
                                 "Por favor ingresa el nombre y DNI del usuario")
            return
        
        # Obtener config BD
        host = self.host_entry.get()
        puerto = int(self.puerto_entry.get())
        usuario = self.user_entry.get()
        password_bd = self.password_entry.get()
        database = self.db_entry.get()
        
        try:
            # Conectar
            if not self.gestor.conectar_bd(host, puerto, usuario, password_bd, database):
                return
            
            # Agregar usuario
            exito, mensaje, credenciales = self.gestor.agregar_usuario(
                nombre, dni, rol, password, email_custom
            )
            
            # Mostrar resultado
            self.resultado_text.delete(1.0, tk.END)
            
            if exito:
                resultado = (
                    f"✅ USUARIO AGREGADO EXITOSAMENTE\n\n"
                    f"{'='*60}\n"
                    f"ID:         {credenciales['id']}\n"
                    f"Nombre:     {credenciales['nombre']}\n"
                    f"Rol:        {credenciales['rol'].upper()}\n"
                    f"DNI:        {credenciales['dni']}\n"
                    f"Email:      {credenciales['email']}\n"
                    f"Username:   {credenciales['username']}\n"
                    f"Contraseña: {credenciales['password']}\n"
                    f"{'='*60}\n\n"
                    f"⚠️ IMPORTANTE: Guarda estas credenciales\n"
                )
                
                self.resultado_text.insert(1.0, resultado)
                self.resultado_text.tag_add("success", 1.0, 2.0)
                self.resultado_text.tag_config("success", foreground="green", font=("Arial", 10, "bold"))
                
                messagebox.showinfo("Éxito", "Usuario agregado correctamente")
                
                # Guardar credenciales
                archivo_creds = self.gestor.guardar_credenciales([credenciales])
                if archivo_creds:
                    self.resultado_text.insert(tk.END, f"\n📄 Credenciales guardadas en:\n{archivo_creds}")
                
            else:
                self.resultado_text.insert(1.0, f"❌ ERROR\n\n{mensaje}")
                messagebox.showerror("Error", mensaje)
        
        except Exception as e:
            messagebox.showerror("Error", f"Error al agregar usuario:\n{str(e)}")
        
        finally:
            self.gestor.desconectar_bd()
    
    def seleccionar_csv(self):
        """Seleccionar archivo CSV"""
        archivo = filedialog.askopenfilename(
            title="Seleccionar CSV de usuarios",
            filetypes=[("Archivos CSV", "*.csv"), ("Todos", "*.*")]
        )
        
        if archivo:
            self.archivo_csv = archivo
            nombre_archivo = os.path.basename(archivo)
            self.archivo_csv_label.config(text=f"✅ {nombre_archivo}", fg="green")
            self.btn_importar_csv.config(state="normal")
    
    def actualizar_progreso_csv(self, porcentaje: float, actual: int, total: int):
        """Actualizar barra de progreso de CSV"""
        self.barra_progreso_csv['value'] = porcentaje
        self.progreso_csv_label.config(
            text=f"Procesando: {actual}/{total} ({porcentaje:.1f}%)",
            fg="blue"
        )
        self.root.update_idletasks()
    
    def importar_csv(self):
        """Importar usuarios desde CSV"""
        if not self.archivo_csv:
            messagebox.showwarning("Advertencia", "Selecciona un archivo CSV primero")
            return
        
        # Config BD
        host = self.host_entry.get()
        puerto = int(self.puerto_entry.get())
        usuario = self.user_entry.get()
        password = self.password_entry.get()
        database = self.db_entry.get()
        
        # Confirmar
        respuesta = messagebox.askyesno(
            "Confirmar Importación",
            f"¿Importar usuarios desde CSV a '{database}'?\n\n"
            f"Archivo: {os.path.basename(self.archivo_csv)}"
        )
        
        if not respuesta:
            return
        
        self.btn_importar_csv.config(state="disabled")
        self.barra_progreso_csv['value'] = 0
        self.log_text.delete(1.0, tk.END)
        
        try:
            # Conectar
            if not self.gestor.conectar_bd(host, puerto, usuario, password, database):
                return
            
            # Importar
            resultados = self.gestor.importar_csv(
                self.archivo_csv,
                callback=self.actualizar_progreso_csv
            )
            
            # Mostrar resultado
            mensaje_log = (
                f"\n{'='*70}\n"
                f"  IMPORTACIÓN COMPLETADA\n"
                f"{'='*70}\n\n"
                f"✅ Insertados:  {resultados['insertados']}\n"
                f"⏭️ Duplicados:  {resultados['duplicados']}\n"
                f"❌ Errores:     {resultados['errores']}\n\n"
                f"📄 Log completo: {log_file}\n"
                f"{'='*70}\n"
            )
            
            self.log_text.insert(tk.END, mensaje_log)
            
            messagebox.showinfo(
                "Importación Completada",
                f"Insertados: {resultados['insertados']}\n"
                f"Duplicados: {resultados['duplicados']}\n"
                f"Errores: {resultados['errores']}"
            )
            
            self.progreso_csv_label.config(text="✅ Importación completada", fg="green")
        
        except Exception as e:
            messagebox.showerror("Error", f"Error en importación:\n{str(e)}")
            self.log_text.insert(tk.END, f"\n❌ ERROR: {str(e)}")
            self.progreso_csv_label.config(text="❌ Error en importación", fg="red")
        
        finally:
            self.gestor.desconectar_bd()
            self.btn_importar_csv.config(state="normal")
    
    def cargar_usuarios(self):
        """Cargar usuarios desde la BD"""
        # Config BD
        host = self.host_entry.get()
        puerto = int(self.puerto_entry.get())
        usuario = self.user_entry.get()
        password = self.password_entry.get()
        database = self.db_entry.get()
        
        try:
            # Conectar
            if not self.gestor.conectar_bd(host, puerto, usuario, password, database):
                return
            
            # Obtener filtro
            filtro = self.filtro_rol_var.get()
            
            # Obtener usuarios
            usuarios = self.gestor.obtener_usuarios(filtro)
            
            # Limpiar tabla
            for item in self.tree_usuarios.get_children():
                self.tree_usuarios.delete(item)
            
            # Llenar tabla
            for usuario in usuarios:
                created = usuario['created_at'].strftime('%Y-%m-%d %H:%M') if usuario['created_at'] else ''
                
                self.tree_usuarios.insert('', 'end', values=(
                    usuario['id'],
                    usuario['nombre'],
                    usuario['email'],
                    usuario['username'],
                    usuario['telefono'] or '',
                    usuario['tipo'].upper(),
                    usuario['estado'].upper(),
                    created
                ))
            
            self.total_usuarios_label.config(text=f"Total: {len(usuarios)} usuarios")
            
        except Exception as e:
            messagebox.showerror("Error", f"Error al cargar usuarios:\n{str(e)}")
        
        finally:
            self.gestor.desconectar_bd()
    
    def editar_usuario(self):
        """Editar usuario seleccionado"""
        seleccion = self.tree_usuarios.selection()
        
        if not seleccion:
            messagebox.showwarning("Selección", "Por favor selecciona un usuario de la tabla")
            return
        
        # Obtener datos del usuario seleccionado
        item = self.tree_usuarios.item(seleccion[0])
        valores = item['values']
        
        usuario_id = valores[0]
        nombre_actual = valores[1]
        email_actual = valores[2]
        username_actual = valores[3]
        dni_actual = valores[4]
        rol_actual = valores[5].lower()
        estado_actual = valores[6].lower()
        
        # Crear ventana de edición
        ventana_editar = tk.Toplevel(self.root)
        ventana_editar.title(f"Editar Usuario - ID {usuario_id}")
        ventana_editar.geometry("500x450")
        ventana_editar.resizable(False, False)
        
        # Frame principal
        frame_edit = tk.LabelFrame(ventana_editar, text=f"📝 Editar: {nombre_actual}", 
                                   padx=20, pady=20)
        frame_edit.pack(padx=20, pady=20, fill="both", expand=True)
        
        # Campos
        tk.Label(frame_edit, text="Nombre:").grid(row=0, column=0, sticky="w", pady=8)
        entry_nombre = tk.Entry(frame_edit, width=40)
        entry_nombre.insert(0, nombre_actual)
        entry_nombre.grid(row=0, column=1, pady=8)
        
        tk.Label(frame_edit, text="Email:").grid(row=1, column=0, sticky="w", pady=8)
        entry_email = tk.Entry(frame_edit, width=40)
        entry_email.insert(0, email_actual)
        entry_email.grid(row=1, column=1, pady=8)
        
        tk.Label(frame_edit, text="Username:").grid(row=2, column=0, sticky="w", pady=8)
        entry_username = tk.Entry(frame_edit, width=40)
        entry_username.insert(0, username_actual)
        entry_username.grid(row=2, column=1, pady=8)
        
        tk.Label(frame_edit, text="DNI:").grid(row=3, column=0, sticky="w", pady=8)
        entry_dni = tk.Entry(frame_edit, width=40)
        entry_dni.insert(0, dni_actual)
        entry_dni.grid(row=3, column=1, pady=8)
        
        tk.Label(frame_edit, text="Rol:").grid(row=4, column=0, sticky="w", pady=8)
        var_rol = tk.StringVar(value=rol_actual)
        combo_rol = ttk.Combobox(frame_edit, textvariable=var_rol,
                                values=GestorUsuarios.ROLES_DISPONIBLES,
                                state="readonly", width=37)
        combo_rol.grid(row=4, column=1, pady=8)
        
        tk.Label(frame_edit, text="Estado:").grid(row=5, column=0, sticky="w", pady=8)
        var_estado = tk.StringVar(value=estado_actual)
        combo_estado = ttk.Combobox(frame_edit, textvariable=var_estado,
                                   values=['activo', 'inactivo', 'suspendido'],
                                   state="readonly", width=37)
        combo_estado.grid(row=5, column=1, pady=8)
        
        tk.Label(frame_edit, text="Nueva Contraseña:", fg="gray").grid(row=6, column=0, sticky="w", pady=8)
        entry_password = tk.Entry(frame_edit, width=40, show="*")
        entry_password.grid(row=6, column=1, pady=8)
        tk.Label(frame_edit, text="(Dejar vacío para no cambiar)", 
                font=("Arial", 8), fg="gray").grid(row=7, column=1, sticky="w")
        
        # Función para guardar cambios
        def guardar_cambios():
            nombre_nuevo = entry_nombre.get().strip()
            email_nuevo = entry_email.get().strip()
            username_nuevo = entry_username.get().strip()
            dni_nuevo = entry_dni.get().strip()
            rol_nuevo = var_rol.get()
            estado_nuevo = var_estado.get()
            password_nueva = entry_password.get().strip()
            
            if not nombre_nuevo or not email_nuevo or not username_nuevo:
                messagebox.showwarning("Datos Incompletos", 
                                     "Nombre, email y username son obligatorios")
                return
            
            # Confirmar
            respuesta = messagebox.askyesno(
                "Confirmar Cambios",
                f"¿Actualizar usuario {nombre_actual}?"
            )
            
            if not respuesta:
                return
            
            # Conectar y actualizar
            host = self.host_entry.get()
            puerto = int(self.puerto_entry.get())
            usuario = self.user_entry.get()
            password = self.password_entry.get()
            database = self.db_entry.get()
            
            try:
                if not self.gestor.conectar_bd(host, puerto, usuario, password, database):
                    return
                
                # Construir UPDATE
                updates = []
                valores = []
                
                updates.append("nombre = %s")
                valores.append(nombre_nuevo)
                
                updates.append("email = %s")
                valores.append(email_nuevo)
                
                updates.append("username = %s")
                valores.append(username_nuevo)
                
                if dni_nuevo.isdigit():
                    updates.append("telefono = %s")
                    valores.append(int(dni_nuevo))
                
                updates.append("tipo = %s")
                valores.append(rol_nuevo)
                
                updates.append("estado = %s")
                valores.append(estado_nuevo)
                
                # Actualizar permisos y dashboard según rol
                permisos = json.dumps(GestorUsuarios.PERMISOS_POR_ROL.get(rol_nuevo, []))
                dashboard = GestorUsuarios.DASHBOARD_POR_ROL.get(rol_nuevo, '/dashboard')
                updates.append("permissions = %s")
                valores.append(permisos)
                updates.append("dashboard_path = %s")
                valores.append(dashboard)
                
                if password_nueva:
                    password_hash = self.gestor.hashear_password(password_nueva)
                    updates.append("password = %s")
                    valores.append(password_hash)
                
                valores.append(usuario_id)
                
                query = f"""
                    UPDATE usuarios 
                    SET {', '.join(updates)}, updated_at = NOW()
                    WHERE id = %s
                """
                
                self.gestor.cursor.execute(query, valores)
                self.gestor.conn.commit()
                
                messagebox.showinfo("Éxito", "Usuario actualizado correctamente")
                ventana_editar.destroy()
                self.cargar_usuarios()
                
            except Error as e:
                messagebox.showerror("Error", f"Error al actualizar:\n{str(e)}")
            finally:
                self.gestor.desconectar_bd()
        
        # Botones
        frame_botones = tk.Frame(ventana_editar)
        frame_botones.pack(pady=10)
        
        btn_guardar = tk.Button(
            frame_botones,
            text="💾 GUARDAR",
            command=guardar_cambios,
            bg="#28a745",
            fg="white",
            font=("Arial", 10, "bold"),
            padx=30,
            pady=8
        )
        btn_guardar.pack(side="left", padx=5)
        
        btn_cancelar = tk.Button(
            frame_botones,
            text="❌ CANCELAR",
            command=ventana_editar.destroy,
            bg="#6c757d",
            fg="white",
            font=("Arial", 10, "bold"),
            padx=30,
            pady=8
        )
        btn_cancelar.pack(side="left", padx=5)
    
    def eliminar_usuario(self):
        """Eliminar usuario seleccionado"""
        seleccion = self.tree_usuarios.selection()
        
        if not seleccion:
            messagebox.showwarning("Selección", "Por favor selecciona un usuario de la tabla")
            return
        
        # Obtener datos del usuario
        item = self.tree_usuarios.item(seleccion[0])
        valores = item['values']
        
        usuario_id = valores[0]
        nombre = valores[1]
        email = valores[2]
        rol = valores[5]
        
        # Confirmar eliminación
        respuesta = messagebox.askyesno(
            "⚠️ CONFIRMAR ELIMINACIÓN",
            f"¿Estás seguro de eliminar este usuario?\n\n"
            f"ID: {usuario_id}\n"
            f"Nombre: {nombre}\n"
            f"Email: {email}\n"
            f"Rol: {rol}\n\n"
            f"⚠️ Esta acción NO se puede deshacer.\n"
            f"Se eliminarán también sus registros relacionados.",
            icon='warning'
        )
        
        if not respuesta:
            return
        
        # Conectar y eliminar
        host = self.host_entry.get()
        puerto = int(self.puerto_entry.get())
        usuario = self.user_entry.get()
        password = self.password_entry.get()
        database = self.db_entry.get()
        
        try:
            if not self.gestor.conectar_bd(host, puerto, usuario, password, database):
                return
            
            # Eliminar (las FK con CASCADE se encargan de los registros relacionados)
            query = "DELETE FROM usuarios WHERE id = %s"
            self.gestor.cursor.execute(query, (usuario_id,))
            self.gestor.conn.commit()
            
            messagebox.showinfo("Éxito", f"Usuario {nombre} eliminado correctamente")
            self.cargar_usuarios()
            
        except Error as e:
            messagebox.showerror("Error", f"Error al eliminar usuario:\n{str(e)}")
        finally:
            self.gestor.desconectar_bd()
    
    def ejecutar(self):
        """Ejecutar la aplicación"""
        self.root.mainloop()


if __name__ == "__main__":
    app = InterfazGestorUsuarios()
    app.ejecutar()
