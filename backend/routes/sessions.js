/**
 * ALBRU CRM - RUTAS DE API DE SESIONES
 * Endpoints para gestión completa del ciclo de vida de sesiones
 * @module routes/sessions
 */

const express = require('express');
const router = express.Router();
const sessionService = require('../services/SessionService');
const socketService = require('../services/SocketService');
const pool = require('../config/database');

/**
 * POST /api/sessions/start
 * Inicia una sesión cuando el asesor abre el wizard
 */
router.post('/start', async (req, res) => {
  try {
    const { clienteId, asesorId } = req.body;

    if (!clienteId || !asesorId) {
      return res.status(400).json({
        success: false,
        message: 'clienteId y asesorId son requeridos',
      });
    }

    // Validar que el cliente existe y está en estado válido
    const [rows] = await pool.query(
      'SELECT id, seguimiento_status FROM clientes WHERE id = ?',
      [clienteId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado',
      });
    }

    if (rows[0].seguimiento_status !== 'derivado') {
      return res.status(400).json({
        success: false,
        message: `Cliente en estado inválido: ${rows[0].seguimiento_status}`,
      });
    }

    // Iniciar sesión
    const result = await sessionService.startSession(clienteId, asesorId);

    // Obtener datos completos del cliente para notificación
    const [clienteData] = await pool.query('SELECT * FROM clientes WHERE id = ?', [clienteId]);

    // Notificar via Socket.io
    if (clienteData.length > 0) {
      socketService.clientInGestion(clienteData[0]);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message,
    });
  }
});

/**
 * POST /api/sessions/end
 * Finaliza una sesión cuando el asesor completa el wizard
 */
router.post('/end', async (req, res) => {
  try {
    const { clienteId, asesorId, resultado = 'gestionado' } = req.body;

    if (!clienteId || !asesorId) {
      return res.status(400).json({
        success: false,
        message: 'clienteId y asesorId son requeridos',
      });
    }

    // Validar resultado
    const resultadosValidos = ['gestionado', 'no_gestionado', 'cerrado'];
    if (!resultadosValidos.includes(resultado)) {
      return res.status(400).json({
        success: false,
        message: `Resultado inválido. Valores permitidos: ${resultadosValidos.join(', ')}`,
      });
    }

    // Finalizar sesión
    const result = await sessionService.endSession(clienteId, asesorId, resultado);

    // Obtener datos completos del cliente
    const [clienteData] = await pool.query('SELECT * FROM clientes WHERE id = ?', [clienteId]);

    // Notificar via Socket.io
    if (clienteData.length > 0) {
      socketService.clientCompleted(clienteData[0]);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error al finalizar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al finalizar sesión',
      error: error.message,
    });
  }
});

/**
 * POST /api/sessions/heartbeat
 * Actualiza la actividad de una sesión (mantiene vivo el TTL)
 */
router.post('/heartbeat', async (req, res) => {
  try {
    const { clienteId, asesorId } = req.body;

    if (!clienteId || !asesorId) {
      return res.status(400).json({
        success: false,
        message: 'clienteId y asesorId son requeridos',
      });
    }

    const result = await sessionService.updateActivity(clienteId, asesorId);

    res.json(result);
  } catch (error) {
    console.error('❌ Error en heartbeat:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar actividad',
      error: error.message,
    });
  }
});

/**
 * GET /api/sessions/status/:clienteId
 * Obtiene el estado actual de una sesión
 */
router.get('/status/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;

    const status = await sessionService.getSessionStatus(clienteId);

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('❌ Error al obtener estado de sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado de sesión',
      error: error.message,
    });
  }
});

/**
 * POST /api/sessions/restore/:clienteId
 * Restaura una sesión desde MySQL a Redis
 */
router.post('/restore/:clienteId', async (req, res) => {
  try {
    const { clienteId } = req.params;

    const result = await sessionService.restoreSession(clienteId);

    res.json(result);
  } catch (error) {
    console.error('❌ Error al restaurar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restaurar sesión',
      error: error.message,
    });
  }
});

/**
 * GET /api/sessions/active
 * Obtiene todas las sesiones activas
 */
router.get('/active', async (req, res) => {
  try {
    const sessions = await sessionService.getAllActiveSessions();

    res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    console.error('❌ Error al obtener sesiones activas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener sesiones activas',
      error: error.message,
    });
  }
});

/**
 * POST /api/sessions/sync
 * Sincroniza sesiones entre MySQL y Redis (recovery)
 */
router.post('/sync', async (req, res) => {
  try {
    const result = await sessionService.syncSessions();

    res.json(result);
  } catch (error) {
    console.error('❌ Error al sincronizar sesiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al sincronizar sesiones',
      error: error.message,
    });
  }
});

module.exports = router;
