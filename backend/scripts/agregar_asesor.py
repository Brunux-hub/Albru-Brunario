#!/usr/bin/env python3
"""
Script para agregar asesores al sistema ALBRU
Genera automáticamente el email con formato: inicial_nombre + apellido_paterno + inicial_apellido_materno@albru.pe
Ejemplo: Juan Carlos Pérez García -> jperezg@albru.pe
"""

import sys
import mysql.connector
import bcrypt
import os
from datetime import datetime

# Configuración de la base de datos
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3308)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'root_password_here'),
    'database': os.getenv('DB_NAME', 'albru')
}


def generar_email(nombre_completo):
    """
    Genera email en formato: inicial_nombre + apellido_paterno + inicial_apellido_materno@albru.pe
    Ejemplo: Sebastián Antonio André Aguirre Fiestas -> saguirref@albru.pe
    """
    # Limpiar y separar el nombre
    partes = nombre_completo.strip().split()
    
    if len(partes) < 3:
        print(f"⚠️  Advertencia: El nombre debe tener al menos 3 palabras (Nombre Apellido1 Apellido2)")
        print(f"   Usando formato alternativo...")
        if len(partes) == 2:
            # Solo nombre y apellido: jperez@albru.pe
            inicial_nombre = partes[0][0].lower()
            apellido = partes[1].lower()
            return f"{inicial_nombre}{apellido}@albru.pe"
        else:
            # Solo un nombre: juan@albru.pe
            return f"{partes[0].lower()}@albru.pe"
    
    # Caso normal: al menos 3 palabras
    # Primera letra del primer nombre
    inicial_nombre = partes[0][0].lower()
    
    # Penúltima palabra es apellido paterno
    apellido_paterno = partes[-2].lower()
    
    # Última palabra es apellido materno (solo inicial)
    inicial_apellido_materno = partes[-1][0].lower()
    
    # Construir email
    email = f"{inicial_nombre}{apellido_paterno}{inicial_apellido_materno}@albru.pe"
    
    # Remover caracteres especiales y normalizar
    email = email.replace('á', 'a').replace('é', 'e').replace('í', 'i')\
                 .replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')\
                 .replace('ü', 'u')
    
    return email


def generar_username(email):
    """Genera username desde el email (sin @albru.pe)"""
    return email.split('@')[0]


def agregar_asesor(nombre, dni):
    """Agrega un asesor a la base de datos"""
    conn = None
    cursor = None
    
    try:
        print(f"\n{'='*60}")
        print(f"  AGREGANDO ASESOR: {nombre}")
        print(f"{'='*60}\n")
        
        # Generar credenciales
        email = generar_email(nombre)
        username = generar_username(email)
        password = dni  # DNI como contraseña
        
        print(f"📧 Email generado: {email}")
        print(f"👤 Username: {username}")
        print(f"🔑 Contraseña: {password} (DNI)")
        
        # Hashear contraseña
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Conectar a la base de datos
        print(f"\n🔌 Conectando a la base de datos...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        print(f"✅ Conexión exitosa\n")
        
        # Verificar si el asesor ya existe
        cursor.execute(
            "SELECT id, nombre, email FROM usuarios WHERE username = %s OR email = %s OR telefono = %s",
            (username, email, int(dni))
        )
        existing = cursor.fetchone()
        
        if existing:
            print(f"⚠️  El asesor ya existe en el sistema:")
            print(f"   ID: {existing['id']}")
            print(f"   Nombre: {existing['nombre']}")
            print(f"   Email: {existing['email']}")
            return False
        
        # Insertar en tabla usuarios
        insert_usuario = """
            INSERT INTO usuarios (nombre, email, username, password, telefono, tipo, estado, created_at) 
            VALUES (%s, %s, %s, %s, %s, 'asesor', 'activo', NOW())
        """
        cursor.execute(insert_usuario, (nombre, email, username, hashed_password, int(dni)))
        usuario_id = cursor.lastrowid
        
        # Insertar en tabla asesores
        insert_asesor = """
            INSERT INTO asesores (usuario_id, meta_mensual, comision_porcentaje, created_at) 
            VALUES (%s, 50, 5.00, NOW())
        """
        cursor.execute(insert_asesor, (usuario_id,))
        
        conn.commit()
        
        print(f"✅ ¡Asesor agregado exitosamente!\n")
        print(f"{'─'*60}")
        print(f"  CREDENCIALES DE ACCESO")
        print(f"{'─'*60}")
        print(f"  Usuario:     {username}")
        print(f"  Contraseña:  {password}")
        print(f"  Email:       {email}")
        print(f"  ID:          {usuario_id}")
        print(f"{'─'*60}\n")
        
        return True
        
    except mysql.connector.Error as err:
        print(f"❌ Error de base de datos: {err}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print(f"🔌 Conexión cerrada\n")


def modo_interactivo():
    """Modo interactivo para agregar asesores"""
    print(f"\n{'═'*60}")
    print(f"  SISTEMA DE REGISTRO DE ASESORES - ALBRU")
    print(f"{'═'*60}\n")
    
    while True:
        print(f"\n{'-'*60}")
        nombre = input("📝 Nombre completo del asesor (o 'salir' para terminar): ").strip()
        
        if nombre.lower() in ['salir', 'exit', 'quit', 'q']:
            print("\n👋 ¡Hasta luego!")
            break
        
        if not nombre:
            print("❌ El nombre no puede estar vacío")
            continue
        
        dni = input("🆔 DNI del asesor: ").strip()
        
        if not dni or not dni.isdigit():
            print("❌ El DNI debe ser numérico")
            continue
        
        # Mostrar preview del email que se generará
        email_preview = generar_email(nombre)
        print(f"\n📧 Email que se generará: {email_preview}")
        confirmar = input("¿Continuar? (S/n): ").strip().lower()
        
        if confirmar in ['n', 'no']:
            print("❌ Operación cancelada")
            continue
        
        agregar_asesor(nombre, dni)


def main():
    """Función principal"""
    if len(sys.argv) == 3:
        # Modo con argumentos: python agregar_asesor.py "Nombre" "DNI"
        nombre = sys.argv[1]
        dni = sys.argv[2]
        agregar_asesor(nombre, dni)
    elif len(sys.argv) == 1:
        # Modo interactivo
        modo_interactivo()
    else:
        print("❌ Uso incorrecto del script\n")
        print("Modo 1 - Con argumentos:")
        print('  python agregar_asesor.py "Nombre Completo" "DNI"\n')
        print("Modo 2 - Interactivo:")
        print("  python agregar_asesor.py\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
