const express = require('express');
const router = express.Router();
const {
  getClientesValidador,
  getEstadisticasValidador,
  getValidadores,
  actualizarEstadoCliente
} = require('../controllers/validadoresController');

/**
 * RUTAS DE VALIDADORES
 * /api/validadores/*
 * Todas las rutas requieren autenticación JWT
 */

// Obtener clientes asignados al validador autenticado
router.get('/mis-clientes', getClientesValidador);

// Obtener estadísticas del validador autenticado
router.get('/mis-estadisticas', getEstadisticasValidador);

// Actualizar estado de un cliente (aprobar/rechazar)
router.put('/cliente/:id', actualizarEstadoCliente);

// Obtener todos los validadores (para admin/GTR)
router.get('/', getValidadores);

module.exports = router;
