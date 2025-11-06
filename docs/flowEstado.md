# Flow de Estados: GTR → Asesor → Calidad

Este documento describe la implementación del motor de estados, endpoints, WS, migraciones y cómo desplegarlo sin romper la funcionalidad existente.

## Objetivo
- Implementar un motor central (`statusFlowEngine`) que valide y aplique transiciones de estatus.
- Registrar cada cambio en `historial_estados`.
- Notificar a frontends mediante `CLIENT_STATUS_UPDATED`.
- Exponer endpoint PATCH `/api/clientes/:id/estatus`.

## Archivos creados
- `backend/services/statusFlowEngine.js` - reglas y acciones derivadas.
- `backend/controllers/estatusController.js` - endpoint PATCH.
- `backend/migrations/002_historial_estados.sql` - crea tabla historial_estados.
- `backend/test/statusFlowEngine.test.js` - tests unitarios básicos.

## Migración
Ejecutar: `mysql -u <user> -p <dbname> < backend/migrations/002_historial_estados.sql`

## Endpoint
PATCH /api/clientes/:id/estatus
Payload mínimo: `{ tipo: 'gtr'|'asesor', estatus: '...', usuario_id: 1 }`

## WebSocket
Evento: `CLIENT_STATUS_UPDATED` con payload estándar:
```
{ clienteId, tipo, estatus, usuarioId, timestamp }
```

## Tests
En `backend` ejecutar `npm test` (usa mocha si está configurado).

## Notas de despliegue
1. Crear branch feature/status-flow
2. Ejecutar migración en staging
3. Ejecutar tests
4. Activar en staging y validar
5. Merge y deploy
