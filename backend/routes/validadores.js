const express = require('express');
const router = express.Router();
const { verifyToken, requireRoles } = require('../middleware/authMiddleware');
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
router.get('/mis-clientes', verifyToken, requireRoles(['validador', 'admin', 'gtr']), getClientesValidador);

// Obtener estadísticas del validador autenticado
router.get('/mis-estadisticas', verifyToken, requireRoles(['validador', 'admin', 'gtr']), getEstadisticasValidador);

// Actualizar estado de un cliente (aprobar/rechazar)
router.put('/cliente/:id', verifyToken, requireRoles(['validador', 'admin', 'gtr']), actualizarEstadoCliente);

// Obtener todos los validadores (para admin/GTR)
router.get('/', verifyToken, requireRoles(['admin', 'gtr']), getValidadores);

module.exports = router;
