#!/usr/bin/env python3
"""
Script para cambiar el rol/tipo de un usuario en el sistema ALBRU
Roles disponibles: admin, gtr, asesor, supervisor, validador
"""

import sys
import mysql.connector
import os

# Configuración de la base de datos
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3308)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'root_password_here'),
    'database': os.getenv('DB_NAME', 'albru')
}

ROLES_VALIDOS = ['admin', 'gtr', 'asesor', 'supervisor', 'validador']


def cambiar_rol(identificador, nuevo_rol):
    """
    Cambia el rol de un usuario
    identificador puede ser: ID, username, email o DNI/teléfono
    """
    conn = None
    cursor = None
    
    try:
        print(f"\n{'='*60}")
        print(f"  CAMBIO DE ROL DE USUARIO")
        print(f"{'='*60}\n")
        
        # Validar el rol
        if nuevo_rol.lower() not in ROLES_VALIDOS:
            print(f"❌ Error: El rol '{nuevo_rol}' no es válido")
            print(f"   Roles válidos: {', '.join(ROLES_VALIDOS)}")
            return False
        
        nuevo_rol = nuevo_rol.lower()
        
        # Conectar a la base de datos
        print(f"🔌 Conectando a la base de datos...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        print(f"✅ Conexión exitosa\n")
        
        # Buscar el usuario (puede ser por ID, username, email o teléfono)
        query = """
            SELECT id, nombre, email, username, telefono, tipo, estado 
            FROM usuarios 
            WHERE id = %s OR username = %s OR email = %s OR telefono = %s
        """
        
        # Intentar convertir a int si es numérico
        param_id = int(identificador) if identificador.isdigit() else None
        
        cursor.execute(query, (param_id, identificador, identificador, param_id))
        usuario = cursor.fetchone()
        
        if not usuario:
            print(f"❌ No se encontró ningún usuario con: {identificador}")
            return False
        
        # Mostrar información del usuario
        print(f"👤 Usuario encontrado:")
        print(f"{'─'*60}")
        print(f"  ID:       {usuario['id']}")
        print(f"  Nombre:   {usuario['nombre']}")
        print(f"  Email:    {usuario['email']}")
        print(f"  Username: {usuario['username']}")
        print(f"  Teléfono: {usuario['telefono']}")
        print(f"  Rol actual: {usuario['tipo'].upper()}")
        print(f"  Estado:   {usuario['estado']}")
        print(f"{'─'*60}\n")
        
        # Verificar si el rol ya es el mismo
        if usuario['tipo'] == nuevo_rol:
            print(f"⚠️  El usuario ya tiene el rol '{nuevo_rol}'")
            return True
        
        # Confirmar el cambio
        rol_anterior = usuario['tipo']
        print(f"🔄 Cambio de rol:")
        print(f"   De: {rol_anterior.upper()}")
        print(f"   A:  {nuevo_rol.upper()}\n")
        
        # Actualizar el rol
        cursor.execute(
            "UPDATE usuarios SET tipo = %s, updated_at = NOW() WHERE id = %s",
            (nuevo_rol, usuario['id'])
        )
        
        # Si el nuevo rol es 'asesor', crear registro en tabla asesores si no existe
        if nuevo_rol == 'asesor':
            cursor.execute("SELECT id FROM asesores WHERE usuario_id = %s", (usuario['id'],))
            asesor_existe = cursor.fetchone()
            
            if not asesor_existe:
                print(f"📝 Creando registro en tabla 'asesores'...")
                cursor.execute(
                    """INSERT INTO asesores (usuario_id, meta_mensual, comision_porcentaje, created_at) 
                       VALUES (%s, 50, 5.00, NOW())""",
                    (usuario['id'],)
                )
                print(f"✅ Registro de asesor creado")
        
        conn.commit()
        
        print(f"\n✅ ¡Rol cambiado exitosamente!\n")
        print(f"{'─'*60}")
        print(f"  RESUMEN DEL CAMBIO")
        print(f"{'─'*60}")
        print(f"  Usuario:     {usuario['nombre']}")
        print(f"  Rol anterior: {rol_anterior.upper()}")
        print(f"  Rol nuevo:    {nuevo_rol.upper()}")
        print(f"{'─'*60}\n")
        
        return True
        
    except mysql.connector.Error as err:
        print(f"❌ Error de base de datos: {err}")
        if conn:
            conn.rollback()
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print(f"🔌 Conexión cerrada\n")


def listar_usuarios():
    """Lista todos los usuarios del sistema"""
    conn = None
    cursor = None
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, nombre, email, username, tipo, estado 
            FROM usuarios 
            ORDER BY tipo, nombre
        """)
        usuarios = cursor.fetchall()
        
        print(f"\n{'='*80}")
        print(f"  LISTA DE USUARIOS EN EL SISTEMA")
        print(f"{'='*80}\n")
        print(f"{'ID':<5} {'Nombre':<30} {'Username':<20} {'Rol':<12} {'Estado'}")
        print(f"{'-'*80}")
        
        for u in usuarios:
            username = u['username'] if u['username'] else '-'
            print(f"{u['id']:<5} {u['nombre'][:29]:<30} {username[:19]:<20} {u['tipo'].upper():<12} {u['estado']}")
        
        print(f"{'-'*80}")
        print(f"Total: {len(usuarios)} usuarios\n")
        
    except mysql.connector.Error as err:
        print(f"❌ Error: {err}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def modo_interactivo():
    """Modo interactivo para cambiar roles"""
    print(f"\n{'═'*60}")
    print(f"  SISTEMA DE CAMBIO DE ROLES - ALBRU")
    print(f"{'═'*60}\n")
    
    while True:
        print(f"\n{'-'*60}")
        print("Opciones:")
        print("  1. Cambiar rol de un usuario")
        print("  2. Listar todos los usuarios")
        print("  3. Salir")
        print(f"{'-'*60}")
        
        opcion = input("\nSelecciona una opción (1-3): ").strip()
        
        if opcion == '3':
            print("\n👋 ¡Hasta luego!")
            break
        elif opcion == '2':
            listar_usuarios()
            continue
        elif opcion != '1':
            print("❌ Opción inválida")
            continue
        
        # Opción 1: Cambiar rol
        print(f"\n{'─'*60}")
        identificador = input("ID, username, email o DNI del usuario: ").strip()
        
        if not identificador:
            print("❌ Debes proporcionar un identificador")
            continue
        
        print(f"\nRoles disponibles: {', '.join(ROLES_VALIDOS)}")
        nuevo_rol = input("Nuevo rol: ").strip()
        
        if not nuevo_rol:
            print("❌ Debes especificar un rol")
            continue
        
        cambiar_rol(identificador, nuevo_rol)


def main():
    """Función principal"""
    if len(sys.argv) == 3:
        # Modo con argumentos: python cambiar_rol.py "identificador" "nuevo_rol"
        identificador = sys.argv[1]
        nuevo_rol = sys.argv[2]
        cambiar_rol(identificador, nuevo_rol)
    elif len(sys.argv) == 2 and sys.argv[1].lower() in ['list', 'listar', 'ls']:
        # Listar usuarios
        listar_usuarios()
    elif len(sys.argv) == 1:
        # Modo interactivo
        modo_interactivo()
    else:
        print("❌ Uso incorrecto del script\n")
        print("Modo 1 - Cambiar rol:")
        print('  python cambiar_rol.py "identificador" "nuevo_rol"\n')
        print("Modo 2 - Listar usuarios:")
        print('  python cambiar_rol.py list\n')
        print("Modo 3 - Interactivo:")
        print("  python cambiar_rol.py\n")
        print(f"Roles válidos: {', '.join(ROLES_VALIDOS)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
