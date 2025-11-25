# Arquitectura WebSocket del Sistema ALBRU CRM

## 📡 Visión General

El sistema ALBRU CRM utiliza **Socket.io** para comunicación en tiempo real bidireccional entre el backend (Node.js) y el frontend (React + TypeScript). Esto permite que todos los usuarios vean cambios instantáneos sin necesidad de recargar la página.

## 🔧 Configuración

### Backend
- **Servidor**: `backend/services/SocketService.js`
- **Puerto**: Mismo que HTTP/Express (compartido)
- **Autenticación**: Token JWT en headers o query params
- **Rooms**: `gtr-room`, `asesor-room-{id}`

### Frontend
- **Hook personalizado**: `src/hooks/useSocket.tsx`
- **Conexión global**: `window.socket` (accesible desde cualquier componente)
- **Reconexión automática**: Habilitada por defecto

## 📤 Eventos Emitidos por el Backend

### 1. CLIENT_REASSIGNED
**Cuándo**: Un cliente es reasignado de un asesor a otro por el GTR
**Payload**:
```typescript
{
  clienteId: number;
  cliente: { /* datos del cliente */ };
  anteriorAsesor: { usuario_id, nombre };
  nuevoAsesor: { usuario_id, nombre };
  timestamp: string;
}
```
**Componentes que escuchan**:
- ✅ `GtrDashboard` - Actualiza lista de clientes y stats de asesores
- ✅ `AsesorPanel` - Recibe notificación si es el nuevo asesor
- ✅ `AsesorClientesTable` - Recarga lista de clientes asignados
- ✅ `ValidacionesTable` - Recarga lista de validaciones

---

### 2. CLIENT_COMPLETED
**Cuándo**: Un asesor completa el wizard de gestión de un cliente
**Payload**:
```typescript
{
  clienteId: number;
  cliente: {
    id: number;
    estatus_comercial_categoria: string;
    estatus_comercial_subcategoria: string;
    seguimiento_status: string;
  };
  asesorId: number;
  timestamp: string;
}
```
**Componentes que escuchan**:
- ✅ `GtrDashboard` - Actualiza categoría/subcategoría en tabla y stats de asesores
- ✅ `AsesorPanel` - Refresca lista (el cliente desaparece)
- ✅ `AsesorGestionesDia` - Recarga gestiones del día (se actualiza contador con multiplicador)
- ✅ `AsesorReportModal` - Recarga reporte del asesor
- ✅ `AsesorClientesTable` - Recarga lista de clientes
- ✅ `ValidacionesTable` - Recarga lista de validaciones

---

### 3. CLIENT_MOVED_TO_GTR
**Cuándo**: Un cliente termina su gestión y vuelve a control del GTR
**Payload**:
```typescript
{
  clienteId: number;
  cliente: { /* datos del cliente */ };
  timestamp: string;
}
```
**Componentes que escuchan**:
- ✅ `GtrDashboard` - Actualiza lista de clientes
- ✅ `AsesorPanel` - Elimina cliente de la lista del asesor

---

### 4. CLIENT_UPDATED
**Cuándo**: Se actualizan datos generales de un cliente
**Payload**:
```typescript
{
  clienteId: number;
  updates: { /* campos actualizados */ };
  timestamp: string;
}
```
**Componentes que escuchan**:
- ✅ `GtrDashboard` - Actualiza vista del cliente
- ✅ `AsesorClientesTable` - Recarga lista
- ✅ `ValidacionesTable` - Recarga lista

---

### 5. CLIENT_STATUS_UPDATED
**Cuándo**: Cambia el estado de un cliente (nuevo, en_gestion, gestionado)
**Payload**:
```typescript
{
  clienteId: number;
  estado: string;
  timestamp: string;
}
```
**Componentes que escuchan**:
- ✅ `GtrDashboard` - Actualiza estado en tabla
- ✅ `AsesorClientesTable` - Recarga lista
- ✅ `ValidacionesTable` - Recarga lista

---

### 6. CLIENT_RETURNED_TO_GTR
**Cuándo**: Un asesor devuelve un cliente al GTR (no lo pudo gestionar)
**Payload**:
```typescript
{
  clienteId: number;
  asesorId: number;
  razon: string;
  timestamp: string;
}
```
**Componentes que escuchan**:
- ✅ `GtrDashboard` - Actualiza lista de clientes y stats de asesores
- ✅ `AsesorClientesTable` - Recarga lista

---

### 7. CLIENT_LOCKED
**Cuándo**: Un asesor abre un cliente (para evitar concurrencia)
**Payload**:
```typescript
{
  clienteId: number;
  locked_by: number; // asesorId
  lock_expires_at: string;
}
```
**Componentes que escuchan**:
- ✅ `GtrDashboard` - Muestra cliente como bloqueado
- ✅ `AsesorClientesTable` - Marca cliente como bloqueado

---

### 8. CLIENT_UNLOCKED
**Cuándo**: Un cliente es liberado (asesor cerró el wizard)
**Payload**:
```typescript
{
  clienteId: number;
}
```
**Componentes que escuchan**:
- ✅ `GtrDashboard` - Quita marca de bloqueado
- ✅ `AsesorClientesTable` - Quita marca de bloqueado

---

### 9. CLIENT_IN_GESTION
**Cuándo**: Un asesor abre el wizard de gestión (cambia estado a "en_gestion")
**Payload**:
```typescript
{
  clienteId: number;
  asesorId: number;
  timestamp: string;
}
```
**Componentes que escuchan**:
- ✅ `GtrDashboard` - Actualiza estado visual
- ✅ `AsesorClientesTable` - Recarga lista

---

### 10. CLIENT_OCUPADO
**Cuándo**: Un asesor marca/desmarca que está ocupado con un cliente
**Payload**:
```typescript
{
  clienteId: number;
  asesorId: number;
  ocupado: boolean;
  timestamp: string;
}
```
**Componentes que escuchan**:
- ✅ `GtrDashboard` - Muestra asesor como ocupado

---

### 11. HISTORIAL_UPDATED
**Cuándo**: Se agrega un nuevo registro al historial de un cliente
**Payload**:
```typescript
{
  clienteId: number;
  usuarioId: number;
  accion: string;
}
```
**Componentes que escuchan**:
- ✅ `AsesorPanel` - Actualiza vista de historial
- ✅ `AsesorClientesTable` - Recarga lista

---

### 12. REASSIGNMENT_CONFIRMED
**Cuándo**: El GTR confirma una reasignación
**Payload**:
```typescript
{
  clienteId: number;
  nuevoAsesorId: number;
}
```
**Componentes que escuchan**:
- ✅ `GtrDashboard` - Cierra modal de confirmación

---

### 13. STATS_RESET
**Cuándo**: Se resetean estadísticas diarias (medianoche)
**Payload**:
```typescript
{
  timestamp: string;
}
```
**Componentes que escuchan**:
- (Actualmente no implementado - futuro)

---

## 📥 Eventos Emitidos por el Frontend

### 1. join-gtr-room
**Cuándo**: GTR se conecta al sistema
**Payload**:
```typescript
{
  username: string;
}
```

### 2. join-asesor-room
**Cuándo**: Asesor se conecta al sistema
**Payload**:
```typescript
{
  asesorId: number;
  username: string;
}
```

### 3. heartbeat
**Cuándo**: Cada 30 segundos para mantener conexión viva
**Payload**: `{}`

---

## 🏗️ Componentes y sus Listeners

### `GtrDashboard.tsx`
**Propósito**: Panel principal del GTR para gestionar clientes y asesores

**Listeners**:
```typescript
✅ REASSIGNMENT_CONFIRMED
✅ CLIENT_REASSIGNED (×2 - actualiza clientes Y asesores)
✅ CLIENT_RETURNED_TO_GTR (×2)
✅ CLIENT_OCUPADO
✅ CLIENT_LOCKED
✅ CLIENT_UNLOCKED
✅ CLIENT_UPDATED
✅ CLIENT_STATUS_UPDATED
✅ CLIENT_IN_GESTION
✅ CLIENT_MOVED_TO_GTR
✅ CLIENT_COMPLETED (×2)
```

**Acciones**:
- Actualiza lista de clientes en tiempo real
- Actualiza estadísticas de asesores
- Muestra notificaciones visuales

---

### `AsesorPanel.tsx`
**Propósito**: Panel principal del asesor

**Listeners**:
```typescript
✅ CLIENT_REASSIGNED (solo si es para él)
✅ HISTORIAL_UPDATED
✅ CLIENT_MOVED_TO_GTR
✅ CLIENT_COMPLETED
```

**Acciones**:
- Muestra notificación de nuevo cliente
- Refresca tabla de clientes asignados

---

### `AsesorClientesTable.tsx`
**Propósito**: Tabla de clientes asignados al asesor

**Listeners** (vía RealtimeService + Socket directo):
```typescript
✅ CLIENT_REASSIGNED
✅ HISTORIAL_UPDATED
✅ CLIENT_MOVED_TO_GTR
✅ CLIENT_IN_GESTION
✅ CLIENT_UPDATED
✅ CLIENT_STATUS_UPDATED
✅ CLIENT_RETURNED_TO_GTR
✅ CLIENT_LOCKED
✅ CLIENT_UNLOCKED
✅ CLIENT_COMPLETED
```

**Acciones**:
- Recarga lista completa de clientes asignados

---

### `AsesorGestionesDia.tsx`
**Propósito**: Muestra gestiones completadas del día con contador multiplicado

**Listeners**:
```typescript
✅ CLIENT_COMPLETED
```

**Acciones**:
- Recarga lista de gestiones del día
- Actualiza contador total (con multiplicador de duplicados)

---

### `AsesorReportModal.tsx`
**Propósito**: Modal del GTR que muestra reporte de un asesor específico

**Listeners**:
```typescript
✅ CLIENT_COMPLETED (solo si es del asesor visualizado)
```

**Acciones**:
- Recarga reporte del asesor
- Actualiza contador con multiplicador

---

### `ValidacionesTable.tsx`
**Propósito**: Tabla de clientes para el equipo de validaciones

**Listeners**:
```typescript
✅ CLIENT_COMPLETED
✅ CLIENT_UPDATED
✅ CLIENT_STATUS_UPDATED
✅ CLIENT_REASSIGNED
```

**Acciones**:
- Recarga lista completa de clientes

---

## 🔄 Flujos de Datos Comunes

### Flujo 1: Reasignación de Cliente
```
GTR hace clic en "Reasignar"
    ↓
Backend emite CLIENT_REASSIGNED
    ↓
┌───────────────┬──────────────────┬────────────────┐
↓               ↓                  ↓                ↓
GtrDashboard   AsesorPanel    AsesorClientesTable  ValidacionesTable
(actualiza)    (notifica)     (recarga)            (recarga)
    ↓
Backend emite evento adicional para stats
    ↓
GtrDashboard recarga estadísticas de asesores
```

### Flujo 2: Asesor Completa Gestión
```
Asesor completa wizard
    ↓
Backend emite CLIENT_COMPLETED
    ↓
┌────────────┬────────────────┬─────────────────┬──────────────────┐
↓            ↓                ↓                 ↓                  ↓
GtrDashboard AsesorPanel AsesorGestionesDia AsesorReportModal ValidacionesTable
(actualiza)  (remueve)   (recarga +contador) (recarga stats)   (recarga)
    ↓
GtrDashboard recarga stats de asesores
```

### Flujo 3: Cliente Devuelto a GTR
```
Asesor devuelve cliente
    ↓
Backend emite CLIENT_RETURNED_TO_GTR
    ↓
┌──────────────┬─────────────────────┐
↓              ↓                     ↓
GtrDashboard   AsesorClientesTable  (stats asesores)
(agrega)       (remueve)            (actualiza)
```

---

## 🎯 Sistema de Multiplicadores (Duplicados)

### Contexto
Cuando un cliente principal tiene duplicados (ej: cantidad_duplicados=3), al ser gestionado cuenta como 3 gestiones.

### Componentes que implementan multiplicadores:
- ✅ `AsesorGestionesDia` - Muestra total multiplicado
- ✅ `AsesorReportModal` - Muestra total multiplicado en reporte GTR
- ✅ Backend endpoint `/api/clientes/asesor/:id/gestiones-dia` - Calcula SUM(cantidad_duplicados)

### Ejemplo de visualización:
```
Cliente: Juan Pérez (×3)
Gestiones totales: 15 (12 registros únicos)
```

---

## 🚀 Beneficios del Sistema WebSocket

1. **Sincronización instantánea**: Todos los usuarios ven cambios en tiempo real
2. **Cero refrescos manuales**: No es necesario hacer F5
3. **Mejor experiencia de usuario**: Notificaciones visuales inmediatas
4. **Prevención de conflictos**: Sistema de locks evita que dos asesores gestionen el mismo cliente
5. **Estadísticas en vivo**: Contadores y métricas se actualizan automáticamente

---

## 🔧 Mantenimiento y Debugging

### Ver eventos en consola del navegador:
Todos los eventos tienen logs con formato:
```
🔔 [COMPONENTE] Evento NOMBRE_EVENTO recibido
📋 [COMPONENTE] Payload completo: {...}
✅ [COMPONENTE] Acción completada
```

### Verificar conexión WebSocket:
```javascript
// En consola del navegador
window.socket.connected // true/false
window.socket.id // ID único de la conexión
```

### Forzar reconexión:
```javascript
window.socket.disconnect();
window.socket.connect();
```

---

## 📝 Notas Importantes

1. **RealtimeService vs Socket directo**: Algunos componentes usan `RealtimeService` (legacy), otros usan `window.socket` directamente. Ambos funcionan correctamente.

2. **Cleanup de listeners**: Todos los componentes limpian sus listeners en el return del useEffect para evitar memory leaks.

3. **Filtrado de eventos**: Los listeners verifican si el evento es relevante (ej: si es para el asesor correcto) antes de recargar datos.

4. **Performance**: Los componentes recargan solo cuando es necesario, no en cada evento global.

---

## 🔮 Mejoras Futuras

- [ ] Implementar STATS_RESET listener en todos los componentes
- [ ] Agregar notificaciones push del navegador
- [ ] Implementar presencia en tiempo real (ver quién está online)
- [ ] Sistema de chat en tiempo real entre GTR y asesores
- [ ] Notificaciones de métricas críticas (ej: "Has superado tu meta diaria!")

---

**Última actualización**: 25 de noviembre de 2025
**Versión del sistema**: 3.0
