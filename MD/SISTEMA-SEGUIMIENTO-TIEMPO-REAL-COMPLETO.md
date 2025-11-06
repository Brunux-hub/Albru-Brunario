# Sistema de Seguimiento en Tiempo Real - Implementación Completa

**Fecha:** 4 de noviembre de 2025  
**Implementado por:** Full Stack Senior Dev  
**Estado:** ✅ Completamente funcional con WebSocket + Activity Tracking

---

## 🎯 Objetivo Logrado

Sistema de seguimiento en tiempo real que actualiza ambas interfaces (GTR y Asesor) automáticamente con los siguientes estados:

| Evento | Estado Seguimiento | Timestamp Actualizado |
|--------|-------------------|----------------------|
| Cliente recién cargado | `nuevo` | `created_at` |
| GTR asigna cliente al asesor | `derivado` | `derivado_at`, `last_activity` |
| Asesor abre wizard de gestión | `en_gestion` | `opened_at`, `last_activity` |
| Asesor completa gestión y cierra wizard | `terminado` | `fecha_wizard_completado` |
| Asesor no gestiona en 5 minutos | `no_gestionado` + regreso a GTR | historial |

---

## 🛠️ Tecnologías Implementadas

### ✅ WebSocket Nativo (ws library)
- **Ubicación:** `backend/services/WebSocketService.js`
- **Eventos:** `CLIENT_IN_GESTION`, `CLIENT_COMPLETED`, `CLIENT_RETURNED_TO_GTR`
- **Patrones:** Pub/Sub con identificación de cliente (GTR/ASESOR)

### ✅ Activity Tracking Middleware
- **Ubicación:** `backend/middleware/activityTracker.js`
- **Función:** Actualiza `last_activity` en cada acción del asesor
- **Aplicado en:** Lock, Heartbeat, Open-wizard, Complete-wizard, Update

### ✅ Worker/Cron Backend
- **Ubicación:** `backend/services/seguimientoWorker.js`
- **Intervalo:** 30 segundos
- **Timeout:** 300 segundos (5 minutos)
- **Lógica:** Usa `last_activity` para detectar inactividad

### ✅ Base de Datos
- **Campo nuevo:** `last_activity DATETIME`
- **Índices:** `idx_last_activity`, `idx_seguimiento_activity`
- **Campos existentes:** `seguimiento_status`, `derivado_at`, `opened_at`

### ✅ Frontend React + Context API
- **GTR:** Listener WebSocket en `GtrDashboard.tsx`
- **Asesor:** Listener WebSocket en `AsesorClientesTable.tsx`
- **Estado:** Actualización en tiempo real sin recargar página

---

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
├──────────────────────────┬──────────────────────────────────┤
│   Panel GTR              │   Panel Asesor                   │
│   - GtrDashboard.tsx     │   - AsesorClientesTable.tsx      │
│   - Listeners WS activos │   - Listeners WS activos         │
└──────────────┬───────────┴──────────────┬───────────────────┘
               │                          │
               │ WebSocket Connection     │
               └──────────┬───────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                    BACKEND (Node.js)                         │
├──────────────────────────────────────────────────────────────┤
│  WebSocketService.js                                         │
│  - notifyAll(event, data)                                    │
│  - broadcastToGTR(message)                                   │
│  - broadcastToAsesores(message)                              │
├──────────────────────────────────────────────────────────────┤
│  Activity Tracker Middleware                                 │
│  - Intercepta requests con clienteId                         │
│  - Actualiza last_activity en cada acción                    │
├──────────────────────────────────────────────────────────────┤
│  Controllers                                                  │
│  - openWizard() → en_gestion + last_activity                │
│  - completeWizard() → terminado + notifica WS                │
│  - updateEstatus() → derivado + last_activity                │
├──────────────────────────────────────────────────────────────┤
│  Seguimiento Worker (Cron Job)                               │
│  - Ejecuta cada 30s                                          │
│  - Detecta inactividad > 5min en last_activity               │
│  - Retorna a GTR con estado "no_gestionado"                  │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                  BASE DE DATOS (MySQL 8.0)                   │
├──────────────────────────────────────────────────────────────┤
│  Tabla: clientes                                             │
│  - seguimiento_status VARCHAR(64)                            │
│  - derivado_at DATETIME                                      │
│  - opened_at DATETIME                                        │
│  - last_activity DATETIME ← NUEVO                            │
│  - asesor_asignado INT                                       │
│                                                              │
│  Índices:                                                    │
│  - idx_last_activity                                         │
│  - idx_seguimiento_activity (seguimiento_status, last_activity) │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo Completo de Estados

### 1. **Cliente Recién Cargado → "nuevo"**
```sql
INSERT INTO clientes (nombre, telefono, seguimiento_status, created_at)
VALUES ('Cliente Test', '999888777', 'nuevo', NOW());
```

**Frontend:**
- GTR muestra cliente con chip "Nuevo" o sin chip
- Disponible para asignación

---

### 2. **GTR Asigna al Asesor → "derivado"**

**Backend:**
```javascript
// POST /api/clientes/:id/estatus
{
  tipo: "gtr",
  estatus: "derivado",
  asesorId: 4
}

// SQL ejecutado:
UPDATE clientes SET
  seguimiento_status = 'derivado',
  derivado_at = NOW(),
  last_activity = NOW(),
  asesor_asignado = 4
WHERE id = ?
```

**WebSocket emitido:**
```javascript
CLIENT_REASSIGNED {
  clienteId: 123,
  asesorId: 4,
  timestamp: "2025-11-04T..."
}
```

**Frontend:**
- GTR: Chip cambia a "Derivado" (azul)
- Asesor: Cliente aparece en su lista con chip "Derivado"

---

### 3. **Asesor Abre Wizard → "en_gestion"**

**Backend:**
```javascript
// POST /api/clientes/:id/open-wizard
{
  asesorId: 4,
  lockToken: "abc123..."
}

// SQL ejecutado:
UPDATE clientes SET
  seguimiento_status = 'en_gestion',
  opened_at = NOW(),
  last_activity = NOW()
WHERE id = ?
```

**WebSocket emitido:**
```javascript
CLIENT_IN_GESTION {
  clienteId: 123,
  asesorId: 4,
  timestamp: "2025-11-04T..."
}
```

**Frontend:**
- GTR: Chip cambia a "En Gestión" (naranja) **SIN recargar**
- Asesor: Chip cambia a "En Gestión"
- Wizard se abre

---

### 4. **Middleware Tracking de Actividad**

**En cada acción del asesor:**
```javascript
// Automático en:
// - POST /api/clientes/:id/lock
// - POST /api/clientes/:id/heartbeat (cada 60s)
// - PUT /api/clientes/:id
// - PATCH /api/clientes/:id/estatus

UPDATE clientes SET
  last_activity = NOW()
WHERE id = ? AND seguimiento_status IN ('derivado', 'en_gestion')
```

**Resultado:** El timeout de 5 minutos se resetea con cada acción

---

### 5. **Asesor Completa Gestión → "terminado"**

**Backend:**
```javascript
// POST /api/clientes/:id/complete-wizard
{
  asesorId: 4
}

// SQL ejecutado:
UPDATE clientes SET
  seguimiento_status = 'terminado',
  asesor_asignado = NULL,
  last_activity = NULL,
  wizard_completado = 1,
  fecha_wizard_completado = NOW()
WHERE id = ?
```

**WebSocket emitido:**
```javascript
CLIENT_COMPLETED {
  clienteId: 123,
  asesorId: 4,
  timestamp: "2025-11-04T..."
}
```

**Frontend:**
- GTR: Chip cambia a "Terminado" (verde)
- Asesor: Cliente desaparece de la lista (ya no asignado)

---

### 6. **Timeout: Sin Actividad por 5 Minutos → "no_gestionado"**

**Worker (cada 30s):**
```sql
-- Busca clientes inactivos
SELECT 
  id, asesor_asignado, seguimiento_status,
  TIMESTAMPDIFF(SECOND, COALESCE(last_activity, opened_at, derivado_at), NOW()) as inactive_seconds
FROM clientes 
WHERE seguimiento_status IN ('derivado', 'en_gestion')
  AND COALESCE(last_activity, opened_at, derivado_at) <= DATE_SUB(NOW(), INTERVAL 300 SECOND);

-- Para cada cliente encontrado:
UPDATE clientes SET
  seguimiento_status = 'no_gestionado',
  asesor_asignado = NULL,
  last_activity = NULL
WHERE id = ?
```

**WebSocket emitido:**
```javascript
CLIENT_RETURNED_TO_GTR {
  clienteId: 123,
  reason: 'timeout_no_gestionado',
  previousAsesor: 4,
  seguimiento_status: 'no_gestionado'
}
```

**Frontend:**
- GTR: Chip cambia a "Sin Gestionar" (rojo)
- Asesor: Cliente desaparece de la lista
- Historial: Se registra el timeout automático

---

## 📁 Archivos Modificados/Creados

### Backend

1. **`database/migrations/add_last_activity_field.sql`** (nuevo)
   - Agrega campo `last_activity`
   - Crea índices de performance

2. **`backend/middleware/activityTracker.js`** (nuevo)
   - Middleware para tracking automático
   - Función helper `updateActivity()`

3. **`backend/routes/clientes.js`** (modificado)
   - Aplicado middleware `activityTracker` en rutas críticas
   - Agregada ruta `POST /:id/complete-wizard`

4. **`backend/controllers/clientesController.js`** (modificado)
   - `openWizard()`: Inicializa `last_activity`
   - `completeWizard()`: Nuevo método para marcar "terminado"

5. **`backend/controllers/estatusController.js`** (modificado)
   - `updateEstatus()`: Inicializa `last_activity` al derivar

6. **`backend/services/seguimientoWorker.js`** (modificado)
   - Usa `last_activity` en vez de solo `derivado_at`
   - Logs mejorados para debugging
   - Limpia `last_activity` al retornar a GTR

### Frontend

Ya estaba implementado en la sesión anterior:
- `src/pages/GtrDashboard.tsx`: Listener `CLIENT_IN_GESTION`
- `src/components/asesor/AsesorClientesTable.tsx`: Listener `CLIENT_IN_GESTION`

---

## 🧪 Testing

### Script de Prueba Completo

```powershell
# 1. Limpiar datos
.\scripts\limpiar-seguimiento.ps1

# 2. Prueba básica del flujo
.\scripts\test-seguimiento-complete-flow.ps1 -ClienteId 1 -AsesorId 4

# 3. Prueba de tiempo real
.\scripts\test-realtime-seguimiento.ps1 -ClienteId 2 -AsesorId 4
```

### Prueba Manual del Flujo Completo

```
1. GTR asigna cliente 1 al asesor 4
   ✅ Chip: "Derivado"
   ✅ last_activity: NOW()

2. Asesor abre wizard
   ✅ GTR actualiza a "En Gestión" (sin F5)
   ✅ last_activity: NOW()

3. Asesor hace cambios (cada acción resetea timeout)
   ✅ PUT /api/clientes/1
   ✅ last_activity: NOW() (actualizado)

4. Opción A: Asesor completa wizard
   POST /api/clientes/1/complete-wizard
   ✅ Estado: "Terminado"
   ✅ Cliente sale de lista del asesor
   ✅ GTR muestra "Terminado"

5. Opción B: Asesor no hace nada por 5 min
   ✅ Worker detecta timeout
   ✅ Estado: "no_gestionado"
   ✅ Cliente regresa a GTR
   ✅ Historial registrado
```

---

## 📊 Monitoreo y Debugging

### Ver Actividad en Tiempo Real

```sql
-- Clientes con seguimiento activo
SELECT 
  id,
  seguimiento_status,
  asesor_asignado,
  derivado_at,
  opened_at,
  last_activity,
  TIMESTAMPDIFF(SECOND, COALESCE(last_activity, opened_at, derivado_at), NOW()) as inactive_seconds,
  CASE 
    WHEN TIMESTAMPDIFF(SECOND, COALESCE(last_activity, opened_at, derivado_at), NOW()) > 300 
    THEN 'TIMEOUT INMINENTE'
    ELSE 'OK'
  END as status_timeout
FROM clientes 
WHERE seguimiento_status IN ('derivado', 'en_gestion')
ORDER BY inactive_seconds DESC;
```

### Logs del Backend

```bash
# Ver worker en acción
docker-compose logs -f backend | grep -i "seguimientoWorker"

# Ver tracking de actividad
docker-compose logs -f backend | grep -i "Activity tracked"

# Ver eventos WebSocket
docker-compose logs -f backend | grep -i "CLIENT_IN_GESTION\|CLIENT_COMPLETED\|CLIENT_RETURNED"
```

### Logs del Frontend (Consola del Navegador)

**En GTR:**
```
🎯 GTR: Evento CLIENT_IN_GESTION recibido: {clienteId: 123, ...}
✅ GTR: Actualizando cliente 123 a "en_gestion" en tiempo real
```

**En Asesor:**
```
✅ Asesor: Cliente 123 cambió a "en_gestion"
```

---

## ✅ Checklist de Implementación

- [x] Campo `last_activity` en BD con índices
- [x] Middleware `activityTracker` creado
- [x] Middleware aplicado en rutas críticas
- [x] Worker actualizado para usar `last_activity`
- [x] Endpoint `complete-wizard` implementado
- [x] WebSocket eventos implementados
- [x] Frontend listeners activos (GTR y Asesor)
- [x] Logs de debugging agregados
- [x] Scripts de prueba creados
- [x] Documentación completa

---

## 🎯 Resultado Final

### Antes:
- ❌ Sin tracking de actividad
- ❌ Timeout basado solo en `derivado_at`
- ❌ No había forma de marcar "terminado"
- ❌ Actualización manual (F5)

### Después:
- ✅ **Activity tracking automático** en cada acción
- ✅ **Timeout inteligente** basado en `last_activity`
- ✅ **Estado "terminado"** cuando se completa gestión
- ✅ **Actualización en tiempo real** vía WebSocket
- ✅ **5 estados completos**: nuevo, derivado, en_gestion, terminado, no_gestionado
- ✅ **Middleware** actualiza actividad automáticamente
- ✅ **Worker robusto** con logs de debugging
- ✅ **100% funcional** con todos los estados

---

**Estado:** ✅ Sistema completamente funcional y en producción  
**Próximo paso:** Monitorear en producción y ajustar timeouts según necesidad
