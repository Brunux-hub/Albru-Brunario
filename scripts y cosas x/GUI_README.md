# Interfaz Visual - Gestor Clientes (Desktop)

Se añadieron herramientas para ejecutar el sistema CRUD de clientes con una interfaz gráfica de escritorio (PySimpleGUI) y una interfaz visual de backup (Gradio).

## Archivos nuevos

- `crud_gui.py` — Interfaz de escritorio con PySimpleGUI para gestionar clientes (buscar, crear, editar, eliminar, exportar y sincronizar sin cambiar la lógica existente).
- `crud_gui.bat` — Script Windows para lanzar `crud_gui.py` (verifica dependencias y ejecuta la app).
- `backup_ui.py` — Interfaz web para backup y diagnóstico (Gradio) — creada anteriormente.
- `backup_ui.bat` — Script Windows para lanzar `backup_ui.py`.

## Cómo usar

Recomendado: ejecutar el `.bat` correspondiente desde el explorador o terminal para que verifique dependencias automáticamente.

Ejemplo (PowerShell):

```powershell
# Ejecutar GUI desktop CRUD
.\crud_gui.bat

# Ejecutar interfaz web de backup
.\backup_ui.bat
```

Si prefieres lanzarlo directamente con Python:

```powershell
python crud_gui.py
python backup_ui.py
```

## Notas

- Las UIs reutilizan las clases existentes en `scripts/crud_clientes_sistema.py` y `scripts/backup_y_diagnostico.py` (no se modificó la lógica original).
- Asegúrate de que la base de datos esté accesible y que los valores del `.env` sean correctos (DB_HOST, DB_USER, DB_PASSWORD, DB_PORT=3308).

Si quieres, puedo:
- Empaquetar `crud_gui.py` como un .exe (PyInstaller) para distribución como "programita".
- Mejorar diseño (iconos, validaciones, layout) o añadir perfiles de exportación rápida.
