const express = require('express');
const router = express.Router();
const { getClientes, createCliente, updateCliente, reassignCliente } = require('../controllers/clientesController');
const authMiddleware = require('../middlewares/authMiddleware');

// Obtener todos los clientes
router.get('/', getClientes);

// Crear un nuevo cliente
router.post('/', authMiddleware, createCliente);

// Actualizar un cliente existente
router.put('/:id', authMiddleware, updateCliente);

// Reasignar cliente entre asesores
router.put('/reasignar', authMiddleware, reassignCliente);

module.exports = router;