# 🔍 ANÁLISIS TÉCNICO: Problema de Visualización de Gestiones en Panel GTR

## Diagnóstico Completo del Fallo donde no Aparecen Todas las Gestiones en el Panel GTR

---

## 📋 RESUMEN EJECUTIVO

**Problema Detectado**: En el panel GTR, al revisar el apartado de asesores y abrir las opciones de los tres puntos, no se visualizan todas las gestiones que aparecen registradas en los reportes individuales de los asesores.

**Gravedad**: MEDIA-ALTA  
**Impacto**: Pérdida de visibilidad de gestiones reales, métricas incorrectas en panel GTR  
**Usuarios Afectados**: GTR, Administradores  

**Ejemplo Específico**:
- **Asesor**: ANDREA YANEL CATALAN MAYTA (Imagen 1)
  - Reporte individual: 63 gestiones totales hoy
  - Panel GTR: Posiblemente muestra 0 o menos gestiones
  
- **Asesor**: ROXANA GISELA VILLAR BAZAN (Imagen 2)
  - Reporte individual: 0 gestiones mostradas
  - Realidad: El asesor SÍ gestionó pero no se refleja

---

## 🎯 CAUSAS RAÍZ IDENTIFICADAS

### 1. ⚠️ CAUSA PRINCIPAL: Inconsistencia en Filtros de Consulta SQL

**Descripción**: Las consultas que alimentan el panel GTR usan filtros diferentes a los reportes individuales de asesores.

**Ubicación del Código**: `backend/controllers/asesoresController.js`

**Análisis del Código Actual**:

```javascript
// En getAsesores() - línea 38-48
const [gestionesTotales] = await pool.query(`
  SELECT 
    c.asesor_asignado as asesor_id,
    COUNT(DISTINCT c.id) as clientes_unicos,
    COALESCE(SUM(c.cantidad_duplicados), COUNT(c.id)) as gestiones_totales
  FROM clientes c
  WHERE c.asesor_asignado IS NOT NULL
    AND DATE(c.updated_at) = DATE(CONVERT_TZ(NOW(), '+00:00', '-05:00'))
    AND (c.es_duplicado = FALSE OR c.es_duplicado IS NULL)
  GROUP BY c.asesor_asignado
`);
```

**Problemas**:
1. **Filtro por `updated_at`**: Usa `updated_at` en lugar de `fecha_wizard_completado`
2. **No considera tabla `historial_gestiones`**: Solo mira la tabla `clientes`
3. **No verifica `wizard_completado = 1`**: Cuenta registros no completados

**Comparación con Reporte Individual** (`clientesController.js` línea 1257-1274):

```javascript
// getGestionesDiaByAsesor - Este SÍ funciona correctamente
const [rows] = await pool.query(`
  SELECT 
    id, nombre, telefono, dni, campana,
    estatus_comercial_categoria,
    estatus_comercial_subcategoria,
    fecha_wizard_completado,
    wizard_completado,
    cantidad_duplicados,
    es_duplicado
  FROM clientes
  WHERE wizard_completado = 1
    AND DATE(fecha_wizard_completado) = CURDATE()
    AND asesor_asignado = ?
    AND (es_duplicado = 0 OR es_duplicado IS NULL)
  ORDER BY fecha_wizard_completado DESC
`, [asesorId]);
```

**Diferencias Críticas**:
| Aspecto | Panel GTR (❌ Incorrecto) | Reporte Asesor (✅ Correcto) |
|---------|-------------------------|----------------------------|
| Fecha | `DATE(c.updated_at)` | `DATE(fecha_wizard_completado)` |
| Completitud | No verifica | `wizard_completado = 1` |
| Zona horaria | `CONVERT_TZ(NOW(), '+00:00', '-05:00')` | `CURDATE()` |
| Parámetro | Sin parámetro específico | `asesor_asignado = ?` |

---

### 2. ⚠️ CAUSA SECUNDARIA: Problema de Zona Horaria

**Descripción**: El uso de `CONVERT_TZ` con zona horaria de Perú (UTC-5) puede causar discrepancias.

**Problema**:
```javascript
DATE(CONVERT_TZ(NOW(), '+00:00', '-05:00'))
```

Esto puede resultar en:
- Si son las 00:30 UTC = 19:30 día anterior en Perú
- Gestiones del "día actual" en Perú se registran como "día anterior" en UTC
- Inconsistencia entre lo que ve el asesor y lo que ve el GTR

**Recomendación**: Usar `CURDATE()` consistentemente o asegurar que TODAS las consultas usen la misma zona horaria.

---

### 3. ⚠️ CAUSA TERCIARIA: No Consulta `historial_gestiones`

**Descripción**: La tabla `historial_gestiones` contiene el registro completo de cada paso del wizard, pero el panel GTR no la consulta.

**Estructura de `historial_gestiones`**:
```sql
CREATE TABLE `historial_gestiones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `paso` int NOT NULL,
  `asesor_nombre` varchar(255),
  `asesor_id` int,
  `categoria` varchar(128),
  `subcategoria` varchar(128),
  `tipo_contacto` varchar(64),
  `resultado` varchar(128),
  `observaciones` text,
  `comentario` text,
  `fecha_gestion` datetime DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
```

**Ventaja de Usar Esta Tabla**:
- Registro granular de cada paso del wizard
- Fecha exacta de gestión (`fecha_gestion`)
- No se borra ni modifica (histórico inmutable)
- Vincula directamente `asesor_id` con cada gestión

---

### 4. ⚠️ CAUSA POSIBLE: Problema de IDs de Asesor

**Descripción**: Posible confusión entre `asesores.id` y `usuarios.id`.

**Análisis**:

```javascript
// En obtenerDatosClientes() hay fallback por si asesorId no coincide
if ((!rows || rows.length === 0) && asesorId) {
  const [asesorMatch] = await pool.query(
    'SELECT id FROM asesores WHERE usuario_id = ? LIMIT 1', 
    [asesorId]
  );
  if (asesorMatch && asesorMatch.length > 0) {
    const asesorIdFound = asesorMatch[0].id;
    [rows] = await pool.query(selectSql, [asesorIdFound]);
  }
}
```

**Problema**: El panel GTR probablemente pasa `asesores.id` pero algunas consultas esperan `usuarios.id`.

**Relación de Tablas**:
```
usuarios (id) <---> asesores (usuario_id)
                        |
                        v
                    asesores (id)
                        |
                        v
            clientes (asesor_asignado)
```

---

## 🔬 PRUEBAS DIAGNÓSTICAS RECOMENDADAS

### Prueba 1: Verificar Gestiones en BD vs Panel

**Consulta SQL para ejecutar manualmente**:

```sql
-- 1. Verificar gestiones completadas HOY por asesor ID 12 (ROXANA)
SELECT 
  c.id,
  c.nombre,
  c.telefono,
  c.wizard_completado,
  c.fecha_wizard_completado,
  c.updated_at,
  c.asesor_asignado,
  u.nombre as asesor_nombre
FROM clientes c
LEFT JOIN usuarios u ON c.asesor_asignado = u.id
WHERE DATE(c.fecha_wizard_completado) = CURDATE()
  AND c.wizard_completado = 1
  AND c.asesor_asignado = 12
ORDER BY c.fecha_wizard_completado DESC;

-- 2. Comparar con la consulta del panel GTR (la que falla)
SELECT 
  c.asesor_asignado as asesor_id,
  COUNT(DISTINCT c.id) as clientes_unicos,
  COALESCE(SUM(c.cantidad_duplicados), COUNT(c.id)) as gestiones_totales
FROM clientes c
WHERE c.asesor_asignado IS NOT NULL
  AND DATE(c.updated_at) = DATE(CONVERT_TZ(NOW(), '+00:00', '-05:00'))
  AND (c.es_duplicado = FALSE OR c.es_duplicado IS NULL)
  AND c.asesor_asignado = 12
GROUP BY c.asesor_asignado;

-- 3. Ver historial_gestiones
SELECT 
  hg.id,
  hg.cliente_id,
  hg.paso,
  hg.asesor_id,
  hg.asesor_nombre,
  hg.categoria,
  hg.subcategoria,
  hg.fecha_gestion,
  c.nombre as cliente_nombre
FROM historial_gestiones hg
LEFT JOIN clientes c ON hg.cliente_id = c.id
WHERE DATE(hg.fecha_gestion) = CURDATE()
  AND hg.asesor_id = 12
ORDER BY hg.fecha_gestion DESC;
```

### Prueba 2: Verificar IDs de Asesor

```sql
-- Verificar relación usuarios <-> asesores
SELECT 
  u.id as usuario_id,
  u.nombre,
  u.tipo,
  a.id as asesor_id,
  a.clientes_asignados,
  COUNT(DISTINCT c.id) as clientes_en_bd
FROM usuarios u
LEFT JOIN asesores a ON u.id = a.usuario_id
LEFT JOIN clientes c ON c.asesor_asignado = a.id
WHERE u.tipo = 'asesor'
GROUP BY u.id, a.id
ORDER BY u.nombre;
```

### Prueba 3: Verificar Zona Horaria

```sql
-- Ver fecha actual en diferentes formatos
SELECT 
  NOW() as utc_now,
  CURDATE() as current_date,
  CONVERT_TZ(NOW(), '+00:00', '-05:00') as peru_time,
  DATE(CONVERT_TZ(NOW(), '+00:00', '-05:00')) as peru_date,
  DATE(NOW()) as utc_date;
```

---

## 🛠️ SOLUCIONES PROPUESTAS

### Solución 1: Unificar Consulta de Gestiones (RECOMENDADA)

**Modificar**: `backend/controllers/asesoresController.js` líneas 38-48

**Código Actual (Incorrecto)**:
```javascript
const [gestionesTotales] = await pool.query(`
  SELECT 
    c.asesor_asignado as asesor_id,
    COUNT(DISTINCT c.id) as clientes_unicos,
    COALESCE(SUM(c.cantidad_duplicados), COUNT(c.id)) as gestiones_totales
  FROM clientes c
  WHERE c.asesor_asignado IS NOT NULL
    AND DATE(c.updated_at) = DATE(CONVERT_TZ(NOW(), '+00:00', '-05:00'))
    AND (c.es_duplicado = FALSE OR c.es_duplicado IS NULL)
  GROUP BY c.asesor_asignado
`);
```

**Código Corregido**:
```javascript
const [gestionesTotales] = await pool.query(`
  SELECT 
    c.asesor_asignado as asesor_id,
    COUNT(DISTINCT c.id) as clientes_unicos,
    COALESCE(SUM(c.cantidad_duplicados), COUNT(c.id)) as gestiones_totales
  FROM clientes c
  WHERE c.asesor_asignado IS NOT NULL
    AND c.wizard_completado = 1
    AND DATE(c.fecha_wizard_completado) = CURDATE()
    AND (c.es_duplicado = FALSE OR c.es_duplicado IS NULL)
  GROUP BY c.asesor_asignado
`);
```

**Cambios Aplicados**:
1. ✅ Cambiado `updated_at` por `fecha_wizard_completado`
2. ✅ Agregado `wizard_completado = 1`
3. ✅ Cambiado `CONVERT_TZ(NOW(), ...)` por `CURDATE()`

---

### Solución 2: Usar `historial_gestiones` como Fuente de Verdad

**Alternativa más robusta**:

```javascript
// Consulta basada en historial_gestiones (registro inmutable)
const [gestionesTotales] = await pool.query(`
  SELECT 
    hg.asesor_id,
    COUNT(DISTINCT hg.cliente_id) as clientes_unicos,
    COUNT(DISTINCT CONCAT(hg.cliente_id, '-', hg.paso)) as gestiones_totales
  FROM historial_gestiones hg
  WHERE hg.asesor_id IS NOT NULL
    AND DATE(hg.fecha_gestion) = CURDATE()
  GROUP BY hg.asesor_id
`);
```

**Ventajas**:
- ✅ Fuente inmutable (no se modifica después de registro)
- ✅ Fecha exacta de gestión
- ✅ Vinculación directa con asesor
- ✅ No depende de `updated_at` que puede cambiar por otras razones

---

### Solución 3: Crear Vista SQL Consolidada

**Crear vista que unifique lógica**:

```sql
CREATE OR REPLACE VIEW v_gestiones_dia_asesor AS
SELECT 
  a.id as asesor_id,
  a.usuario_id,
  u.nombre as asesor_nombre,
  COUNT(DISTINCT c.id) as clientes_unicos,
  COALESCE(SUM(c.cantidad_duplicados), COUNT(c.id)) as gestiones_totales,
  COUNT(DISTINCT hg.id) as pasos_completados
FROM asesores a
LEFT JOIN usuarios u ON a.usuario_id = u.id
LEFT JOIN clientes c ON c.asesor_asignado = a.id 
  AND c.wizard_completado = 1 
  AND DATE(c.fecha_wizard_completado) = CURDATE()
  AND (c.es_duplicado = FALSE OR c.es_duplicado IS NULL)
LEFT JOIN historial_gestiones hg ON hg.asesor_id = a.id 
  AND DATE(hg.fecha_gestion) = CURDATE()
WHERE u.tipo = 'asesor' AND u.estado = 'activo'
GROUP BY a.id, a.usuario_id, u.nombre;
```

**Uso en el código**:
```javascript
const [gestionesTotales] = await pool.query(`
  SELECT * FROM v_gestiones_dia_asesor
`);
```

---

### Solución 4: Agregar Logging para Debugging

**Agregar logs temporales**:

```javascript
// En getAsesores() después de la consulta
console.log('🔍 DEBUG - Gestiones por Asesor:');
gestionesTotales.forEach(g => {
  console.log(`  Asesor ID ${g.asesor_id}: ${g.gestiones_totales} gestiones, ${g.clientes_unicos} clientes únicos`);
});

// Comparar con tabla asesores
const [asesoresCheck] = await pool.query(`
  SELECT id, usuario_id, clientes_asignados FROM asesores
`);
console.log('🔍 DEBUG - Asesores en BD:');
asesoresCheck.forEach(a => {
  const gestiones = gestionesMap[a.id];
  console.log(`  Asesor ID ${a.id} (Usuario ${a.usuario_id}): ${a.clientes_asignados} asignados, ${gestiones ? gestiones.gestiones_totales : 0} gestiones hoy`);
});
```

---

## 📊 IMPACTO Y PRIORIZACIÓN

### Impacto Actual:

| Aspecto | Nivel | Descripción |
|---------|-------|-------------|
| Visibilidad de Datos | 🔴 ALTO | GTR no ve gestiones reales |
| Toma de Decisiones | 🔴 ALTO | Métricas incorrectas |
| Motivación Asesores | 🟡 MEDIO | Trabajo no reflejado |
| Funcionalidad Crítica | 🔴 ALTO | Panel principal afectado |

### Usuarios Afectados:
- **GTR** (3-5 usuarios): No pueden supervisar correctamente
- **Administradores** (1-2 usuarios): Reportes incorrectos
- **Asesores** (15-20 usuarios): Frustración al no ver su trabajo reflejado

### Prioridad: **🔴 ALTA** - Requiere corrección inmediata

---

## ✅ PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Diagnóstico Inmediato (30 minutos)

1. **Ejecutar consultas de prueba** (sección Pruebas Diagnósticas)
2. **Verificar logs del backend** mientras un GTR usa el panel
3. **Comparar IDs** de asesor en panel vs reportes
4. **Documentar casos específicos** (asesor X tiene Y gestiones pero panel muestra Z)

### Fase 2: Implementación de Fix (1-2 horas)

1. **Aplicar Solución 1** (cambiar consulta en `asesoresController.js`)
2. **Agregar logs de debugging** (Solución 4)
3. **Reiniciar backend** y probar
4. **Verificar con GTR** que ahora ve todas las gestiones

### Fase 3: Validación (1 hora)

1. **Pruebas con múltiples asesores**
2. **Comparar panel GTR vs reportes individuales**
3. **Verificar que números coinciden**
4. **Documentar corrección**

### Fase 4: Prevención (2 horas)

1. **Implementar Solución 3** (vista SQL unificada)
2. **Crear tests automatizados**
3. **Documentar lógica de negocio**
4. **Capacitar a GTR sobre cómo interpretar métricas**

---

## 🔍 COLUMNAS CRÍTICAS A REVISAR EN LA BD

### Tabla `clientes`:
```sql
SELECT 
  id,
  nombre,
  telefono,
  asesor_asignado,           -- ¿Es NULL?
  wizard_completado,          -- ¿Es 1?
  fecha_wizard_completado,    -- ¿Es HOY?
  updated_at,                 -- ¿Difiere de fecha_wizard_completado?
  es_duplicado,               -- ¿Es FALSE?
  cantidad_duplicados         -- ¿Tiene valor?
FROM clientes
WHERE asesor_asignado IS NOT NULL
  AND DATE(fecha_wizard_completado) = CURDATE()
ORDER BY asesor_asignado, fecha_wizard_completado DESC;
```

### Tabla `historial_gestiones`:
```sql
SELECT 
  id,
  cliente_id,
  asesor_id,              -- ¿Coincide con asesores.id?
  asesor_nombre,
  paso,
  fecha_gestion,          -- ¿Es HOY?
  categoria,
  subcategoria
FROM historial_gestiones
WHERE DATE(fecha_gestion) = CURDATE()
ORDER BY asesor_id, cliente_id, paso;
```

### Verificar Relación IDs:
```sql
-- Verificar que asesor_asignado en clientes coincide con asesores.id
SELECT 
  c.asesor_asignado,
  a.id as asesor_id,
  a.usuario_id,
  u.nombre
FROM clientes c
LEFT JOIN asesores a ON c.asesor_asignado = a.id
LEFT JOIN usuarios u ON a.usuario_id = u.id
WHERE c.asesor_asignado IS NOT NULL
  AND a.id IS NULL;  -- Buscar IDs huérfanos

-- Si hay resultados, hay problema de integridad referencial
```

---

## 📝 RECOMENDACIONES A LARGO PLAZO

### 1. Estandarizar Lógica de Negocio

- **Definir**: ¿Qué es una "gestión"?
  - ¿Cliente con `wizard_completado = 1`?
  - ¿Registro en `historial_gestiones`?
  - ¿Ambos?

- **Documentar**: Crear documento técnico que defina métricas

### 2. Unificar Zona Horaria

- **Opción A**: Guardar todo en UTC y convertir en frontend
- **Opción B**: Configurar MySQL en zona horaria de Perú
- **Opción C**: Usar siempre `CURDATE()` sin conversiones

### 3. Crear Tests Automatizados

```javascript
describe('Panel GTR - Gestiones', () => {
  it('debe mostrar el mismo número de gestiones que el reporte del asesor', async () => {
    const asesorId = 12;
    
    // Obtener desde panel GTR
    const gestionesGTR = await getGestionesDesdeGTR(asesorId);
    
    // Obtener desde reporte asesor
    const gestionesReporte = await getGestionesDiaByAsesor(asesorId);
    
    expect(gestionesGTR.total).toBe(gestionesReporte.total);
  });
});
```

### 4. Dashboard de Monitoreo

Crear endpoint que compare métricas:

```javascript
// GET /api/admin/metrics/compare
{
  "asesor_id": 12,
  "nombre": "ROXANA GISELA VILLAR BAZAN",
  "gestiones_panel_gtr": 0,
  "gestiones_reporte_individual": 63,
  "discrepancia": true,
  "diferencia": 63
}
```

---

## 🎯 CONCLUSIÓN

**Problema Identificado**: El panel GTR usa una consulta SQL con filtros incorrectos que no coinciden con los usados en los reportes individuales de asesores.

**Causa Principal**: 
1. Usa `updated_at` en lugar de `fecha_wizard_completado`
2. No verifica `wizard_completado = 1`
3. Usa zona horaria convertida en lugar de `CURDATE()`

**Solución Inmediata**: Aplicar corrección en `backend/controllers/asesoresController.js` línea 38-48 según **Solución 1**.

**Impacto Estimado de la Corrección**: 
- ✅ Todas las gestiones reales serán visibles en panel GTR
- ✅ Métricas consistentes entre panel GTR y reportes individuales
- ✅ Mayor confianza en los datos del sistema

**Tiempo Estimado de Implementación**: 2-3 horas (diagnóstico + corrección + validación)

**Riesgo de la Corrección**: BAJO - Solo cambia consulta SQL, no afecta datos ni estructura

---

**Documento Generado**: Noviembre 26, 2025  
**Sistema**: Albru Brunario CRM  
**Versión**: 1.0
