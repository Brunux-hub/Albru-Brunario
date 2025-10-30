const express = require('express');
const router = express.Router();
const { getClienteByTelefono, getClienteByDni, searchClientes, getAllClientes, getClienteById, createCliente, updateCliente, getClientesByAsesor } = require('../controllers/clientesController');
const { lockCliente, unlockCliente, heartbeatCliente, getLockStatus } = require('../controllers/clientesController');

// Rutas POST
router.post('/', createCliente);

// Rutas PUT
router.put('/:id', updateCliente);

// Rutas específicas primero
router.get('/telefono/:telefono', getClienteByTelefono);
router.get('/dni/:dni', getClienteByDni);
router.get('/asesor/:asesorId', getClientesByAsesor);
router.get('/search', searchClientes);

// Lock endpoints (durable locks)
router.post('/:id/lock', lockCliente);
router.post('/:id/unlock', unlockCliente);
router.post('/:id/heartbeat', heartbeatCliente);
router.get('/:id/lock', getLockStatus);

// Ruta general (debe ir después de las específicas)
router.get('/', getAllClientes);

// Ruta con parámetro al final
router.get('/:id', getClienteById);

module.exports = router;
