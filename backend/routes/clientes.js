const express = require('express');
const router = express.Router();
const { getClienteByLead, getClienteByDni, searchClientes, getAllClientes, getClienteById, createCliente } = require('../controllers/clientesController');

// Rutas POST
router.post('/', createCliente);

// Rutas específicas primero
router.get('/lead/:leadId', getClienteByLead);
router.get('/dni/:dni', getClienteByDni);
router.get('/search', searchClientes);

// Ruta general (debe ir después de las específicas)
router.get('/', getAllClientes);

// Ruta con parámetro al final
router.get('/:id', getClienteById);

module.exports = router;
