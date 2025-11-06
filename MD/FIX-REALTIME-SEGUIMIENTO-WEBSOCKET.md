# Fix: Actualización en Tiempo Real del Seguimiento (WebSocket)

**Fecha:** 4 de noviembre de 2025  
**Issue:** El seguimiento no se actualizaba en tiempo real en el panel GTR cuando el asesor abría el wizard

---

## 🐛 Problema Identificado

### Comportamiento Erróneo:
1. GTR asigna cliente a asesor → chip muestra "Derivado" ✅
2. Asesor abre wizard → debería cambiar a "En Gestión"
3. **GTR no se actualizaba en tiempo real** ❌
   - Solo se veía el cambio después de recargar (F5)
   - WebSocket no estaba escuchando el evento `CLIENT_IN_GESTION`

---

## ✅ Solución Implementada

### 1. Frontend GTR - Agregar Listener WebSocket

**Archivo:** `src/pages/GtrDashboard.tsx`

**Cambio:** Agregado listener para el evento `CLIENT_IN_GESTION`

```typescript
// 🔥 CRÍTICO: Escuchar cuando un asesor abre el wizard (cambia a "en_gestion")
const unsubscribeInGestion = realtimeService.subscribe('CLIENT_IN_GESTION', (data: unknown) => {
  try {
    console.log('🎯 GTR: Evento CLIENT_IN_GESTION recibido:', data);
    const msg = data as Record<string, unknown>;
    
    // Extraer clienteId del mensaje
    const clienteId = Number(msg['clienteId'] ?? (msg['data'] as Record<string, unknown>)?.['clienteId']);
    
    if (clienteId) {
      console.log(`✅ GTR: Actualizando cliente ${clienteId} a "en_gestion" en tiempo real`);
      
      // Actualizar el cliente en la lista con seguimiento_status = 'en_gestion'
      setClients(prev => prev.map(c => {
        if (c.id === clienteId) {
          return { 
            ...c, 
            seguimiento_status: 'en_gestion',
            opened_at: new Date().toISOString()
          };
        }
        return c;
      }));
    }
  } catch (e) {
    console.error('Error procesando CLIENT_IN_GESTION en GTR:', e);
  }
});
```

**Cleanup:** Agregado al return del useEffect:
```typescript
return () => {
  unsubscribe();
  unsubscribeReassigned();
  unsubscribeReturned();
  unsubscribeOcupado();
  unsubscribeLocked();
  unsubscribeUnlocked();
  unsubscribeUpdated();
  unsubscribeStatus();
  unsubscribeInGestion(); // ← NUEVO
};
```

---

### 2. Frontend Asesor - Agregar Listener WebSocket

**Archivo:** `src/components/asesor/AsesorClientesTable.tsx`

**Cambio:** Agregado listener para actualizar la vista del asesor

```typescript
// 🔥 CRÍTICO: Escuchar cuando el asesor abre el wizard (actualizar estado en tiempo real)
const unsubInGestion = realtime.subscribe('CLIENT_IN_GESTION', (data: unknown) => {
  try {
    const msg = data as Record<string, unknown>;
    const clienteId = Number(msg['clienteId'] ?? (msg['data'] as Record<string, unknown>)?.['clienteId']);
    
    if (clienteId) {
      console.log(`✅ Asesor: Cliente ${clienteId} cambió a "en_gestion"`);
      // Recargar la lista para reflejar el cambio
      cargarClientesAsignados();
    }
  } catch (e) {
    console.warn('Error procesando CLIENT_IN_GESTION en Asesor:', e);
  }
});
```

**Cleanup:** Agregado al return:
```typescript
try {
  if (typeof unsubInGestion === 'function') unsubInGestion();
} catch (err) { 
  console.warn('Error unsubscribing CLIENT_IN_GESTION', err); 
}
```

---

## 🔄 Flujo Completo WebSocket

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Asesor abre wizard (click en VER)                       │
│    - Frontend: GestionarClienteDialog.tsx                  │
│    - Toma lock del cliente (POST /lock)                    │
│    - Llama open-wizard (POST /open-wizard)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Backend procesa open-wizard                             │
│    - Archivo: backend/controllers/clientesController.js    │
│    - UPDATE clientes SET seguimiento_status='en_gestion'   │
│    - INSERT historial_estados, historial_cliente           │
│    - webSocketService.notifyAll('CLIENT_IN_GESTION', {...})│
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. WebSocketService emite evento                           │
│    - Archivo: backend/services/WebSocketService.js         │
│    - broadcastToGTR(message)                                │
│    - broadcastToAsesores(message)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
┌──────────────────┐   ┌──────────────────┐
│ 4a. Panel GTR    │   │ 4b. Panel Asesor │
│  recibe evento   │   │  recibe evento   │
│                  │   │                  │
│ - Listener:      │   │ - Listener:      │
│   CLIENT_IN_     │   │   CLIENT_IN_     │
│   GESTION        │   │   GESTION        │
│                  │   │                  │
│ - Actualiza:     │   │ - Recarga lista  │
│   setClients()   │   │   de clientes    │
│                  │   │                  │
│ - Chip cambia:   │   │ - Chip muestra:  │
│   Derivado →     │   │   En Gestión     │
│   En Gestión     │   │                  │
└──────────────────┘   └──────────────────┘
```

---

## 🧪 Pruebas

### Script de Prueba Interactivo
**Archivo:** `scripts/test-realtime-seguimiento.ps1`

**Uso:**
```powershell
.\scripts\test-realtime-seguimiento.ps1
```

**Pasos:**
1. Script solicita abrir GTR y Asesor en pestañas separadas
2. Asigna un cliente al asesor
3. Simula apertura de wizard (llama a open-wizard)
4. Verifica que GTR se actualiza automáticamente SIN recargar

---

## 📊 Verificación Manual

### Paso 1: Preparar los Paneles
```
Pestaña 1: http://localhost:5174/dashboard/gtr
Pestaña 2: http://localhost:5174/dashboard/asesor
```

### Paso 2: Asignar Cliente
- En GTR, click en "REASIGNAR" de un cliente disponible
- Seleccionar un asesor
- Click en "Derivar"
- **Verificar:** Chip azul "Derivado" aparece en GTR y Asesor

### Paso 3: Abrir Wizard (Prueba de Tiempo Real)
- En panel Asesor, click en "VER" del cliente derivado
- **Verificar en GTR (sin recargar F5):**
  - Chip debe cambiar automáticamente de "Derivado" → "En Gestión"
  - Debe tomar 1-2 segundos máximo

### Paso 4: Verificar Consola del Navegador (F12)
**En GTR:**
```
🎯 GTR: Evento CLIENT_IN_GESTION recibido: {clienteId: 2447, ...}
✅ GTR: Actualizando cliente 2447 a "en_gestion" en tiempo real
```

**En Asesor:**
```
✅ Asesor: Cliente 2447 cambió a "en_gestion"
```

---

## 🔧 Archivos Modificados

1. **src/pages/GtrDashboard.tsx**
   - Líneas ~430-455: Agregado listener `CLIENT_IN_GESTION`
   - Línea ~461: Agregado `unsubscribeInGestion()` al cleanup

2. **src/components/asesor/AsesorClientesTable.tsx**
   - Líneas ~178-190: Agregado listener `CLIENT_IN_GESTION`
   - Líneas ~197-199: Agregado cleanup del listener

3. **scripts/test-realtime-seguimiento.ps1** (nuevo)
   - Script interactivo para probar actualización en tiempo real

---

## 🎯 Resultado Final

### Antes:
- ❌ GTR no se actualizaba al abrir wizard
- ❌ Necesitaba recargar (F5) para ver "En Gestión"
- ❌ No había sincronización en tiempo real

### Después:
- ✅ GTR se actualiza automáticamente en 1-2 segundos
- ✅ No requiere recargar la página
- ✅ Sincronización en tiempo real vía WebSocket
- ✅ Ambos paneles (GTR y Asesor) actualizados simultáneamente

---

## 📝 Notas Técnicas

1. **Event Flow:** 
   - Frontend → Backend (open-wizard) → WebSocket emit → Frontend listeners

2. **Backend ya funcionaba:**
   - El endpoint `open-wizard` ya emitía `CLIENT_IN_GESTION`
   - Solo faltaban los listeners en el frontend

3. **RealtimeService:**
   - Singleton compartido por GTR y Asesor
   - Maneja conexión WebSocket única
   - Sistema de subscribe/unsubscribe para eventos

4. **Performance:**
   - Actualización optimista en el cliente que abre wizard
   - WebSocket notifica a otros clientes conectados
   - No requiere polling ni consultas periódicas

---

## ✅ Validación

- [x] GTR escucha `CLIENT_IN_GESTION`
- [x] Asesor escucha `CLIENT_IN_GESTION`
- [x] Backend emite evento correctamente
- [x] Actualización en tiempo real funciona
- [x] No requiere recargar página
- [x] Cleanup de listeners implementado
- [x] Script de prueba creado
- [x] Logs de debug agregados
