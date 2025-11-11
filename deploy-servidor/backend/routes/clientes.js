const express = require('express');
const router = express.Router();
const { getClienteByTelefono, getClienteByDni, searchClientes, getAllClientes, getClienteById, createCliente, updateCliente, getClientesByAsesor, getHistorialByAsesor, getGestionesDiaByAsesor, getClientesGestionadosHoy, getClientesGestionadosMes, getClientesPreventaCerrada, openWizard, completeWizard, reasignarCliente, notifyClienteOcupado } = require('../controllers/clientesController');
const { lockCliente, unlockCliente, heartbeatCliente, getLockStatus } = require('../controllers/clientesController');
const { updateEstatus } = require('../controllers/estatusController');
const { activityTracker } = require('../middleware/activityTracker');

// Rutas POST
router.post('/', createCliente);
router.post('/reasignar', reasignarCliente);
router.post('/notify-ocupado', notifyClienteOcupado);

// Rutas PUT - con tracking de actividad
router.put('/:id', activityTracker, updateCliente);

// Rutas específicas primero
router.get('/telefono/:telefono', getClienteByTelefono);
router.get('/dni/:dni', getClienteByDni);
router.get('/asesor/:asesorId', getClientesByAsesor);
router.get('/asesor/:asesorId/historial', getHistorialByAsesor);
router.get('/asesor/:asesorId/gestiones-dia', getGestionesDiaByAsesor);
router.get('/gestionados-hoy', getClientesGestionadosHoy);
router.get('/gestionados-mes', getClientesGestionadosMes);
router.get('/preventa-cerrada', getClientesPreventaCerrada);
router.get('/search', searchClientes);

// Lock endpoints (durable locks) - con tracking de actividad
router.post('/:id/lock', activityTracker, lockCliente);
router.post('/:id/unlock', unlockCliente); // No trackear unlock
router.post('/:id/heartbeat', activityTracker, heartbeatCliente); // Trackear heartbeat
router.get('/:id/lock', getLockStatus);

// Abrir wizard (asesor) -> marca opened_at y seguimiento en 'en_gestion'
router.post('/:id/open-wizard', activityTracker, openWizard);

// Completar wizard (asesor) -> marca seguimiento en 'terminado'
router.post('/:id/complete-wizard', activityTracker, completeWizard);

// Endpoint PATCH para actualizar estatus (GTR / Asesor) - con tracking
router.patch('/:id/estatus', activityTracker, updateEstatus);

// Ruta general (debe ir después de las específicas)
router.get('/', getAllClientes);

// Ruta con parámetro al final
router.get('/:id', getClienteById);

module.exports = router;
