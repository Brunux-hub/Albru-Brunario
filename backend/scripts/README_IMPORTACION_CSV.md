# 📊 Scripts de Importación CSV → MySQL

Scripts con interfaz gráfica para importar clientes e historial de gestiones desde archivos CSV a la base de datos MySQL.

## 📁 Archivos

- **`importar_csv_clientes.py`** - Importa datos de clientes a la tabla `clientes`
- **`importar_csv_historial.py`** - Importa historial de gestiones a la tabla `historial_cliente`

---

## 🚀 Instalación de Dependencias

Antes de usar los scripts, instala las librerías necesarias:

```bash
pip install pandas mysql-connector-python openpyxl
```

**Nota:** `tkinter` viene incluido en Python estándar (no requiere instalación).

- `pandas` - Para lectura de CSV y Excel
- `mysql-connector-python` - Para conexión a MySQL
- `openpyxl` - Para lectura de archivos Excel (.xlsx)

---

## 📊 Script 1: Importar Clientes

### Uso

1. Ejecutar el script:
   ```bash
   python backend/scripts/importar_csv_clientes.py
   ```

2. Configurar conexión a BD:
   - **Host:** `localhost`
   - **Puerto:** `3308` (o el puerto de tu MySQL)
   - **Usuario:** `root`
   - **Contraseña:** (tu contraseña de MySQL)
   - **Base de Datos:** `albru`

3. Seleccionar archivo CSV con datos de clientes

4. Elegir modo de importación:
   - **Insertar solo nuevos:** Omite duplicados (por teléfono)
   - **Actualizar solo existentes:** Actualiza clientes que ya existen
   - **Sobrescribir:** Inserta nuevos + actualiza existentes

5. Clic en **IMPORTAR**

### Formatos Soportados

✅ **CSV** (separador `;` punto y coma)  
✅ **Excel** (.xlsx, .xls)

El archivo debe tener las siguientes columnas **obligatorias**:

- `telefono` *(requerido)*
- `nombre` *(requerido)*

Columnas opcionales (todas las del CSV adjunto son compatibles):

```
id, tipo_base, leads_original_telefono, campana, canal_adquisicion, 
sala_asignada, compania, back_office_info, tipificacion_back, 
datos_leads, comentarios_back, ultima_fecha_gestion, fecha_ultimo_contacto,
notas, created_at, updated_at, tipo_cliente_wizard, lead_score,
telefono_registro, fecha_nacimiento, dni_nombre_titular, parentesco_titular,
telefono_referencia_wizard, telefono_grabacion_wizard, direccion_completa,
numero_piso_wizard, tipo_plan, servicio_contratado, velocidad_contratada,
precio_plan, dispositivos_adicionales_wizard, plataforma_digital_wizard,
pago_adelanto_instalacion_wizard, wizard_completado, fecha_wizard_completado,
wizard_data_json, dni, asesor_asignado, validador_asignado,
fecha_asignacion_validador, estatus_wizard, seguimiento_status, derivado_at,
opened_at, last_activity, estatus_comercial_categoria, 
estatus_comercial_subcategoria, quality_status, returned_at, es_duplicado,
telefono_principal_id, cantidad_duplicados, tipificacion_original
```

### Características

✅ **Detección de duplicados** por teléfono (con o sin espacios)  
✅ **Conversión automática de fechas** (varios formatos)  
✅ **Conversión de tipos** (números, booleanos, fechas)  
✅ **Validación de campos requeridos**  
✅ **Procesamiento por lotes** (commits cada 100 registros)  
✅ **Logging detallado** (guardado en `backend/scripts/logs/`)  
✅ **Múltiples encodings** (UTF-8, Latin-1, ISO-8859-1, CP1252)

### Logs

Los logs se guardan en:
```
backend/scripts/logs/import_clientes_YYYYMMDD_HHMMSS.log
```

---

## 📝 Script 2: Importar Historial de Gestiones

### Uso

1. Ejecutar el script:
   ```bash
   python backend/scripts/importar_csv_historial.py
   ```

2. Configurar conexión (igual que script de clientes)

3. Seleccionar archivo CSV con historial de gestiones

4. Clic en **IMPORTAR**

### Formato CSV Esperado

El CSV debe tener separador `;` y las siguientes columnas **obligatorias**:

- `cliente_id` *(ID del cliente en tabla clientes)*
- `usuario_id` *(ID del usuario en tabla usuarios)*
- `accion` *(Tipo de acción: reasignado_asesor, en_gestion, moved_to_gtr, etc.)*

Columnas opcionales:

```
descripcion, estado_anterior, estado_nuevo, created_at
```

### Validaciones

✅ **Verifica que `cliente_id` exista** en tabla `clientes`  
✅ **Verifica que `usuario_id` exista** en tabla `usuarios`  
✅ **Omite registros con referencias inválidas**  
✅ **Logging detallado** de omitidos y errores

### Logs

Los logs se guardan en:
```
backend/scripts/logs/import_historial_YYYYMMDD_HHMMSS.log
```

---

## 🔧 Ejemplo de Uso

### Importar clientes (modo insertar solo nuevos)

```bash
# 1. Ejecutar script
python backend/scripts/importar_csv_clientes.py

# 2. Configurar:
#    - Host: localhost
#    - Puerto: 3308
#    - Usuario: root
#    - Password: (tu contraseña)
#    - BD: albru

# 3. Seleccionar archivo CSV
#    Ejemplo: clientes (updated).csv

# 4. Modo: "Insertar solo nuevos"

# 5. IMPORTAR

# Resultado:
# ✅ Insertados:   150
# ⏭️ Duplicados:   50
# ❌ Errores:      0
```

### Importar historial de gestiones

```bash
# 1. Ejecutar script
python backend/scripts/importar_csv_historial.py

# 2. Configurar BD (igual que arriba)

# 3. Seleccionar archivo CSV
#    Ejemplo: historial_gestiones.csv

# 4. IMPORTAR

# Resultado:
# ✅ Insertados: 500
# ⏭️ Omitidos:   10
# ❌ Errores:    0
```

---

## 📌 Notas Importantes

### Conversión de Fechas

Los scripts convierten automáticamente fechas en estos formatos:

- `2025/01/15`
- `2025-01-15`
- `15/01/2025`
- `15-01-2025`
- `2025/01/15 14:30:00`
- `2025-01-15 14:30:00`

### Manejo de Valores Nulos

Los siguientes valores se interpretan como `NULL`:

- Campos vacíos
- `NULL` (texto)
- `NaN` (pandas)

### Encoding de Archivos

El script intenta leer el CSV con múltiples encodings en este orden:

1. UTF-8
2. Latin-1
3. ISO-8859-1
4. CP1252

### Duplicados en Clientes

Se considera duplicado si:

- El **teléfono** (limpio, sin espacios ni guiones) ya existe en la BD

Ejemplo:
- CSV: `917385135`
- BD: `917 385 135`
- ✅ **Detectado como duplicado**

---

## 🛠️ Solución de Problemas

### Error: "No module named 'pandas'"

```bash
pip install pandas
```

### Error: "No module named 'mysql'"

```bash
pip install mysql-connector-python
```

### Error: "Access denied for user 'root'@'localhost'"

- Verifica que la contraseña sea correcta
- Verifica que el puerto sea el correcto (`3308` para contenedor Docker)

### Error: "Can't connect to MySQL server"

- Verifica que MySQL esté corriendo:
  ```bash
  docker ps | Select-String mysql
  ```
- Verifica el puerto (debe ser `3308` si usas el contenedor)

### CSV no se lee correctamente

- Verifica el separador (debe ser `;` por defecto)
- Puedes modificar el separador en el código:
  ```python
  df = self.leer_csv(archivo_path, separador=',')  # Si usas coma
  ```

---

## 📖 Estructura de Tablas

### Tabla `clientes`

Campos principales:
- `id` (AUTO_INCREMENT)
- `nombre` VARCHAR(100) NOT NULL
- `telefono` VARCHAR(20) NOT NULL
- `dni` VARCHAR(50)
- `campana` VARCHAR(100)
- `canal_adquisicion` VARCHAR(100)
- `asesor_asignado` INT
- `seguimiento_status` VARCHAR(64)
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

### Tabla `historial_cliente`

Campos:
- `id` (AUTO_INCREMENT)
- `cliente_id` INT NOT NULL (FK → clientes.id)
- `usuario_id` INT NOT NULL (FK → usuarios.id)
- `accion` VARCHAR(100) NOT NULL
- `descripcion` TEXT
- `estado_anterior` VARCHAR(50)
- `estado_nuevo` VARCHAR(50)
- `created_at` TIMESTAMP

---

## 🎯 Casos de Uso

### 1. Migración inicial de datos

Importar todos los clientes de un CSV:

```
Modo: "Insertar solo nuevos"
```

### 2. Actualización masiva

Actualizar información de clientes existentes:

```
Modo: "Actualizar solo existentes"
```

### 3. Sincronización completa

Insertar nuevos + actualizar existentes:

```
Modo: "Sobrescribir"
```

### 4. Importar historial desde backup

Restaurar historial de gestiones:

```
Script: importar_csv_historial.py
```

---

## 📞 Soporte

Para más información o reportar problemas:

- Revisa los logs en `backend/scripts/logs/`
- Verifica la consola para mensajes de error
- Revisa la estructura del CSV

---

**Autor:** Claude AI  
**Fecha:** 2025-11-21  
**Versión:** 1.0
