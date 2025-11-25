# Sistema de Gestión de Números Duplicados

## 📋 Resumen

Sistema automático para detectar, unificar y gestionar números de teléfono duplicados en el CRM, evitando reasignaciones múltiples del mismo contacto.

## 🎯 Problema Resuelto

**Antes**: Un mismo número de teléfono (ej: "906 604 170", "+51906604170", "906604170") podía aparecer múltiples veces con diferentes asesores asignados, causando:
- ❌ Reasignaciones duplicadas del mismo lead
- ❌ Llamadas múltiples al mismo número
- ❌ Estadísticas incorrectas
- ❌ Confusión en la gestión

**Ahora**: Solo un registro (el PRINCIPAL) puede ser gestionado y reasignado, los duplicados quedan vinculados para referencia.

## 🏗️ Arquitectura del Sistema

### 1. Estructura de Base de Datos

```sql
-- Columnas en tabla 'clientes'
es_duplicado TINYINT(1) DEFAULT 0           -- 0 = Principal, 1 = Duplicado
telefono_principal_id INT NULL              -- ID del registro principal (solo para duplicados)
cantidad_duplicados INT DEFAULT 1           -- Contador de ingresos totales
campanas_asociadas VARCHAR(500) NULL        -- Formato: "CAMPAÑA×cantidad,..."
```

### 2. Normalización de Teléfonos

```javascript
// Función en backend/controllers/clientesController.js
const normalizarTelefono = (telefono) => {
  if (!telefono) return null;
  // Elimina espacios, guiones, +51, paréntesis
  return telefono.replace(/[\s\-\(\)\+]/g, '').replace(/^51/, '');
};
```

**Ejemplos de normalización:**
- "906 604 170" → "906604170"
- "+51906604170" → "906604170"  
- "906-604-170" → "906604170"
- "(906) 604 170" → "906604170"

### 3. Detección de Duplicados (createCliente)

Cuando se crea un nuevo cliente:

1. **Buscar registro principal existente** con el teléfono normalizado
2. Si existe:
   - Marcar nuevo registro como `es_duplicado = 1`
   - Vincular al principal con `telefono_principal_id`
   - Actualizar contador y campañas del principal
3. Si no existe:
   - Crear como principal: `es_duplicado = 0`
   - Iniciar contador: `cantidad_duplicados = 1`

```javascript
// Pseudo-código simplificado
const telefonoNorm = normalizarTelefono(telefono);
const [existente] = await query(`
  SELECT id FROM clientes 
  WHERE REPLACE(...) = ? AND es_duplicado = 0
`, [telefonoNorm]);

if (existente) {
  // Crear como duplicado
  es_duplicado = 1;
  telefono_principal_id = existente.id;
  // Actualizar estadísticas del principal
} else {
  // Crear como principal
  es_duplicado = 0;
  cantidad_duplicados = 1;
}
```

### 4. Validación de Reasignación

**Regla crítica**: Solo registros principales pueden ser reasignados.

```javascript
// En reasignarCliente()
const [check] = await query(`
  SELECT es_duplicado, telefono_principal_id 
  FROM clientes WHERE id = ?
`, [clienteId]);

if (check.es_duplicado === 1) {
  return res.status(403).json({
    message: "❌ NO SE PUEDE REASIGNAR - Este es un duplicado",
    principalId: check.telefono_principal_id
  });
}
```

### 5. Filtrado en Consultas

**Gestión de Clientes (GTR)**: Solo muestra registros principales

```javascript
const whereClause = 'WHERE (c.es_duplicado = FALSE OR c.es_duplicado IS NULL)';
```

**Panel del Asesor**: Muestra solo los asignados (ya filtrados por `asesor_asignado`)

## 📊 Indicadores Visuales (Frontend)

### Badge de Duplicados

En `GtrClientsTable.tsx`, se muestra un chip naranja con el contador:

```tsx
{client.cantidad_duplicados > 1 && (
  <Chip 
    label={`×${client.cantidad_duplicados}`}
    size="small"
    color="warning"
    title={`Este número aparece ${client.cantidad_duplicados} veces`}
  />
)}
```

**Ejemplo visual:**
```
906 604 170  [×3]  ← Badge naranja indica 3 ingresos de este número
```

## 🛠️ Script de Unificación

### Propósito
Procesar registros históricos para identificar y unificar duplicados existentes.

### Ubicación
`scripts/unificar-duplicados.cjs`

### Ejecución

```bash
# Copiar al contenedor y ejecutar
docker cp scripts/unificar-duplicados.cjs albru-backend:/app/
docker exec albru-backend node /app/unificar-duplicados.cjs
```

### Lógica del Script

1. **Leer todos los clientes** ordenados por `created_at` ASC
2. **Normalizar teléfonos** y agrupar
3. **Por cada grupo con duplicados**:
   - Identificar el más antiguo como principal
   - Marcar los demás como duplicados
   - Contar ingresos por campaña
   - Actualizar `cantidad_duplicados` y `campanas_asociadas`

### Resultado del Último Procesamiento

```
Grupos con duplicados procesados: 1,223
Total de duplicados marcados: 1,431
```

## 📝 Casos de Uso

### Caso 1: Nuevo Cliente sin Duplicados

```
Input: Teléfono "987 654 321", Campaña "CAMPAÑA 05"
Resultado:
  - Crea registro nuevo
  - es_duplicado = 0
  - cantidad_duplicados = 1
  - campanas_asociadas = "CAMPAÑA 05×1"
```

### Caso 2: Cliente Duplicado

```
Input: Teléfono "+51987654321", Campaña "CAMPAÑA 08"
Existente: ID 100 con "987 654 321"
Resultado:
  - Crea registro nuevo ID 200
  - ID 200: es_duplicado = 1, telefono_principal_id = 100
  - ID 100: cantidad_duplicados = 2, campanas_asociadas = "CAMPAÑA 05×1,CAMPAÑA 08×1"
```

### Caso 3: Múltiples Duplicados Misma Campaña

```
Input: Teléfono "987 654 321", Campaña "CAMPAÑA 05" (3ra vez)
Resultado:
  - ID 100: cantidad_duplicados = 3
  - campanas_asociadas = "CAMPAÑA 05×3"
```

### Caso 4: Intento de Reasignar Duplicado

```
Request: Reasignar cliente ID 200 (duplicado)
Response: HTTP 403
{
  "message": "❌ NO SE PUEDE REASIGNAR - Este es un duplicado",
  "principalId": 100,
  "motivo": "ES_DUPLICADO"
}
```

## 🔍 Consultas Útiles

### Ver todos los duplicados de un número

```sql
SELECT id, nombre, telefono, asesor_asignado, 
       es_duplicado, telefono_principal_id, 
       created_at
FROM clientes 
WHERE REPLACE(REPLACE(REPLACE(telefono, ' ', ''), '+51', ''), '-', '') = '906604170'
ORDER BY es_duplicado, id;
```

### Ver principales con más duplicados

```sql
SELECT id, telefono, cantidad_duplicados, campanas_asociadas
FROM clientes
WHERE es_duplicado = 0 
  AND cantidad_duplicados > 1
ORDER BY cantidad_duplicados DESC
LIMIT 20;
```

### Estadísticas generales

```sql
SELECT 
  COUNT(*) as total_registros,
  SUM(CASE WHEN es_duplicado = 0 THEN 1 ELSE 0 END) as principales,
  SUM(CASE WHEN es_duplicado = 1 THEN 1 ELSE 0 END) as duplicados,
  AVG(cantidad_duplicados) as promedio_ingresos
FROM clientes;
```

## ⚠️ Consideraciones Importantes

### 1. Sincronización
- Los duplicados se detectan **al crear** el registro
- Registros históricos requieren el script de unificación
- Ejecutar el script periódicamente si se importan datos masivos

### 2. Performance
- Búsqueda de duplicados usa normalización en SQL: `REPLACE(REPLACE(...))`
- Considerar índice en expresión normalizada para grandes volúmenes
- Filtro `es_duplicado = 0` está indexado

### 3. Integridad Referencial
- Si se elimina un principal, los duplicados quedan huérfanos
- Considerar soft delete o cascada en `telefono_principal_id`

### 4. Casos Especiales
- DNI diferente pero mismo teléfono: Se permite (podría ser familiar)
- Mismo DNI pero teléfono diferente: Se advierte pero se permite

## 🚀 Mejoras Futuras

1. **Vista de Duplicados**: Panel para GTR que muestre todos los duplicados agrupados
2. **Fusión Manual**: Permitir fusionar registros duplicados manualmente
3. **Auditoría**: Registrar historial de detección de duplicados
4. **Notificaciones**: Alertar a GTR cuando se detecta un duplicado reciente
5. **API de Búsqueda**: Endpoint para buscar si un teléfono ya existe antes de crear

## 📚 Referencias de Código

- **Backend Controller**: `backend/controllers/clientesController.js`
  - Línea ~7: `normalizarTelefono()`
  - Línea ~410: Detección de duplicados en `createCliente`
  - Línea ~1670: Validación en `reasignarCliente`
  
- **Frontend**: `src/components/gtr/GtrClientsTable.tsx`
  - Línea ~580: Badge de contador de duplicados

- **Script**: `scripts/unificar-duplicados.cjs`

## 📞 Contacto y Soporte

Para dudas o incidencias relacionadas con el sistema de duplicados, contactar al equipo de desarrollo.

---

**Última actualización**: 25 de noviembre de 2025  
**Versión del sistema**: 3.0
