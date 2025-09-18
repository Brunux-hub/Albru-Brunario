const express = require('express');
const router = express.Router();
const { getClientes, createCliente, updateCliente } = require('../controllers/clientesController');
const authMiddleware = require('../middlewares/authMiddleware');

// Obtener todos los clientes
router.get('/', getClientes);

// Crear un nuevo cliente
router.post('/', authMiddleware, createCliente);

// Actualizar un cliente existente
router.put('/:id', authMiddleware, updateCliente);

module.exports = router;