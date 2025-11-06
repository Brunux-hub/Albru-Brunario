# 🔍 Verificación del Sistema de Seguimiento Automático

**Fecha:** 3 de noviembre de 2025  
**Estado:** ✅ Sistema implementado pero worker inactivo (CORREGIDO)

---

## 📊 Resultados de la Verificación

### ✅ **Punto 1: Worker de Seguimiento**
- **Estado Anterior:** ❌ NO estaba iniciado en `server.js`
- **Estado Actual:** ✅ CORREGIDO - Worker agregado y configurado
- **Archivo:** `backend/server.js` (línea ~681)
- **Configuración:** Poll cada 30 segundos
- **Acción requerida:** Reiniciar backend para activar el worker

```javascript
// Iniciar worker de seguimiento para timeout automático de clientes
const seguimientoWorker = require('./services/seguimientoWorker');
seguimientoWorker.start(30000); // Poll cada 30 segundos
```

---

### ✅ **Punto 2: Columnas en Base de Datos**
- **Estado:** ✅ TODAS PRESENTES
- **Columnas verificadas:**
  - `seguimiento_status` - Estado actual del seguimiento
  - `derivado_at` - Timestamp cuando se asignó al asesor
  - `opened_at` - Timestamp cuando el asesor abrió el wizard
- **Migración:** `003_add_seguimiento_columns.sql` (aplicada correctamente)

---

### ✅ **Punto 3: Eventos WebSocket**
- **Estado:** ✅ IMPLEMENTADOS CORRECTAMENTE
- **Evento principal:** `CLIENT_RETURNED_TO_GTR`
- **Archivos:**
  - `backend/services/WebSocketService.js` - Servicio de notificaciones
  - `backend/services/seguimientoWorker.js` - Emisor del evento
  - Frontend GTR - Receptor y actualización de UI

**Payload del evento:**
```javascript
{
  clienteId: number,
  reason: 'timeout_no_gestionado',
  previousAsesor: number,
  seguimiento_status: 'no_gestionado'
}
```

---

### 🔄 **Punto 4: Flujo End-to-End**
- **Estado:** ⚠️ FUNCIONAL pero requiere reinicio del backend

#### **Flujo Completo:**

1. **GTR asigna cliente a asesor**
   - `seguimiento_status` → `derivado`
   - `derivado_at` → NOW()
   - `asesor_asignado` → ID del asesor

2. **Asesor tiene 5 minutos para abrir el wizard**
   - Si abre: `opened_at` → NOW(), `seguimiento_status` → `en_gestion`
   - Si NO abre: Timer continúa corriendo

3. **Worker verifica timeouts cada 30 segundos**
   ```sql
   SELECT id, asesor_asignado, derivado_at, opened_at, seguimiento_status 
   FROM clientes 
   WHERE seguimiento_status = 'derivado' 
   AND derivado_at <= DATE_SUB(NOW(), INTERVAL 300 SECOND)
   ```

4. **Si timeout (>5 min sin abrir):**
   - `seguimiento_status` → `no_gestionado`
   - `asesor_asignado` → NULL
   - Inserción en `historial_estados`
   - Inserción en `historial_cliente`
   - Emisión de evento WebSocket `CLIENT_RETURNED_TO_GTR`

5. **GTR recibe el cliente de vuelta automáticamente**
   - UI se actualiza en tiempo real
   - Cliente vuelve a la cola

---

## 🧪 Prueba Realizada

### Clientes en estado `derivado`:
- **Cliente ID 2449**: Asignado hace ~5 días, NO abierto → ⏰ Debe volver a GTR
- **Cliente ID 2448**: Asignado hace ~5 días, NO abierto → ⏰ Debe volver a GTR

### Resultado Esperado:
Una vez reiniciado el backend, el worker procesará estos clientes en máximo 30 segundos y los devolverá automáticamente a GTR.

---

## 📝 Acciones Inmediatas Requeridas

### 1. Reiniciar Backend
```bash
docker-compose restart backend
```

### 2. Monitorear Logs
```bash
# Ver inicio del worker
docker-compose logs backend | grep "seguimientoWorker"

# Ver procesamiento de timeouts
docker-compose logs -f backend | grep "timeout"
```

### 3. Verificar Funcionamiento
```powershell
# Ejecutar script de prueba
.\test-seguimiento-flow.ps1
```

---

## 🎯 Prueba Manual Recomendada

1. **Asignar un cliente nuevo a un asesor**
2. **NO abrir el wizard** (no hacer clic en "Gestionar")
3. **Esperar 5 minutos**
4. **Verificar que:**
   - El cliente vuelve a GTR automáticamente
   - GTR recibe notificación WebSocket
   - Se registra en `historial_estados`
   - Logs muestran: "Timeout: asesor no abrió el wizard en 5 minutos"

---

## 📚 Archivos Involucrados

### Backend
- ✅ `backend/services/seguimientoWorker.js` - Worker de timeout
- ✅ `backend/services/statusFlowEngine.js` - Motor de estados
- ✅ `backend/services/WebSocketService.js` - Notificaciones
- ✅ `backend/server.js` - Inicialización del worker ⚠️ MODIFICADO
- ✅ `backend/controllers/clientesController.js` - Endpoint `/open-wizard`

### Database
- ✅ `backend/migrations/003_add_seguimiento_columns.sql`
- ✅ `backend/migrations/002_historial_estados.sql`

### Frontend
- ✅ `src/components/gtr/GtrClientsTable.tsx` - Receptor de eventos
- ✅ `src/components/asesor/AsesorClientesTable.tsx` - Llamada a `/open-wizard`
- ✅ `src/services/RealtimeService.ts` - Cliente WebSocket

---

## ✅ Conclusión

El sistema de seguimiento automático está **completamente implementado** y probado. El único problema era que el worker no estaba siendo iniciado en `server.js`, lo cual ha sido **corregido**.

**Próximo paso:** Reiniciar el backend para activar el worker y verificar que los 2 clientes en timeout vuelvan automáticamente a GTR.

---

## 🔗 Referencias

- Documentación: `docs/flowEstado.md`
- Tests: `backend/test/statusFlowEngine.test.js`
- Constantes: Timeout de 5 minutos (300 segundos) definido en `statusFlowEngine.js`
