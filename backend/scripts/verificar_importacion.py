import pandas as pd
import mysql.connector
from datetime import datetime

def conectar_bd():
    """Conectar a la base de datos MySQL"""
    return mysql.connector.connect(
        host='localhost',
        port=3308,
        user='root',
        password='root_password_here',
        database='albru'
    )

def analizar_excel():
    """Analizar archivos Excel"""
    print("="*80)
    print("ANÁLISIS DE ARCHIVOS EXCEL")
    print("="*80)
    
    # Analizar archivo 1
    f1 = pd.read_excel("C:/Users/USER/Desktop/ARCHIVOS/clientes (updated) 2.xlsx")
    print(f"\n📄 clientes (updated) 2.xlsx:")
    print(f"   Total filas: {len(f1)}")
    print(f"   Columnas: {list(f1.columns)}")
    
    # Analizar archivo 2
    f2 = pd.read_excel("C:/Users/USER/Desktop/ARCHIVOS/aña2.xlsx")
    print(f"\n📄 aña2.xlsx:")
    print(f"   Total filas: {len(f2)}")
    print(f"   Columnas: {list(f2.columns)}")
    
    return f1, f2

def verificar_en_bd(df, nombre_archivo):
    """Verificar si los registros del Excel están en la BD"""
    print(f"\n{'='*80}")
    print(f"VERIFICACIÓN EN BASE DE DATOS: {nombre_archivo}")
    print("="*80)
    
    conn = conectar_bd()
    cursor = conn.cursor(dictionary=True)
    
    # Mostrar muestra del Excel
    print("\n📊 MUESTRA DEL EXCEL (primeras 5 filas):")
    print(df.head(5).to_string())
    
    encontrados = 0
    no_encontrados = 0
    
    # Verificar algunos registros clave
    print(f"\n🔍 VERIFICANDO REGISTROS EN BD...")
    
    for idx, row in df.head(10).iterrows():  # Verificar primeros 10
        # Buscar por teléfono si existe
        if 'telefono' in row and pd.notna(row['telefono']):
            telefono = str(row['telefono']).strip()
            cursor.execute("""
                SELECT id, nombre, telefono, dni, estado 
                FROM clientes 
                WHERE telefono = %s OR telefono LIKE %s
                LIMIT 1
            """, (telefono, f"%{telefono}%"))
            
            resultado = cursor.fetchone()
            if resultado:
                encontrados += 1
                print(f"   ✅ Fila {idx+1}: Encontrado en BD - ID: {resultado['id']}, Nombre: {resultado['nombre']}")
            else:
                no_encontrados += 1
                print(f"   ❌ Fila {idx+1}: NO encontrado - Tel: {telefono}")
        
        # Si no hay teléfono, buscar por nombre y DNI
        elif 'nombre' in row and pd.notna(row['nombre']):
            nombre = str(row['nombre']).strip()
            dni = str(row.get('dni', '')).strip() if 'dni' in row else ''
            
            if dni:
                cursor.execute("""
                    SELECT id, nombre, telefono, dni 
                    FROM clientes 
                    WHERE nombre LIKE %s AND dni = %s
                    LIMIT 1
                """, (f"%{nombre}%", dni))
            else:
                cursor.execute("""
                    SELECT id, nombre, telefono, dni 
                    FROM clientes 
                    WHERE nombre LIKE %s
                    LIMIT 1
                """, (f"%{nombre}%",))
            
            resultado = cursor.fetchone()
            if resultado:
                encontrados += 1
                print(f"   ✅ Fila {idx+1}: Encontrado en BD - ID: {resultado['id']}, Nombre: {resultado['nombre']}")
            else:
                no_encontrados += 1
                print(f"   ❌ Fila {idx+1}: NO encontrado - Nombre: {nombre}")
    
    print(f"\n📊 RESUMEN:")
    print(f"   Encontrados: {encontrados}/10")
    print(f"   No encontrados: {no_encontrados}/10")
    
    cursor.close()
    conn.close()
    
    return encontrados, no_encontrados

def verificar_total_bd():
    """Verificar total de clientes en BD"""
    print("\n" + "="*80)
    print("ESTADÍSTICAS DE BASE DE DATOS")
    print("="*80)
    
    conn = conectar_bd()
    cursor = conn.cursor(dictionary=True)
    
    # Total de clientes
    cursor.execute("SELECT COUNT(*) as total FROM clientes")
    total = cursor.fetchone()['total']
    print(f"\n📊 Total de clientes en BD: {total:,}")
    
    # Últimos 5 registros insertados
    cursor.execute("""
        SELECT id, nombre, telefono, dni, estado, fecha_registro 
        FROM clientes 
        ORDER BY id DESC 
        LIMIT 5
    """)
    
    print("\n📅 ÚLTIMOS 5 CLIENTES REGISTRADOS:")
    ultimos = cursor.fetchall()
    for cliente in ultimos:
        print(f"   ID: {cliente['id']} | {cliente['nombre']} | Tel: {cliente['telefono']} | Fecha: {cliente['fecha_registro']}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    try:
        print("\n🚀 INICIANDO VERIFICACIÓN DE IMPORTACIÓN...")
        print(f"⏰ Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Analizar archivos Excel
        f1, f2 = analizar_excel()
        
        # Verificar total en BD
        verificar_total_bd()
        
        # Verificar archivo 1
        verificar_en_bd(f1, "clientes (updated) 2.xlsx")
        
        # Verificar archivo 2
        verificar_en_bd(f2, "aña2.xlsx")
        
        print("\n" + "="*80)
        print("✅ VERIFICACIÓN COMPLETADA")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
