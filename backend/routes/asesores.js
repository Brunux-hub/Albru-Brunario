const express = require('express');
const router = express.Router();
const { getAsesores, actualizarDatosCliente, obtenerDatosClientes } = require('../controllers/asesoresController');
const authMiddleware = require('../middlewares/authMiddleware');

// Obtener todos los asesores
router.get('/', getAsesores);

// Actualizar datos de un cliente
router.put('/actualizar-cliente', authMiddleware, actualizarDatosCliente);

// Obtener datos de los clientes
router.get('/clientes', authMiddleware, obtenerDatosClientes);

module.exports = router;