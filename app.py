#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Interfaz Visual para Gestión de Clientes - Albru Brunario CRM
============================================================
Aplicación Streamlit que proporciona interfaz visual para:
- Sistema CRUD de Clientes
- Sistema de Backup y Diagnóstico
Usando pandas para manejo de datos y Streamlit para la interfaz.
"""

import streamlit as st
import pandas as pd
import sys
import os
from pathlib import Path

# Agregar el directorio scripts al path para importar los módulos
BASE_DIR = Path(__file__).resolve().parent
SCRIPTS_DIR = BASE_DIR / "scripts"
sys.path.append(str(SCRIPTS_DIR))

# Importar las clases de los scripts existentes
try:
    from crud_clientes_sistema import SistemaCRUDClientes
    from backup_y_diagnostico import SistemaBackupDiagnostico
except ImportError as e:
    st.error(f"Error al importar módulos: {e}")
    st.stop()

# Configuración de la página
st.set_page_config(
    page_title="Albru Brunario CRM",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Estilos CSS personalizados
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .section-header {
        font-size: 1.8rem;
        font-weight: bold;
        color: #2ca02c;
        margin-top: 2rem;
        margin-bottom: 1rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 0.25rem solid #1f77b4;
    }
    .success-msg {
        color: #28a745;
        font-weight: bold;
    }
    .error-msg {
        color: #dc3545;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

def main():
    """Función principal de la aplicación"""

    # Header principal
    st.markdown('<div class="main-header">📊 Albru Brunario CRM</div>', unsafe_allow_html=True)
    st.markdown("### Sistema de Gestión de Clientes con Interfaz Visual")

    # Sidebar para navegación
    with st.sidebar:
        st.header("🧭 Navegación")

        # Estado de conexión a BD
        if 'sistema_crud' not in st.session_state:
            try:
                st.session_state.sistema_crud = SistemaCRUDClientes()
                if st.session_state.sistema_crud.conectar_bd():
                    if st.session_state.sistema_crud.cargar_datos():
                        st.success("✅ Conectado a BD")
                    else:
                        st.error("❌ Error al cargar datos")
                else:
                    st.error("❌ Error de conexión BD")
            except Exception as e:
                st.error(f"❌ Error: {e}")

        # Menú de opciones
        menu = st.selectbox(
            "Selecciona una opción:",
            ["🏠 Dashboard", "🔍 Buscar Clientes", "➕ Crear Cliente", "✏️ Editar Cliente",
             "❌ Eliminar Cliente", "📊 Estadísticas", "💾 Backup y Diagnóstico"]
        )

    # Contenido principal según la selección
    if menu == "🏠 Dashboard":
        mostrar_dashboard()

    elif menu == "🔍 Buscar Clientes":
        buscar_clientes()

    elif menu == "➕ Crear Cliente":
        crear_cliente()

    elif menu == "✏️ Editar Cliente":
        editar_cliente()

    elif menu == "❌ Eliminar Cliente":
        eliminar_cliente()

    elif menu == "📊 Estadísticas":
        mostrar_estadisticas()

    elif menu == "💾 Backup y Diagnóstico":
        backup_diagnostico()

def mostrar_dashboard():
    """Mostrar dashboard principal"""
    st.markdown('<div class="section-header">📈 Dashboard</div>', unsafe_allow_html=True)

    if 'sistema_crud' not in st.session_state:
        st.error("No hay conexión a la base de datos")
        return

    sistema = st.session_state.sistema_crud

    # Métricas principales
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Total Clientes", len(sistema.df_clientes))

    with col2:
        completados = len(sistema.df_clientes[sistema.df_clientes['wizard_completado'] == 1])
        st.metric("Wizard Completado", completados)

    with col3:
        activos = len(sistema.df_clientes[
            (sistema.df_clientes['seguimiento_status'] != 'gestionado') |
            (sistema.df_clientes['seguimiento_status'].isna())
        ])
        st.metric("Clientes Activos", activos)

    with col4:
        asesores = len(sistema.df_asesores[sistema.df_asesores['estado'] == 'activo'])
        st.metric("Asesores Activos", asesores)

    # Gráfico de distribución por categoría
    st.subheader("📊 Distribución por Categoría")
    if not sistema.df_clientes.empty:
        categoria_counts = sistema.df_clientes['estatus_comercial_categoria'].value_counts()
        st.bar_chart(categoria_counts)

    # Tabla de clientes recientes
    st.subheader("🕒 Clientes Recientes")
    if not sistema.df_clientes.empty:
        recientes = sistema.df_clientes.head(10)[['id', 'nombre', 'telefono', 'estatus_comercial_categoria', 'created_at']]
        st.dataframe(recientes, use_container_width=True)

def buscar_clientes():
    """Interfaz para buscar clientes"""
    st.markdown('<div class="section-header">🔍 Buscar Clientes</div>', unsafe_allow_html=True)

    if 'sistema_crud' not in st.session_state:
        st.error("No hay conexión a la base de datos")
        return

    sistema = st.session_state.sistema_crud

    # Campo de búsqueda
    termino = st.text_input("Buscar por número, DNI, ID o nombre:", key="busqueda")

    if termino:
        resultados = sistema.buscar_cliente(termino)

        if resultados.empty:
            st.warning("No se encontraron resultados")
        else:
            st.success(f"Se encontraron {len(resultados)} resultados")

            # Mostrar resultados en tabla
            st.dataframe(resultados[['id', 'nombre', 'telefono', 'dni', 'estatus_comercial_categoria']], use_container_width=True)

            # Si hay un solo resultado, mostrar detalles
            if len(resultados) == 1:
                if st.button("Ver detalles completos"):
                    sistema.mostrar_cliente_completo(resultados.iloc[0]['id'])
            else:
                # Selector para ver detalles
                cliente_id = st.selectbox("Seleccionar cliente para ver detalles:",
                                        resultados['id'].tolist(),
                                        format_func=lambda x: f"{x} - {resultados[resultados['id']==x]['nombre'].iloc[0]}")

                if st.button("Ver detalles"):
                    sistema.mostrar_cliente_completo(cliente_id)

def crear_cliente():
    """Interfaz para crear nuevo cliente"""
    st.markdown('<div class="section-header">➕ Crear Nuevo Cliente</div>', unsafe_allow_html=True)

    if 'sistema_crud' not in st.session_state:
        st.error("No hay conexión a la base de datos")
        return

    sistema = st.session_state.sistema_crud

    with st.form("crear_cliente_form"):
        col1, col2 = st.columns(2)

        with col1:
            nombre = st.text_input("Nombre completo *", key="nombre")
            telefono = st.text_input("Teléfono *", key="telefono")
            dni = st.text_input("DNI", key="dni")
            email = st.text_input("Email", key="email")

        with col2:
            direccion = st.text_input("Dirección", key="direccion")
            ciudad = st.text_input("Ciudad", key="ciudad")
            campana = st.text_input("Campaña", key="campana")

        submitted = st.form_submit_button("Crear Cliente")

        if submitted:
            if not nombre or not telefono:
                st.error("Nombre y teléfono son obligatorios")
            else:
                datos = {
                    'nombre': nombre,
                    'telefono': telefono,
                    'dni': dni,
                    'email': email,
                    'direccion': direccion,
                    'ciudad': ciudad,
                    'campana': campana
                }

                exito, mensaje = sistema.crear_cliente(datos)
                if exito:
                    st.success(f"✅ {mensaje}")
                    st.rerun()  # Recargar la página
                else:
                    st.error(f"❌ {mensaje}")

def editar_cliente():
    """Interfaz para editar cliente"""
    st.markdown('<div class="section-header">✏️ Editar Cliente</div>', unsafe_allow_html=True)

    if 'sistema_crud' not in st.session_state:
        st.error("No hay conexión a la base de datos")
        return

    sistema = st.session_state.sistema_crud

    # Buscar cliente primero
    termino = st.text_input("Buscar cliente a editar (ID, nombre, teléfono):", key="busqueda_editar")

    if termino:
        resultados = sistema.buscar_cliente(termino)

        if resultados.empty:
            st.warning("Cliente no encontrado")
        elif len(resultados) == 1:
            cliente = resultados.iloc[0]

            st.subheader(f"Editando: {cliente['nombre']}")

            with st.form("editar_cliente_form"):
                col1, col2 = st.columns(2)

                with col1:
                    nombre = st.text_input("Nombre completo", value=cliente['nombre'], key="edit_nombre")
                    telefono = st.text_input("Teléfono", value=str(cliente['telefono']), key="edit_telefono")
                    email = st.text_input("Email", value=cliente.get('email', ''), key="edit_email")

                with col2:
                    categoria = st.text_input("Categoría", value=cliente.get('estatus_comercial_categoria', ''), key="edit_categoria")
                    subcategoria = st.text_input("Subcategoría", value=cliente.get('estatus_comercial_subcategoria', ''), key="edit_subcategoria")

                submitted = st.form_submit_button("Actualizar Cliente")

                if submitted:
                    datos = {}
                    if nombre != cliente['nombre']:
                        datos['nombre'] = nombre
                    if telefono != str(cliente['telefono']):
                        datos['telefono'] = telefono
                    if email != cliente.get('email', ''):
                        datos['email'] = email
                    if categoria != cliente.get('estatus_comercial_categoria', ''):
                        datos['estatus_comercial_categoria'] = categoria
                    if subcategoria != cliente.get('estatus_comercial_subcategoria', ''):
                        datos['estatus_comercial_subcategoria'] = subcategoria

                    if datos:
                        exito, mensaje = sistema.editar_cliente(cliente['id'], datos)
                        if exito:
                            st.success(f"✅ {mensaje}")
                            st.rerun()
                        else:
                            st.error(f"❌ {mensaje}")
                    else:
                        st.warning("No se hicieron cambios")
        else:
            st.warning("Múltiples resultados encontrados. Sea más específico.")

def eliminar_cliente():
    """Interfaz para eliminar cliente"""
    st.markdown('<div class="section-header">❌ Eliminar Cliente</div>', unsafe_allow_html=True)

    if 'sistema_crud' not in st.session_state:
        st.error("No hay conexión a la base de datos")
        return

    sistema = st.session_state.sistema_crud

    termino = st.text_input("Buscar cliente a eliminar (ID, nombre, teléfono):", key="busqueda_eliminar")

    if termino:
        resultados = sistema.buscar_cliente(termino)

        if resultados.empty:
            st.warning("Cliente no encontrado")
        elif len(resultados) == 1:
            cliente = resultados.iloc[0]

            st.error(f"⚠️ ¿Está seguro de eliminar a {cliente['nombre']}?")
            st.write(f"**ID:** {cliente['id']}")
            st.write(f"**Teléfono:** {cliente['telefono']}")

            if st.button("✅ Confirmar Eliminación", type="primary"):
                exito, mensaje = sistema.eliminar_cliente(cliente['id'])
                if exito:
                    st.success(f"✅ {mensaje}")
                    st.rerun()
                else:
                    st.error(f"❌ {mensaje}")
        else:
            st.warning("Múltiples resultados encontrados. Sea más específico.")

def mostrar_estadisticas():
    """Mostrar estadísticas detalladas"""
    st.markdown('<div class="section-header">📊 Estadísticas del Sistema</div>', unsafe_allow_html=True)

    if 'sistema_crud' not in st.session_state:
        st.error("No hay conexión a la base de datos")
        return

    sistema = st.session_state.sistema_crud

    # Estadísticas generales
    st.subheader("📈 Estadísticas Generales")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric("Total Clientes", len(sistema.df_clientes))

    with col2:
        st.metric("Registros de Historial", len(sistema.df_historial))

    with col3:
        st.metric("Gestiones Registradas", len(sistema.df_gestiones))

    # Gráficos
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📊 Clientes por Categoría")
        if not sistema.df_clientes.empty:
            categoria_counts = sistema.df_clientes['estatus_comercial_categoria'].value_counts()
            st.bar_chart(categoria_counts)

    with col2:
        st.subheader("📊 Estado de Seguimiento")
        if not sistema.df_clientes.empty:
            seguimiento_counts = sistema.df_clientes['seguimiento_status'].value_counts()
            st.bar_chart(seguimiento_counts)

    # Tabla de asesores
    st.subheader("👥 Asesores")
    if not sistema.df_asesores.empty:
        st.dataframe(sistema.df_asesores[['usuario_id', 'nombre', 'estado', 'clientes_asignados']], use_container_width=True)

def backup_diagnostico():
    """Interfaz para backup y diagnóstico"""
    st.markdown('<div class="section-header">💾 Backup y Diagnóstico</div>', unsafe_allow_html=True)

    st.info("Esta función ejecuta el sistema de backup completo y diagnóstico inteligente")

    if st.button("🚀 Ejecutar Backup Completo", type="primary"):
        with st.spinner("Ejecutando backup y diagnóstico... Esto puede tomar varios minutos"):
            try:
                sistema_backup = SistemaBackupDiagnostico()
                exito = sistema_backup.ejecutar_backup_completo()

                if exito:
                    st.success("✅ Backup completado exitosamente")
                    st.balloons()
                else:
                    st.error("❌ Backup completado con errores")

                # Mostrar resultados del diagnóstico
                st.subheader("📋 Resultado del Diagnóstico")

                # Aquí podrías mostrar más detalles del diagnóstico
                # Por simplicidad, solo mostramos el resultado general

            except Exception as e:
                st.error(f"❌ Error durante el backup: {e}")

if __name__ == "__main__":
    main()