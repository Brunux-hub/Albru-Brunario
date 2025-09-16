const express = require('express');
const router = express.Router();
const { getAsesores, actualizarDatosCliente, obtenerDatosClientes } = require('../controllers/asesoresController');

// Obtener todos los asesores
router.get('/', getAsesores);

// Actualizar datos de un cliente
router.put('/actualizar-cliente', actualizarDatosCliente);

// Obtener datos de los clientes
router.get('/clientes', obtenerDatosClientes);

module.exports = router;