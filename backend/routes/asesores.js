const express = require('express');
const router = express.Router();
const { getAsesores, actualizarDatosCliente, obtenerDatosClientes, updateEstadoAsesor } = require('../controllers/asesoresController');
const authMiddleware = require('../middlewares/authMiddleware');

// Obtener todos los asesores
router.get('/', getAsesores);

// Actualizar estado de un asesor (sin auth para desarrollo)
router.put('/:id/estado', updateEstadoAsesor);

// Actualizar datos de un cliente
router.put('/actualizar-cliente', authMiddleware, actualizarDatosCliente);

// Obtener datos de los clientes
router.get('/clientes', authMiddleware, obtenerDatosClientes);

module.exports = router;