# Datos de Ejemplo - Historial de Gestiones

## 📋 Descripción

Este documento describe la estructura y datos de ejemplo para la tabla `historial_gestiones`, que registra cada paso del proceso de gestión de clientes.

## 🗄️ Estructura de la Tabla

```sql
CREATE TABLE historial_gestiones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  telefono VARCHAR(20),
  paso INT NOT NULL,
  asesor_nombre VARCHAR(255),
  asesor_id INT,
  categoria VARCHAR(100),
  subcategoria VARCHAR(100),
  tipo_contacto VARCHAR(50) DEFAULT 'telefónico',
  resultado ENUM(
    'contacto_efectivo',
    'no_contesta',
    'numero_invalido',
    'promesa_pago',
    'pago_realizado',
    'no_interesado'
  ),
  observaciones TEXT,
  comentario TEXT,
  fecha_gestion DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  INDEX idx_cliente_paso (cliente_id, paso),
  INDEX idx_telefono (telefono),
  INDEX idx_asesor (asesor_id),
  INDEX idx_fecha (fecha_gestion)
);
```

## 📊 Datos de Ejemplo

### Cliente 1 - Proceso Completo (3 pasos)
**ID Cliente:** 1  
**Teléfono:** 999888777

| Paso | Asesor | Categoría | Subcategoría | Resultado | Fecha |
|------|--------|-----------|--------------|-----------|-------|
| 1 | Juan Pérez | Sin facilidades | Primera gestión | Contacto efectivo | Hace 5 días |
| 2 | María García | Sin facilidades | Seguimiento | Contacto efectivo | Hace 3 días |
| 3 | Carlos López | Rechazado | Cierre | No interesado | Hace 1 día |

**Timeline del proceso:**
1. **Paso 1:** Primera llamada exitosa, cliente mostró interés
2. **Paso 2:** Seguimiento con envío de documentación
3. **Paso 3:** Cliente decide no continuar, cierre del caso

---

### Cliente 2 - En Proceso (2 pasos)
**ID Cliente:** 2  
**Teléfono:** 988777666

| Paso | Asesor | Categoría | Subcategoría | Resultado | Fecha |
|------|--------|-----------|--------------|-----------|-------|
| 1 | Ana Torres | Sin facilidades | Contacto inicial | Contacto efectivo | Hace 4 días |
| 2 | Juan Pérez | Con facilidades | Evaluación | Promesa de pago | Hace 2 días |

**Timeline del proceso:**
1. **Paso 1:** Contacto inicial por email, cliente solicita información
2. **Paso 2:** Evaluación telefónica, cliente acepta plan de pago en 2 cuotas

---

### Cliente 3 - Inicio Reciente (1 paso)
**ID Cliente:** 3  
**Teléfono:** 977666555

| Paso | Asesor | Categoría | Subcategoría | Resultado | Fecha |
|------|--------|-----------|--------------|-----------|-------|
| 1 | María García | Sin facilidades | Primera gestión | Contacto efectivo | Hace 1 día |

**Timeline del proceso:**
1. **Paso 1:** Primera gestión por WhatsApp, cliente responde positivamente

---

### Cliente 4 - Proceso Largo Exitoso (4 pasos)
**ID Cliente:** 4  
**Teléfono:** 966555444

| Paso | Asesor | Categoría | Subcategoría | Resultado | Fecha |
|------|--------|-----------|--------------|-----------|-------|
| 1 | Carlos López | Sin facilidades | Contacto inicial | No contesta | Hace 7 días |
| 2 | Ana Torres | Sin facilidades | Reintento | Contacto efectivo | Hace 5 días |
| 3 | Juan Pérez | Con facilidades | Negociación | Contacto efectivo | Hace 3 días |
| 4 | María García | Pagado | Cierre exitoso | Pago realizado | Hoy |

**Timeline del proceso:**
1. **Paso 1:** Primer intento fallido, buzón de voz
2. **Paso 2:** Segundo intento exitoso, cliente estaba ocupado
3. **Paso 3:** Reunión presencial en oficina, negociación de facilidades
4. **Paso 4:** Cierre exitoso con pago completo confirmado

---

### Cliente 5 - Sin Contacto (1 paso)
**ID Cliente:** 5  
**Teléfono:** 955444333

| Paso | Asesor | Categoría | Subcategoría | Resultado | Fecha |
|------|--------|-----------|--------------|-----------|-------|
| 1 | Carlos López | Sin facilidades | Intento de contacto | Número inválido | Hace 2 días |

**Timeline del proceso:**
1. **Paso 1:** Intento de contacto, número fuera de servicio

---

## 🎯 Casos de Uso

### 1. Proceso Exitoso Completo
**Cliente 4** muestra el flujo completo desde el contacto inicial hasta el pago:
- Múltiples intentos de contacto
- Diferentes asesores involucrados
- Escalamiento a reunión presencial
- Cierre con pago confirmado

### 2. Proceso con Rechazo
**Cliente 1** muestra un proceso que termina en rechazo:
- Contacto inicial exitoso
- Seguimiento adecuado
- Cliente decide no continuar

### 3. Proceso en Curso
**Cliente 2** y **Cliente 3** están en proceso activo:
- Diferentes etapas del proceso
- Esperando siguiente gestión

### 4. Casos Especiales
**Cliente 5** muestra un caso de número inválido que requiere actualización de datos

---

## 📈 Visualización en el Frontend

El stepper mostrará:

```
[✓] Paso 1          [✓] Paso 2          [✓] Paso 3
Juan Pérez          María García        Carlos López
Sin facilidades     Sin facilidades     Rechazado
Hace 5 días         Hace 3 días         Hace 1 día
Contacto efectivo   Contacto efectivo   No interesado
```

---

## 🔧 Scripts Relacionados

- **`importar_datos_reales.ps1`** - Script PowerShell para importar estos datos de ejemplo
- **`clean_import.sql`** - Script SQL para limpiar la tabla antes de importar

---

## 📝 Notas Importantes

1. **Campo `paso`**: Es incremental y comienza en 1 para cada cliente
2. **Campo `cliente_id`**: Debe corresponder a un ID existente en la tabla `clientes`
3. **Campo `fecha_gestion`**: Se usa para ordenar cronológicamente el proceso
4. **Múltiples asesores**: Un mismo cliente puede ser gestionado por diferentes asesores
5. **Categorías dinámicas**: Cambian según el avance del proceso (Sin facilidades → Con facilidades → Pagado)

---

## ✅ Validación

Para verificar que los datos se importaron correctamente:

```sql
-- Ver todos los registros
SELECT * FROM historial_gestiones ORDER BY cliente_id, paso;

-- Ver resumen por cliente
SELECT 
    cliente_id,
    COUNT(*) as total_pasos,
    MIN(fecha_gestion) as primera_gestion,
    MAX(fecha_gestion) as ultima_gestion,
    GROUP_CONCAT(DISTINCT asesor_nombre) as asesores
FROM historial_gestiones
GROUP BY cliente_id;

-- Ver último paso de cada cliente
SELECT hg.*
FROM historial_gestiones hg
INNER JOIN (
    SELECT cliente_id, MAX(paso) as ultimo_paso
    FROM historial_gestiones
    GROUP BY cliente_id
) ultimo ON hg.cliente_id = ultimo.cliente_id AND hg.paso = ultimo.ultimo_paso;
```
