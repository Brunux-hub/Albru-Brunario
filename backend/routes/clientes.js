const express = require('express');
const router = express.Router();
const { getClientes, createCliente, updateCliente } = require('../controllers/clientesController');

// Obtener todos los clientes
router.get('/', getClientes);

// Crear un nuevo cliente
router.post('/', createCliente);

// Actualizar un cliente existente
router.put('/:id', updateCliente);

module.exports = router;