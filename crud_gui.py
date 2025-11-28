#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GUI de Escritorio para CRUD de Clientes - Albru Brunario
Usa PySimpleGUI + pandas y reutiliza SistemaCRUDClientes sin cambiar su lógica.
"""

import PySimpleGUI as sg
import threading
import traceback
import sys
from pathlib import Path
import json

# Agregar scripts al path para importar SistemaCRUDClientes
BASE_DIR = Path(__file__).resolve().parent
SCRIPTS_DIR = BASE_DIR / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.append(str(SCRIPTS_DIR))

try:
    from crud_clientes_sistema import SistemaCRUDClientes
except Exception as e:
    sg.popup_error("Error al cargar módulos del script CRUD:\n" + str(e))
    raise

# Layout helpers
def make_table_data(df):
    if df is None or df.empty:
        return ([], [])
    cols = ['id', 'nombre', 'telefono', 'dni', 'estatus_comercial_categoria']
    cols_present = [c for c in cols if c in df.columns]
    data = df[cols_present].fillna('').astype(str).values.tolist()
    return (cols_present, data)

# Thread-safe runner for heavy tasks
def run_in_thread(fn, callback=None):
    def _worker():
        try:
            res = fn()
            if callback:
                window.write_event_value('-THREAD-DONE-', (True, res))
        except Exception as e:
            if callback:
                window.write_event_value('-THREAD-DONE-', (False, traceback.format_exc()))
    threading.Thread(target=_worker, daemon=True).start()

# Initialize system
sistema = SistemaCRUDClientes()
connected = False
loaded = False

# GUI Layout
sg.theme('LightBlue3')

left_col = [
    [sg.Button('Conectar BD', key='-CONNECT-')],
    [sg.Text('Estado:', size=(12,1)), sg.Text('Desconectado', key='-STATUS-', text_color='red')],
    [sg.HorizontalSeparator()],
    [sg.Text('Buscar cliente (ID/DNI/Nombre/Teléfono)')],
    [sg.Input(key='-SEARCH-'), sg.Button('Buscar', key='-SEARCH-BTN-')],
    [sg.Text('Resultados')],
    [sg.Table(values=[], headings=[], enable_events=True, key='-TABLE-', auto_size_columns=False, col_widths=[6,30,12,12,18], num_rows=12, expand_x=True, expand_y=True)],
    [sg.Button('Ver Detalle', key='-VIEW-'), sg.Button('Recargar Datos', key='-RELOAD-')]
]

# Form for create / edit
form_fields = [
    ('Nombre', 'nombre'),
    ('Teléfono', 'telefono'),
    ('DNI', 'dni'),
    ('Email', 'email'),
    ('Dirección', 'direccion'),
    ('Ciudad', 'ciudad'),
    ('Categoría', 'estatus_comercial_categoria'),
    ('Subcategoría', 'estatus_comercial_subcategoria'),
]

form_inputs = []
for label, key in form_fields:
    form_inputs.append([sg.Text(label, size=(18,1)), sg.Input(key=key, size=(30,1))])

right_col = [
    [sg.TabGroup([[
        [sg.Tab('Crear Cliente', form_inputs + [[sg.Button('Crear', key='-CREATE-')]])],
        [sg.Tab('Editar / Eliminar', [[sg.Text('ID a editar/eliminar'), sg.Input(key='-EDIT-ID-', size=(12,1)), sg.Button('Cargar', key='-LOAD-')],
                                     [sg.HorizontalSeparator()] ] + form_inputs + [[sg.Button('Actualizar', key='-UPDATE-'), sg.Button('Eliminar', key='-DELETE-')]])],
        [sg.Tab('Export / Sync', [[sg.Button('Exportar Excel', key='-EXPORT-XLSX-'), sg.Button('Exportar CSV', key='-EXPORT-CSV-')],
                                  [sg.Button('Sincronizar con Frontend', key='-SYNC-')]])],
        [sg.Tab('Estadísticas', [[sg.Multiline('', size=(60,10), key='-STATS-', disabled=True)]])]
    ]])]
]

layout = [[sg.Column(left_col, vertical_alignment='top', element_justification='left'), sg.VSeparator(), sg.Column(right_col)]]

window = sg.Window('Albru Brunario - Gestor Clientes', layout, resizable=True, finalize=True)

# Helper functions

def connect_and_load():
    global connected, loaded
    ok = sistema.conectar_bd()
    if not ok:
        raise RuntimeError('No se pudo conectar a la BD')
    connected = True
    loaded = sistema.cargar_datos()
    return 'Conectado' if ok else 'Desconectado'

def refresh_table():
    if not sistema.df_clientes is None:
        cols, data = make_table_data(sistema.df_clientes)
        window['-TABLE-'].update(values=data, headings=cols)

def show_stats():
    if sistema.df_clientes is None:
        window['-STATS-'].update('No hay datos cargados.')
        return
    total = len(sistema.df_clientes)
    completados = len(sistema.df_clientes[sistema.df_clientes['wizard_completado'] == 1]) if 'wizard_completado' in sistema.df_clientes.columns else 0
    sin_gestionar = len(sistema.df_clientes[(sistema.df_clientes['wizard_completado'] != 1) | (sistema.df_clientes['wizard_completado'].isna())])
    asesores = len(sistema.df_asesores) if sistema.df_asesores is not None else 0
    activos_asesores = len(sistema.df_asesores[sistema.df_asesores['estado'] == 'activo']) if sistema.df_asesores is not None and 'estado' in sistema.df_asesores.columns else 0
    txt = f"Total Clientes: {total}\nWizard completado: {completados}\nClientes sin gestionar: {sin_gestionar}\nTotal Asesores: {asesores}\nAsesores activos: {activos_asesores}\n"
    window['-STATS-'].update(txt)

# Main event loop
try:
    while True:
        event, values = window.read()
        if event == sg.WIN_CLOSED:
            break

        if event == '-CONNECT-':
            window['-STATUS-'].update('Conectando...', text_color='orange')
            try:
                connect_and_load()
                window['-STATUS-'].update('Conectado', text_color='green')
                refresh_table()
                show_stats()
                sg.popup_ok('Conexión establecida y datos cargados')
            except Exception as e:
                window['-STATUS-'].update('Error', text_color='red')
                sg.popup_error('Error al conectar o cargar datos:\n' + str(e))

        if event == '-RELOAD-':
            try:
                if not connected:
                    sg.popup_error('No estás conectado. Pulsa Conectar BD primero.')
                else:
                    sistema.cargar_datos()
                    refresh_table()
                    show_stats()
                    sg.popup('Datos recargados')
            except Exception as e:
                sg.popup_error('Error recargando datos:\n' + str(e))

        if event == '-SEARCH-BTN-':
            term = values.get('-SEARCH-', '').strip()
            if not term:
                sg.popup('Introduce un término de búsqueda')
                continue
            try:
                res = sistema.buscar_cliente(term)
                cols, data = make_table_data(res)
                window['-TABLE-'].update(values=data, headings=cols)
            except Exception as e:
                sg.popup_error('Error buscando cliente:\n' + str(e))

        if event == '-VIEW-':
            selected = values.get('-TABLE-')
            if not selected:
                sg.popup('Selecciona una fila de la tabla primero')
                continue
            row_idx = selected[0]
            table_values = window['-TABLE-'].get()
            try:
                client_id = int(table_values[row_idx][0])
                sistema.mostrar_cliente_completo(client_id)
                sg.popup('Detalle mostrado en consola')
            except Exception as e:
                sg.popup_error('No se pudo mostrar detalle:\n' + str(e))

        if event == '-CREATE-':
            datos = {k: values.get(k, '').strip() for (_, k) in form_fields}
            if not datos['nombre'] or not datos['telefono']:
                sg.popup_error('Nombre y teléfono son obligatorios')
                continue
            try:
                ok, msg = sistema.crear_cliente(datos)
                if ok:
                    sg.popup_ok(msg)
                    sistema.cargar_datos()
                    refresh_table()
                    show_stats()
                else:
                    sg.popup_error(msg)
            except Exception as e:
                sg.popup_error('Error creando cliente:\n' + str(e))

        if event == '-LOAD-':
            try:
                cid = values.get('-EDIT-ID-')
                if not cid:
                    sg.popup('Introduce un ID válido')
                    continue
                cid = int(cid)
                df = sistema.df_clientes
                if df is None or df.empty:
                    sg.popup('No hay datos cargados')
                    continue
                row = df[df['id'] == cid]
                if row.empty:
                    sg.popup('Cliente no encontrado')
                    continue
                row = row.iloc[0]
                for label, key in form_fields:
                    window[key].update(row.get(key, '') if key in row.index else '')
                sg.popup('Datos cargados en el formulario de edición')
            except Exception as e:
                sg.popup_error('Error cargando cliente:\n' + str(e))

        if event == '-UPDATE-':
            try:
                cid = values.get('-EDIT-ID-')
                if not cid:
                    sg.popup('Introduce ID')
                    continue
                cid = int(cid)
                datos = {k: values.get(k, '').strip() for (_, k) in form_fields}
                if not datos:
                    sg.popup('No hay cambios')
                    continue
                ok, msg = sistema.editar_cliente(cid, datos)
                if ok:
                    sg.popup_ok(msg)
                    sistema.cargar_datos()
                    refresh_table()
                    show_stats()
                else:
                    sg.popup_error(msg)
            except Exception as e:
                sg.popup_error('Error actualizando cliente:\n' + str(e))

        if event == '-DELETE-':
            try:
                cid = values.get('-EDIT-ID-')
                if not cid:
                    sg.popup('Introduce ID')
                    continue
                cid = int(cid)
                if sg.popup_yes_no(f"¿Confirmas la eliminación del cliente ID {cid}?") == 'Yes':
                    ok, msg = sistema.eliminar_cliente(cid)
                    if ok:
                        sg.popup_ok(msg)
                        sistema.cargar_datos()
                        refresh_table()
                        show_stats()
                    else:
                        sg.popup_error(msg)
            except Exception as e:
                sg.popup_error('Error eliminando cliente:\n' + str(e))

        if event == '-EXPORT-XLSX-':
            try:
                ok = sistema.exportar_excel()
                if ok:
                    sg.popup('Exportado a Excel correctamente')
                else:
                    sg.popup_error('Error en exportación Excel')
            except Exception as e:
                sg.popup_error('Error generando Excel:\n' + str(e))

        if event == '-EXPORT-CSV-':
            try:
                ok = sistema.exportar_csv()
                if ok:
                    sg.popup('Exportado a CSV correctamente')
                else:
                    sg.popup_error('Error en exportación CSV')
            except Exception as e:
                sg.popup_error('Error generando CSV:\n' + str(e))

        if event == '-SYNC-':
            try:
                ok = sistema.sincronizar_frontend()
                if ok:
                    sg.popup('Sincronización completada')
                else:
                    sg.popup_error('Error sincronizando con frontend')
            except Exception as e:
                sg.popup_error('Error en sincronización:\n' + str(e))

except Exception as e:
    sg.popup_error('Error inesperado en la interfaz:\n' + str(e) + '\n' + traceback.format_exc())

finally:
    try:
        sistema.cerrar_conexion()
    except Exception:
        pass
    window.close()
