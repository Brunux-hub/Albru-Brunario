import pandas as pd
import mysql.connector
from datetime import datetime
import os

class ReemplazadorTablas:
    def __init__(self):
        self.conn = None
        self.cursor = None
        self.log_file = f"logs/reemplazo_completo_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        os.makedirs('logs', exist_ok=True)
        
    def log(self, mensaje):
        """Escribir en log y consola"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        linea = f"[{timestamp}] {mensaje}"
        print(linea)
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(linea + '\n')
    
    def conectar_bd(self):
        """Conectar a MySQL"""
        self.log("Conectando a base de datos...")
        self.conn = mysql.connector.connect(
            host='localhost',
            port=3308,
            user='root',
            password='root_password_here',
            database='albru'
        )
        self.cursor = self.conn.cursor(dictionary=True)
        self.log("✅ Conexión exitosa")
    
    def hacer_backup(self, tabla):
        """Crear tabla de respaldo"""
        backup_nombre = f"{tabla}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.log(f"\n📦 Creando backup: {backup_nombre}")
        
        try:
            # Crear tabla de backup como copia
            self.cursor.execute(f"CREATE TABLE {backup_nombre} LIKE {tabla}")
            self.cursor.execute(f"INSERT INTO {backup_nombre} SELECT * FROM {tabla}")
            self.conn.commit()
            
            # Contar registros en backup
            self.cursor.execute(f"SELECT COUNT(*) as total FROM {backup_nombre}")
            total = self.cursor.fetchone()['total']
            self.log(f"✅ Backup creado: {backup_nombre} ({total:,} registros)")
            return backup_nombre
        except Exception as e:
            self.log(f"❌ Error creando backup: {e}")
            raise
    
    def vaciar_tabla(self, tabla):
        """Vaciar tabla completamente"""
        self.log(f"\n🗑️ Vaciando tabla {tabla}...")
        try:
            # Deshabilitar checks de foreign key temporalmente
            self.cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            self.cursor.execute(f"TRUNCATE TABLE {tabla}")
            self.cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            self.conn.commit()
            self.log(f"✅ Tabla {tabla} vaciada")
        except Exception as e:
            self.log(f"❌ Error vaciando tabla: {e}")
            raise
    
    def importar_clientes(self, archivo_excel):
        """Importar clientes desde Excel"""
        self.log(f"\n{'='*80}")
        self.log(f"IMPORTANDO CLIENTES DESDE: {archivo_excel}")
        self.log("="*80)
        
        # Leer Excel
        self.log("📖 Leyendo archivo Excel...")
        df = pd.read_excel(archivo_excel)
        self.log(f"✅ Archivo leído: {len(df):,} filas")
        self.log(f"Columnas encontradas: {list(df.columns)}")
        
        # Hacer backup
        backup = self.hacer_backup('clientes')
        
        # Vaciar tabla
        self.vaciar_tabla('clientes')
        
        # Preparar datos
        self.log(f"\n📝 Insertando {len(df):,} clientes...")
        
        # Mapeo de columnas del Excel a la BD
        columnas_bd = [
            'id', 'nombre', 'tipo_base', 'leads_original_telefono', 'campana', 
            'canal_adquisicion', 'sala_asignada', 'compania', 'back_office_info',
            'tipificacion_back', 'datos_leads', 'comentarios_back', 'ultima_fecha_gestion',
            'telefono', 'fecha_ultimo_contacto', 'notas', 'created_at', 'updated_at',
            'tipo_cliente_wizard', 'lead_score', 'telefono_registro', 'fecha_nacimiento',
            'dni_nombre_titular', 'parentesco_titular', 'telefono_referencia_wizard',
            'telefono_grabacion_wizard', 'direccion_completa', 'numero_piso_wizard',
            'tipo_plan', 'servicio_contratado', 'velocidad_contratada', 'precio_plan',
            'dispositivos_adicionales_wizard', 'plataforma_digital_wizard',
            'pago_adelanto_instalacion_wizard', 'wizard_completado', 'fecha_wizard_completado',
            'wizard_data_json', 'dni', 'asesor_asignado', 'validador_asignado',
            'fecha_asignacion_validador', 'estatus_wizard', 'seguimiento_status',
            'derivado_at', 'opened_at', 'last_activity', 'estatus_comercial_categoria',
            'estatus_comercial_subcategoria', 'quality_status', 'returned_at',
            'es_duplicado', 'telefono_principal_id', 'cantidad_duplicados', 'tipificacion_original'
        ]
        
        # Construir query de inserción
        placeholders = ', '.join(['%s'] * len(columnas_bd))
        columnas_str = ', '.join(columnas_bd)
        query = f"INSERT INTO clientes ({columnas_str}) VALUES ({placeholders})"
        
        insertados = 0
        errores = 0
        
        for idx, row in df.iterrows():
            try:
                # Preparar valores
                valores = []
                for col in columnas_bd:
                    valor = row.get(col)
                    
                    # Manejar valores nulos
                    if pd.isna(valor):
                        valores.append(None)
                    # Convertir fechas
                    elif 'fecha' in col or 'created_at' in col or 'updated_at' in col or col.endswith('_at'):
                        if pd.notna(valor):
                            try:
                                if isinstance(valor, str):
                                    valores.append(pd.to_datetime(valor).strftime('%Y-%m-%d %H:%M:%S'))
                                else:
                                    valores.append(valor.strftime('%Y-%m-%d %H:%M:%S'))
                            except:
                                valores.append(None)
                        else:
                            valores.append(None)
                    # Otros valores
                    else:
                        valores.append(str(valor) if pd.notna(valor) else None)
                
                self.cursor.execute(query, valores)
                insertados += 1
                
                if insertados % 1000 == 0:
                    self.conn.commit()
                    self.log(f"   ⏳ Insertados: {insertados:,}/{len(df):,}")
                    
            except Exception as e:
                errores += 1
                if errores <= 10:  # Solo mostrar primeros 10 errores
                    self.log(f"   ⚠️ Error en fila {idx}: {e}")
        
        self.conn.commit()
        
        self.log(f"\n✅ IMPORTACIÓN CLIENTES COMPLETADA:")
        self.log(f"   Total insertados: {insertados:,}")
        self.log(f"   Errores: {errores}")
        self.log(f"   Backup guardado en tabla: {backup}")
        
        return insertados, errores
    
    def importar_historial(self, archivo_excel):
        """Importar historial desde Excel"""
        self.log(f"\n{'='*80}")
        self.log(f"IMPORTANDO HISTORIAL DESDE: {archivo_excel}")
        self.log("="*80)
        
        # Leer Excel
        self.log("📖 Leyendo archivo Excel...")
        df = pd.read_excel(archivo_excel)
        self.log(f"✅ Archivo leído: {len(df):,} filas")
        self.log(f"Columnas encontradas: {list(df.columns)[:10]}...")  # Primeras 10
        
        # Hacer backup
        backup = self.hacer_backup('historial_cliente')
        
        # Vaciar tabla
        self.vaciar_tabla('historial_cliente')
        
        # Preparar datos
        self.log(f"\n📝 Insertando {len(df):,} registros de historial...")
        
        # El archivo aña2.xlsx tiene columnas diferentes
        # Necesitamos mapear a la estructura de historial_cliente
        
        insertados = 0
        errores = 0
        sin_cliente_id = 0
        
        for idx, row in df.iterrows():
            try:
                # Buscar cliente_id por DNI o teléfono
                cliente_id = None
                
                # Buscar por DNI si existe
                if 'DNI' in row and pd.notna(row['DNI']):
                    dni = str(row['DNI']).strip()
                    self.cursor.execute("SELECT id FROM clientes WHERE dni = %s LIMIT 1", (dni,))
                    resultado = self.cursor.fetchone()
                    if resultado:
                        cliente_id = resultado['id']
                
                # Buscar por teléfono en LEADS si no encontró por DNI
                if not cliente_id and 'LEADS' in row and pd.notna(row['LEADS']):
                    telefono = str(row['LEADS']).strip()
                    self.cursor.execute(
                        "SELECT id FROM clientes WHERE telefono = %s OR telefono LIKE %s LIMIT 1",
                        (telefono, f"%{telefono}%")
                    )
                    resultado = self.cursor.fetchone()
                    if resultado:
                        cliente_id = resultado['id']
                
                if not cliente_id:
                    sin_cliente_id += 1
                    continue
                
                # Usuario ID - buscar asesor
                usuario_id = 1  # Usuario por defecto (admin)
                if 'AS.FINAL' in row and pd.notna(row['AS.FINAL']):
                    asesor_nombre = str(row['AS.FINAL']).strip()
                    self.cursor.execute(
                        "SELECT id FROM usuarios WHERE nombre LIKE %s LIMIT 1",
                        (f"%{asesor_nombre}%",)
                    )
                    resultado = self.cursor.fetchone()
                    if resultado:
                        usuario_id = resultado['id']
                
                # Preparar datos de historial
                accion = row.get('TIPIFICACION FINAL', 'Gestión importada')
                if pd.isna(accion):
                    accion = 'Gestión importada'
                
                # Preparar descripción con detalles
                descripcion_partes = []
                if 'COMENTARIO ASESOR' in row and pd.notna(row['COMENTARIO ASESOR']):
                    descripcion_partes.append(f"Comentario: {row['COMENTARIO ASESOR']}")
                if 'TIPIFICACION BACK' in row and pd.notna(row['TIPIFICACION BACK']):
                    descripcion_partes.append(f"Tipificación Back: {row['TIPIFICACION BACK']}")
                if 'CAMPAÑA' in row and pd.notna(row['CAMPAÑA']):
                    descripcion_partes.append(f"Campaña: {row['CAMPAÑA']}")
                if 'COMENTARIO GESTIÓN 2' in row and pd.notna(row['COMENTARIO GESTIÓN 2']):
                    descripcion_partes.append(f"Gestión 2: {row['COMENTARIO GESTIÓN 2']}")
                
                descripcion = ' | '.join(descripcion_partes) if descripcion_partes else 'Gestión importada'
                
                # Estados
                estado_anterior = row.get('TIPIFICACION BACK', 'Importado')
                if pd.isna(estado_anterior):
                    estado_anterior = 'Importado'
                    
                estado_nuevo = accion
                
                # Insertar (created_at se establece automáticamente)
                self.cursor.execute("""
                    INSERT INTO historial_cliente 
                    (cliente_id, usuario_id, accion, descripcion, estado_anterior, estado_nuevo)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (cliente_id, usuario_id, accion, descripcion, estado_anterior, estado_nuevo))
                
                insertados += 1
                
                if insertados % 1000 == 0:
                    self.conn.commit()
                    self.log(f"   ⏳ Insertados: {insertados:,}/{len(df):,}")
                    
            except Exception as e:
                errores += 1
                if errores <= 10:
                    self.log(f"   ⚠️ Error en fila {idx}: {e}")
        
        self.conn.commit()
        
        self.log(f"\n✅ IMPORTACIÓN HISTORIAL COMPLETADA:")
        self.log(f"   Total insertados: {insertados:,}")
        self.log(f"   Sin cliente_id: {sin_cliente_id:,}")
        self.log(f"   Errores: {errores}")
        self.log(f"   Backup guardado en tabla: {backup}")
        
        return insertados, errores
    
    def verificar_importacion(self):
        """Verificar que la importación fue exitosa"""
        self.log(f"\n{'='*80}")
        self.log("VERIFICACIÓN FINAL")
        self.log("="*80)
        
        # Contar clientes
        self.cursor.execute("SELECT COUNT(*) as total FROM clientes")
        total_clientes = self.cursor.fetchone()['total']
        self.log(f"\n📊 Total clientes en BD: {total_clientes:,}")
        
        # Contar historial
        self.cursor.execute("SELECT COUNT(*) as total FROM historial_cliente")
        total_historial = self.cursor.fetchone()['total']
        self.log(f"📊 Total registros historial: {total_historial:,}")
        
        # Últimos 5 clientes
        self.cursor.execute("""
            SELECT id, nombre, telefono, dni 
            FROM clientes 
            ORDER BY id DESC 
            LIMIT 5
        """)
        self.log("\n👥 Últimos 5 clientes:")
        for cliente in self.cursor.fetchall():
            self.log(f"   ID {cliente['id']}: {cliente['nombre']} | Tel: {cliente['telefono']} | DNI: {cliente['dni']}")
        
        # Últimas 5 gestiones
        self.cursor.execute("""
            SELECT h.id, h.cliente_id, c.nombre, h.accion, h.fecha
            FROM historial_cliente h
            JOIN clientes c ON h.cliente_id = c.id
            ORDER BY h.id DESC
            LIMIT 5
        """)
        self.log("\n📝 Últimas 5 gestiones:")
        for gestion in self.cursor.fetchall():
            self.log(f"   ID {gestion['id']}: Cliente {gestion['cliente_id']} ({gestion['nombre']}) - {gestion['accion']} - {gestion['fecha']}")
    
    def ejecutar(self):
        """Ejecutar proceso completo"""
        try:
            self.log("🚀 INICIANDO REEMPLAZO COMPLETO DE TABLAS")
            self.log(f"⏰ Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            
            # Conectar
            self.conectar_bd()
            
            # Importar clientes
            clientes_ok, clientes_err = self.importar_clientes(
                "C:/Users/USER/Desktop/ARCHIVOS/clientes (updated) 2.xlsx"
            )
            
            # Importar historial
            historial_ok, historial_err = self.importar_historial(
                "C:/Users/USER/Desktop/ARCHIVOS/aña2.xlsx"
            )
            
            # Verificar
            self.verificar_importacion()
            
            self.log(f"\n{'='*80}")
            self.log("✅ PROCESO COMPLETADO EXITOSAMENTE")
            self.log("="*80)
            self.log(f"📄 Log guardado en: {self.log_file}")
            
        except Exception as e:
            self.log(f"\n❌ ERROR CRÍTICO: {e}")
            import traceback
            self.log(traceback.format_exc())
            raise
        finally:
            if self.cursor:
                self.cursor.close()
            if self.conn:
                self.conn.close()
                self.log("\n🔌 Conexión cerrada")

if __name__ == "__main__":
    reemplazador = ReemplazadorTablas()
    reemplazador.ejecutar()
