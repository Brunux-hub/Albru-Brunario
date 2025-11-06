# Fix: Seguimiento Automático - Persistencia y Cambio a "En Gestión"

**Fecha:** 4 de noviembre de 2025  
**Branch:** chore/login-hardening-202510200243

## 🐛 Problemas Identificados

### Problema 1: Persistencia en GTR
El campo `seguimiento_status` desaparecía al recargar el panel GTR, aunque el backend lo devolvía correctamente.

**Causa:** El navegador estaba usando caché HTTP 304 (Not Modified) con datos antiguos.

### Problema 2: Cambio Automático a "En Gestión"
Cuando el asesor abría el wizard para gestionar un cliente "derivado", el seguimiento no cambiaba automáticamente a "en_gestion".

**Causa:** El frontend no estaba llamando al endpoint `/api/clientes/:id/open-wizard` después de tomar el lock.

---

## ✅ Soluciones Implementadas

### 1. Headers de No-Cache en Frontend

#### `src/pages/GtrDashboard.tsx`
```typescript
const response = await fetch(url, {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  }
});
```

#### `src/components/asesor/AsesorClientesTable.tsx`
```typescript
const response = await fetch(`/api/clientes/asesor/${asesorId}`, {
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  }
});
```

**Resultado:** El navegador siempre obtiene datos frescos del servidor, evitando usar caché antigua.

---

### 2. Cambio Automático a "En Gestión" al Abrir Wizard

#### `src/components/asesor/GestionarClienteDialog.tsx`
Después de tomar el lock exitosamente, se llama al endpoint `open-wizard`:

```typescript
// 🔥 CRÍTICO: Cambiar seguimiento_status a "en_gestion" cuando el asesor abre el wizard
if (cliente.seguimiento_status === 'derivado') {
  try {
    const openWizardResp = await fetch(`${backend}/api/clientes/${cliente.id}/open-wizard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        asesorId,
        lockToken: j.lockToken 
      })
    });
    
    if (openWizardResp.ok) {
      console.log(`✅ Cliente ${cliente.id} cambiado a "en_gestion" al abrir wizard`);
    }
  } catch (err) {
    console.warn('Error actualizando seguimiento_status a en_gestion:', err);
  }
}
```

**Backend existente** (`backend/controllers/clientesController.js`):
El endpoint `POST /api/clientes/:id/open-wizard` ya existía y realiza:
- Actualiza `seguimiento_status = 'en_gestion'`
- Registra `opened_at = NOW()`
- Inserta en `historial_estados` y `historial_cliente`
- Notifica por WebSocket el evento `CLIENT_IN_GESTION`

---

## 🧪 Pruebas

### Script de Prueba Completa
**Archivo:** `scripts/test-seguimiento-complete-flow.ps1`

**Escenarios probados:**
1. ✅ GTR asigna cliente → `seguimiento_status = 'derivado'`
2. ✅ Persistencia GTR al recargar → mantiene `'derivado'`
3. ✅ Lista del asesor → muestra `'derivado'`
4. ✅ Asesor abre wizard → cambia automáticamente a `'en_gestion'`
5. ✅ Persistencia GTR después de wizard → mantiene `'en_gestion'`

**Resultado:** ✅ Todas las pruebas pasan exitosamente

---

## 📊 Flujo Completo del Seguimiento

```
┌─────────────┐
│ GTR asigna  │
│   cliente   │──────► seguimiento_status = 'derivado'
└─────────────┘        derivado_at = NOW()
                       asesor_asignado = asesorId
        │
        │ (Persistencia GTR ✅)
        ▼
┌─────────────┐
│   Asesor    │
│ recibe en   │──────► Ve cliente con chip "Derivado"
│ su lista    │
└─────────────┘
        │
        │ (Asesor hace clic en VER)
        ▼
┌─────────────┐
│  Se abre    │
│   wizard    │──────► 1. Toma lock (300s)
│             │        2. Llama open-wizard
│             │        3. seguimiento_status = 'en_gestion'
└─────────────┘        4. opened_at = NOW()
        │              5. Notifica WebSocket
        │
        │ (Worker monitorea en background)
        ▼
┌─────────────┐
│ Si pasan 5  │
│   minutos   │──────► seguimiento_status = 'gestionado'
│ sin activity│        asesor_asignado = NULL
└─────────────┘        Cliente regresa a GTR
```

---

## 🔧 Archivos Modificados

1. **src/pages/GtrDashboard.tsx**
   - Agregado headers de no-cache en `fetch`

2. **src/components/asesor/AsesorClientesTable.tsx**
   - Agregado headers de no-cache en `fetch`

3. **src/components/asesor/GestionarClienteDialog.tsx**
   - Agregada lógica para llamar `open-wizard` después del lock
   - Solo si `seguimiento_status === 'derivado'`

4. **scripts/test-seguimiento-complete-flow.ps1** (nuevo)
   - Script de prueba completo del flujo

---

## ✅ Validación

### Backend
```bash
# Verificar que devuelve seguimiento_status
curl http://localhost:3001/api/clientes?limit=5
```

### Frontend GTR
```
http://localhost:5173/dashboard/gtr
- Asignar cliente
- Recargar página (F5)
- ✅ El chip "Derivado" debe mantenerse visible
```

### Frontend Asesor
```
http://localhost:5173/dashboard/asesor
- Ver cliente "Derivado"
- Abrir wizard (click en VER)
- ✅ El chip debe cambiar automáticamente a "En Gestión"
```

---

## 📝 Notas Técnicas

1. **Cache-Control headers:** Se agregaron en el cliente para evitar que el navegador use respuestas 304 (Not Modified) con datos antiguos del cache.

2. **Backend headers:** El backend ya tenía headers de no-cache en `getAllClientes`, pero el navegador los ignoraba sin headers en el `fetch` del cliente.

3. **Endpoint open-wizard:** Ya existía en el backend, solo faltaba invocarlo desde el frontend al abrir el wizard.

4. **WebSocket notification:** El sistema notifica `CLIENT_IN_GESTION` cuando se abre el wizard, permitiendo actualizar otros paneles en tiempo real.

5. **Worker de timeout:** El `seguimientoWorker.js` sigue monitoreando y después de 5 minutos sin actividad retorna el cliente a GTR con estado "gestionado".

---

## 🎯 Resultado Final

- ✅ **Persistencia GTR:** El seguimiento se mantiene al recargar
- ✅ **Cambio automático:** Al abrir wizard cambia de "derivado" a "en_gestion"
- ✅ **Sincronización:** Ambos paneles (GTR y Asesor) muestran el estado correcto
- ✅ **Sin regresiones:** El worker de timeout (5 min) sigue funcionando correctamente
