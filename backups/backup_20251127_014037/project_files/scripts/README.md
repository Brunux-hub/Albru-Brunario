# 🐍 Scripts Python - Albru Brunario CRM

Este directorio contiene scripts Python para gestión avanzada del CRM.

---

## 📋 SCRIPTS DISPONIBLES

### 1. 🔧 `crud_clientes_sistema.py`

**Sistema CRUD Completo para Gestión de Clientes**

Sistema interactivo que permite:
- ✅ Buscar cliente por número, DNI, ID o nombre
- ✅ Visualizar historial completo de categorías, subcategorías y asesores
- ✅ Crear nuevos clientes con validación de duplicados
- ✅ Editar clientes existentes
- ✅ Eliminar clientes (con confirmación)
- ✅ Sincronización automática con frontend (JSON)
- ✅ Exportar a Excel/CSV
- ✅ Interfaz de consola con rich

**Uso**:
```powershell
cd C:\Users\USER\Albru-Brunario
python scripts/crud_clientes_sistema.py
```

**Ejemplo de sesión**:
```
╔═══════════════════════════════════════════════════════════════════════╗
║          SISTEMA CRUD CLIENTES - ALBRU BRUNARIO CRM                   ║
╚═══════════════════════════════════════════════════════════════════════╝

🔌 Conectando a base de datos...
✓ Conectado a MySQL Server 8.0.43
📥 Cargando datos desde la base de datos...
✓ Clientes cargados: 8,432
✓ Historial de estados: 45,231
✓ Historial de gestiones: 12,543
✓ Asesores: 17

======================================================================
MENÚ PRINCIPAL
======================================================================
  [1] 🔍 Buscar Cliente
  [2] ➕ Crear Nuevo Cliente
  [3] ✏️  Editar Cliente
  [4] ❌ Eliminar Cliente
  [5] 📊 Exportar a Excel
  [6] 📄 Exportar a CSV
  [7] 🔄 Sincronizar con Frontend
  [8] 📋 Ver Estadísticas
  [9] 🔄 Recargar Datos
  [0] 🚪 Salir

Seleccione una opción: _
```

---

### 2. 📦 `backup_y_diagnostico.py`

**Sistema de Backup y Diagnóstico Inteligente**

Script completo que:
- ✅ Genera dump SQL completo (compatible con producción)
- ✅ Exporta datos a JSON
- ✅ Copia archivos del proyecto
- ✅ Empaqueta todo en ZIP
- ✅ Ejecuta diagnóstico inteligente
- ✅ Verifica integridad de datos
- ✅ Genera reporte detallado

**Uso**:
```powershell
cd C:\Users\USER\Albru-Brunario
python scripts/backup_y_diagnostico.py
```

**Salida esperada**:
```
╔═══════════════════════════════════════════════════════════════════════╗
║        SISTEMA DE BACKUP Y DIAGNÓSTICO INTELIGENTE                    ║
║        ALBRU BRUNARIO CRM - Versión 1.0                               ║
╚═══════════════════════════════════════════════════════════════════════╝

⠋ Preparando entorno...          ███████████████████ 100%
⠙ Conectando a base de datos...  ███████████████████ 100%
⠹ Generando dump SQL completo... ███████████████████ 100%
⠸ Exportando datos a JSON...     ███████████████████ 100%
⠼ Copiando archivos...           ███████████████████ 100%
⠴ Empaquetando backup...         ███████████████████ 100%

🔍 DIAGNÓSTICO INTELIGENTE DEL SISTEMA

📊 1. VERIFICACIÓN DE ESTRUCTURA DE BASE DE DATOS
  ✓ Tabla 'clientes' - Estructura completa
  ✓ Tabla 'usuarios' - Estructura completa
  ✓ Tabla 'asesores' - Estructura completa
  ...

✅ Estructura de BD: PERFECTA

🔍 2. VERIFICACIÓN DE INTEGRIDAD DE DATOS
  ✓ Todos los clientes tienen nombre y teléfono
  ✓ Todos los asesores asignados son válidos
  ✓ Todos los usuarios tienen tipo definido
  ...

✅ Integridad de Datos: PERFECTA

╔═══════════════════════════════════════════════════════════════════════╗
║                   ✅ BACKUP COMPLETAMENTE FUNCIONAL                   ║
║                                                                       ║
║ El backup está perfectamente preparado para migración.                ║
║ Todos los componentes han sido verificados y están en orden.          ║
║ Puede proceder con confianza a migrar a otra PC.                      ║
╚═══════════════════════════════════════════════════════════════════════╝

✓ Backup empaquetado: backup_completo_20251126_153045.zip (542.34 MB)
```

---

## 🛠️ INSTALACIÓN

### Requisitos Previos

- **Python 3.8+** instalado
- **MySQL** (a través de Docker o instalación local)
- Acceso a la base de datos del CRM

### Paso 1: Verificar Python

```powershell
# Verificar versión de Python
python --version

# Debería mostrar: Python 3.8.x o superior
```

Si no tienes Python instalado:
1. Descargar desde: https://www.python.org/downloads/
2. Instalar con opción "Add Python to PATH"
3. Reiniciar PowerShell

### Paso 2: Instalar Dependencias

**Opción A: Instalación Rápida (todas las librerías)**

```powershell
cd C:\Users\USER\Albru-Brunario
pip install mysql-connector-python pandas rich openpyxl
```

**Opción B: Usando requirements.txt**

Crear `scripts/requirements.txt`:
```txt
mysql-connector-python==8.2.0
pandas==2.1.3
rich==13.7.0
openpyxl==3.1.2
```

Instalar:
```powershell
cd C:\Users\USER\Albru-Brunario
pip install -r scripts/requirements.txt
```

### Paso 3: Configurar Variables de Entorno

Los scripts usan las mismas variables del archivo `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=albru
DB_PASSWORD=albru_pass
DB_NAME=albru
```

**Verificar que Docker esté corriendo**:
```powershell
docker ps

# Deberías ver el contenedor 'albru-base' corriendo
```

---

## 📦 DEPENDENCIAS EXPLICADAS

### 1. `mysql-connector-python`
**Propósito**: Conectar a MySQL desde Python  
**Uso**: Ejecutar consultas SQL, leer/escribir datos  
**Alternativas**: `pymysql`, `mysqlclient`

### 2. `pandas`
**Propósito**: Manipulación avanzada de datos  
**Uso**: DataFrames, búsquedas, filtros, exportaciones  
**Tamaño**: ~50 MB con dependencias (numpy, etc.)

### 3. `rich`
**Propósito**: Interfaz de consola mejorada  
**Uso**: Tablas, paneles, colores, progress bars  
**Característica**: Terminal moderna y bonita

### 4. `openpyxl`
**Propósito**: Leer/escribir archivos Excel (.xlsx)  
**Uso**: Exportaciones a Excel  
**Opcional**: Solo necesario para función de exportar

---

## 🚀 USO RÁPIDO

### Escenario 1: Buscar un Cliente

```powershell
python scripts/crud_clientes_sistema.py
# Opción [1] - Buscar Cliente
# Ingresar: 974 346 383
```

Resultado:
```
╔═════════════════════════════════════╗
║      CLIENTE ID: 2345              ║
╚═════════════════════════════════════╝

📋 INFORMACIÓN PERSONAL
┌──────────────────────┬─────────────────────────┐
│ Campo                │ Valor                   │
├──────────────────────┼─────────────────────────┤
│ Nombre Completo      │ Juan Pérez García       │
│ DNI                  │ 12345678                │
│ Teléfono Principal   │ 974 346 383             │
...

💼 ESTADO COMERCIAL
┌──────────────────────┬─────────────────────────┐
│ Categoría            │ Sin contacto            │
│ Subcategoría         │ No contesta             │
│ Campaña              │ MASIVO                  │
...

📜 HISTORIAL DE ESTADOS (12 registros)
┌────────────────────┬──────────┬────────────┬────────────┐
│ Fecha              │ Usuario  │ Estado Ant.│ Estado Nvo.│
├────────────────────┼──────────┼────────────┼────────────┤
│ 2025-11-26 15:30   │ Andrea   │ derivado   │ en_gestion │
│ 2025-11-26 16:45   │ Andrea   │ en_gestion │ gestionado │
...
```

---

### Escenario 2: Crear Backup Completo

```powershell
python scripts/backup_y_diagnostico.py
```

**Duración**: 2-5 minutos  
**Resultado**: Archivo ZIP en `backups/backup_completo_YYYYMMDD_HHMMSS.zip`

---

### Escenario 3: Exportar Clientes a Excel

```powershell
python scripts/crud_clientes_sistema.py
# Opción [5] - Exportar a Excel
```

**Resultado**: Archivo Excel en `exports/clientes_export_YYYYMMDD_HHMMSS.xlsx`

Contenido:
- Hoja "Clientes" - Todos los clientes
- Hoja "Historial Estados" - Cambios de estado
- Hoja "Historial Gestiones" - Pasos del wizard
- Hoja "Asesores" - Lista de asesores

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: `ModuleNotFoundError: No module named 'mysql'`

**Solución**:
```powershell
pip install mysql-connector-python
```

### Error: `Access denied for user 'albru'@'localhost'`

**Solución**:
```powershell
# Verificar que Docker esté corriendo
docker ps

# Verificar variables en .env
notepad .env

# Reiniciar contenedor MySQL
docker restart albru-base
```

### Error: `pandas requires numpy>=1.23.2`

**Solución**:
```powershell
pip install --upgrade numpy pandas
```

### Error: `UnicodeDecodeError`

**Solución**: Los scripts usan `utf-8`, asegúrate que tu terminal soporte UTF-8:
```powershell
chcp 65001
python scripts/crud_clientes_sistema.py
```

### Error: `Connection refused to localhost:3306`

**Verificar Docker**:
```powershell
docker ps
docker logs albru-base

# Si no está corriendo:
docker-compose up -d
```

---

## 📚 EJEMPLOS AVANZADOS

### Exportar Solo Clientes de una Campaña Específica

Modificar temporalmente el script o usar Python interactivo:

```python
from scripts.crud_clientes_sistema import SistemaCRUDClientes

sistema = SistemaCRUDClientes()
sistema.conectar_bd()
sistema.cargar_datos()

# Filtrar por campaña
clientes_masivo = sistema.df_clientes[
    sistema.df_clientes['campana'] == 'MASIVO'
]

# Exportar
clientes_masivo.to_excel('exports/clientes_masivo.xlsx', index=False)
print(f"Exportados {len(clientes_masivo)} clientes de campaña MASIVO")
```

### Ver Estadísticas Rápidas

```python
from scripts.crud_clientes_sistema import SistemaCRUDClientes

sistema = SistemaCRUDClientes()
sistema.conectar_bd()
sistema.cargar_datos()

print(f"Total clientes: {len(sistema.df_clientes)}")
print(f"Clientes sin gestionar: {len(sistema.df_clientes[sistema.df_clientes['wizard_completado'] != 1])}")
print(f"Clientes gestionados hoy: {len(sistema.df_clientes[sistema.df_clientes['fecha_wizard_completado'].dt.date == pd.Timestamp.today().date()])}")
```

---

## 🔒 SEGURIDAD

### Mejores Prácticas

1. **Nunca compartir** scripts con credenciales hardcodeadas
2. **Usar siempre** variables de entorno (.env)
3. **No subir** archivos de backup a repositorios públicos
4. **Encriptar** backups cuando se almacenen en la nube
5. **Eliminar** exports antiguos regularmente

### Proteger Backups

```powershell
# Comprimir con contraseña (usando 7zip)
7z a -p"tu_password_segura" backup_protegido.7z backups/backup_completo_*.zip

# O usar VeraCrypt para contenedor encriptado
```

---

## 📞 SOPORTE

Si encuentras problemas:

1. **Revisar logs de Python**: Los scripts muestran mensajes detallados
2. **Verificar Docker**: `docker ps` y `docker logs albru-base`
3. **Revisar .env**: Credenciales correctas
4. **Actualizar dependencias**: `pip install --upgrade -r requirements.txt`

---

## 🎯 ROADMAP

### Próximas Mejoras

- [ ] Interfaz gráfica (Tkinter o PyQt)
- [ ] Importación masiva desde CSV/Excel
- [ ] Reportes personalizados en PDF
- [ ] Integración con WhatsApp API
- [ ] Dashboard web con Flask
- [ ] Automatización de backups (cron/scheduler)

---

**Versión**: 1.0  
**Última Actualización**: Noviembre 2025  
**Mantenedor**: Sistema Albru Brunario CRM
