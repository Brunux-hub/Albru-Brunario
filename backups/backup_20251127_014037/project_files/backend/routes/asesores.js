const express = require('express');
const router = express.Router();
const { getAsesores, obtenerDatosClientes, updateEstadoAsesor, buscarAsesor, obtenerDuplicados } = require('../controllers/asesoresController');
const { verifyToken } = require('../middleware/authMiddleware');

// Obtener todos los asesores
router.get('/', getAsesores);

// Actualizar estado de un asesor (sin auth para desarrollo)
router.put('/:id/estado', updateEstadoAsesor);

// Obtener datos de los clientes
router.get('/clientes', verifyToken, obtenerDatosClientes);

// Buscar asesor por nombre
router.get('/buscar/:nombre', buscarAsesor);

// Obtener duplicados de un cliente
router.get('/clientes/:id/duplicados', obtenerDuplicados);

module.exports = router;