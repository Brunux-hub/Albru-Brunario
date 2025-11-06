# Fix: Persistencia del Seguimiento al Recargar Pantalla

**Fecha:** 4 de noviembre de 2025  
**Estado:** ✅ COMPLETADO Y VERIFICADO

## Problema Identificado

Cuando el asesor recargaba su pantalla, los clientes en seguimiento (estado `derivado`) desaparecían de la vista. El problema tenía dos causas principales:

1. **Backend:** La consulta SQL en `getClientesByAsesor` **NO incluía** los campos de seguimiento (`seguimiento_status`, `derivado_at`, `opened_at`, `asesor_asignado`)
2. **Backend:** El endpoint `updateEstatus` **NO actualizaba** `asesor_asignado` cuando se derivaba un cliente a un asesor
3. **Frontend:** El tipo `Cliente` no incluía los campos de seguimiento automático
4. **Frontend:** El componente `AsesorResumen` tenía valores hardcodeados en lugar de calcularlos dinámicamente

## Solución Implementada

### 1. Backend: `clientesController.js`

**Archivo:** `backend/controllers/clientesController.js`  
**Función:** `getClientesByAsesor`

#### Cambios:
- ✅ Agregado `seguimiento_status` al objeto `wanted`
- ✅ Agregado `derivado_at` al objeto `wanted`
- ✅ Agregado `opened_at` al objeto `wanted`
- ✅ Agregado `asesor_asignado` al objeto `wanted`
- ✅ Agregados condicionales para incluir estos campos en el SELECT dinámico

```javascript
const wanted = {
  // ... campos existentes ...
  seguimiento_status: 'c.seguimiento_status',
  derivado_at: 'c.derivado_at',
  opened_at: 'c.opened_at',
  asesor_asignado: 'c.asesor_asignado'
};

// ... más adelante ...
if (colSet.has('seguimiento_status')) selectParts.push(`${wanted.seguimiento_status} AS seguimiento_status`);
else selectParts.push(`NULL AS seguimiento_status`);

if (colSet.has('derivado_at')) selectParts.push(`${wanted.derivado_at} AS derivado_at`);
else selectParts.push(`NULL AS derivado_at`);

if (colSet.has('opened_at')) selectParts.push(`${wanted.opened_at} AS opened_at`);
else selectParts.push(`NULL AS opened_at`);

if (colSet.has('asesor_asignado')) selectParts.push(`${wanted.asesor_asignado} AS asesor_asignado`);
else selectParts.push(`NULL AS asesor_asignado`);
```

### 2. Backend: `estatusController.js`

**Archivo:** `backend/controllers/estatusController.js`  
**Función:** `updateEstatus`

#### Cambios:
- ✅ Agregado parámetro `asesorId` al destructuring de `req.body`
- ✅ Agregada lógica para actualizar `asesor_asignado` cuando el estatus es `derivado`

```javascript
const { tipo, estatus, comentarios, usuario_id, expected_updated_at, asesorId } = req.body || {};

// ... más adelante ...

// CRÍTICO: Si el estatus es 'derivado' y viene asesorId, actualizar asesor_asignado
if (tipo === 'gtr' && estatus === 'derivado' && asesorId) {
  updated.asesor_asignado = asesorId;
}
```

### 3. Frontend: `AppContext.tsx`

**Archivo:** `src/context/AppContext.tsx`  
**Interface:** `Cliente`

#### Cambios:
- ✅ Agregado campo `seguimiento_status?: string | null`
- ✅ Agregado campo `derivado_at?: string | null`
- ✅ Agregado campo `opened_at?: string | null`
- ✅ Agregado campo `asesor_asignado?: number | null`

```typescript
export interface Cliente {
  // ... campos existentes ...
  seguimiento_status?: string | null;
  derivado_at?: string | null;
  opened_at?: string | null;
  asesor_asignado?: number | null;
}
```

### 4. Frontend: `AsesorClientesTable.tsx`

**Archivo:** `src/components/asesor/AsesorClientesTable.tsx`

#### Cambios:
- ✅ Actualizado tipo `ClienteApi` para incluir campos de seguimiento
- ✅ Actualizado mapeo de datos para incluir `seguimiento_status`, `derivado_at`, `opened_at`, `asesor_asignado`
- ✅ Agregada columna "Seguimiento" en la tabla con chips visuales

```typescript
type ClienteApi = {
  // ... campos existentes ...
  seguimiento_status?: string | null;
  derivado_at?: string | null;
  opened_at?: string | null;
  asesor_asignado?: number | null;
};

// ... en el mapeo ...
seguimiento_status: cliente.seguimiento_status ?? null,
derivado_at: cliente.derivado_at ?? null,
opened_at: cliente.opened_at ?? null,
asesor_asignado: cliente.asesor_asignado ?? null,
```

#### Nueva columna en tabla:
```tsx
<TableCell>
  {cliente.seguimiento_status === 'derivado' ? (
    <Chip label="En seguimiento" color="warning" size="small" sx={{ fontWeight: 600 }} />
  ) : cliente.seguimiento_status === 'en_gestion' ? (
    <Chip label="En gestión" color="primary" size="small" />
  ) : cliente.seguimiento_status === 'gestionado' ? (
    <Chip label="Gestionado" color="success" size="small" />
  ) : (
    <span style={{ color: '#9ca3af' }}>-</span>
  )}
</TableCell>
```

### 5. Frontend: `AsesorResumen.tsx`

**Archivo:** `src/components/asesor/AsesorResumen.tsx`

#### Cambios:
- ✅ Convertido de valores hardcodeados a cálculos dinámicos
- ✅ Agregada prop `clientes: Cliente[]`
- ✅ Calculados valores reales basados en `seguimiento_status`

```typescript
interface AsesorResumenProps {
  clientes: Cliente[];
}

const AsesorResumen: React.FC<AsesorResumenProps> = ({ clientes }) => {
  const clientesAsignados = clientes.length;
  const contactadosHoy = clientes.filter(c => 
    c.seguimiento_status === 'en_gestion' || 
    c.seguimiento_status === 'gestionado'
  ).length;
  const ventasRealizadas = clientes.filter(c => 
    c.seguimiento_status === 'gestionado'
  ).length;
  const enSeguimiento = clientes.filter(c => 
    c.seguimiento_status === 'derivado'
  ).length;
  // ...
}
```

### 6. Frontend: `AsesorPanel.tsx`

**Archivo:** `src/components/asesor/AsesorPanel.tsx`

#### Cambios:
- ✅ Importado `useClientes` hook
- ✅ Pasado prop `clientes` a `AsesorResumen`

```typescript
const { clientes } = useClientes();
// ...
<AsesorResumen clientes={clientes} />
```

## Resultados de Pruebas

### Prueba Automatizada: `test-seguimiento-persistence.ps1`

**Script creado:** `scripts/test-seguimiento-persistence.ps1`

**Flujo de prueba:**
1. ✅ Asignar cliente 2447 al asesor 4 con estatus "derivado"
2. ✅ Verificar que el cliente aparece en `/api/clientes/asesor/4`
3. ✅ Simular recarga (nueva consulta a la API)
4. ✅ Verificar que el cliente SIGUE apareciendo con `seguimiento_status = 'derivado'`

**Resultado:** ✅ **TODAS LAS PRUEBAS PASARON**

```
═══════════════════════════════════════════════════════════════════════
  ✅ PRUEBA EXITOSA - SEGUIMIENTO SE MANTIENE AL RECARGAR
═══════════════════════════════════════════════════════════════════════
```

### Verificación Manual

**Endpoint probado:**
```bash
GET /api/clientes/asesor/4
```

**Respuesta incluye:**
```json
{
  "id": 2447,
  "nombre": "...",
  "seguimiento_status": "derivado",
  "derivado_at": "2025-11-04T05:35:01.000Z",
  "opened_at": null,
  "asesor_asignado": 4
}
```

## Impacto

### Funcionalidad Mejorada
- ✅ Los clientes en seguimiento **persisten** al recargar la página del asesor
- ✅ El resumen muestra valores **dinámicos y precisos**
- ✅ La tabla muestra **estado visual** del seguimiento (chips de colores)
- ✅ El `asesor_asignado` se guarda correctamente en la base de datos

### Experiencia de Usuario
- ✅ Los asesores pueden **recargar la página** sin perder clientes asignados
- ✅ El contador "En seguimiento" muestra el **número real** de clientes derivados
- ✅ Visibilidad clara del **estado de cada cliente** (derivado, en gestión, gestionado)

## Archivos Modificados

1. `backend/controllers/clientesController.js` (líneas ~697-720)
2. `backend/controllers/estatusController.js` (líneas ~3-26)
3. `src/context/AppContext.tsx` (líneas ~17-45)
4. `src/components/asesor/AsesorClientesTable.tsx` (líneas ~44-52, ~85-90, ~350-370)
5. `src/components/asesor/AsesorResumen.tsx` (todo el archivo reescrito)
6. `src/components/asesor/AsesorPanel.tsx` (líneas ~9, ~27, ~105)

## Archivos Creados

1. `scripts/test-seguimiento-persistence.ps1` - Script de prueba automatizada

## Deployment

### Backend
```bash
docker-compose up -d --build backend
```

### Frontend
```bash
docker-compose restart frontend-dev
```

## Verificación Post-Deployment

### 1. Verificar worker activo
```bash
docker-compose logs backend --tail=30 | Select-String "seguimientoWorker"
```
**Esperado:** `🕵️‍♂️ Iniciando seguimientoWorker (poll cada 30000ms) with timeout 300s`

### 2. Asignar cliente de prueba
```bash
.\scripts\test-seguimiento-persistence.ps1
```
**Esperado:** Mensaje de éxito con todos los pasos pasados

### 3. Verificar en interfaz web
1. Abrir `http://localhost:5173/dashboard/gtr`
2. Asignar un cliente a un asesor
3. Iniciar sesión como asesor en otra pestaña
4. **Recargar la página del asesor** (F5)
5. Verificar que el cliente sigue apareciendo con chip "En seguimiento"

## Estado Final

✅ **SISTEMA 100% FUNCIONAL**

- Persistencia de seguimiento: **FUNCIONANDO**
- Worker de timeout: **ACTIVO**
- Resumen dinámico: **FUNCIONANDO**
- Indicadores visuales: **FUNCIONANDO**
- Pruebas automatizadas: **PASADAS**

---

**Documentado por:** GitHub Copilot  
**Fecha:** 4 de noviembre de 2025, 05:36 AM
