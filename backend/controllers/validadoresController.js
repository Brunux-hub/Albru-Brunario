const pool = require('../config/database');

/**
 * CONTROLADOR DE VALIDADORES
 * Gestiona clientes asignados a validadores y sus estadísticas
 * Usa autenticación JWT para identificar al validador
 */

/**
 * Obtener clientes asignados al validador autenticado
 */
const getClientesValidador = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autenticado' 
      });
    }

    console.log(`📋 [VALIDADORES] Obteniendo clientes para validador ${userId}`);

    // Obtener clientes asignados al validador con estado PREVENTA COMPLETA
    const [clientes] = await pool.query(`
      SELECT 
        c.id,
        c.nombre,
        c.telefono,
        c.email,
        c.dni_nombre_titular,
        c.tipo_plan,
        c.precio_plan,
        c.estatus_comercial_categoria,
        c.estatus_comercial_subcategoria,
        c.campana,
        c.canal_adquisicion,
        c.fecha_asignacion_validador,
        c.created_at,
        c.asesor_asignado,
        u.nombre as asesor_nombre
      FROM clientes c
      LEFT JOIN usuarios u ON c.asesor_asignado = u.id
      WHERE c.validador_asignado = ?
        AND c.estatus_comercial_subcategoria = 'PREVENTA COMPLETA'
      ORDER BY c.fecha_asignacion_validador DESC
    `, [userId]);

    console.log(`✅ [VALIDADORES] ${clientes.length} clientes encontrados`);

    res.status(200).json({
      success: true,
      clientes,
      total: clientes.length
    });
  } catch (error) {
    console.error('❌ Error al obtener clientes del validador:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener clientes' 
    });
  }
};

/**
 * Obtener estadísticas del validador autenticado
 */
const getEstadisticasValidador = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autenticado' 
      });
    }

    console.log(`📊 [VALIDADORES] Obteniendo estadísticas para validador ${userId}`);

    const fechaHoy = new Date().toISOString().split('T')[0];

    // Obtener estadísticas del día desde la tabla de stats
    const [stats] = await pool.query(`
      SELECT 
        clientes_asignados,
        clientes_validados
      FROM validador_stats_daily
      WHERE validador_id = ? AND fecha = ?
    `, [userId, fechaHoy]);

    // Obtener estadísticas adicionales de clientes
    const [clientesStats] = await pool.query(`
      SELECT
        COUNT(CASE WHEN estatus_comercial_subcategoria = 'PREVENTA COMPLETA' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estatus_comercial_subcategoria = 'VENTAS' THEN 1 END) as aprobados,
        COUNT(CASE WHEN estatus_comercial_subcategoria = 'RECHAZADO' THEN 1 END) as rechazados
      FROM clientes
      WHERE validador_asignado = ?
    `, [userId]);

    const estadisticas = { 
      clientes_asignados: stats[0]?.clientes_asignados || 0,
      clientes_validados: stats[0]?.clientes_validados || 0,
      pendientes: clientesStats[0]?.pendientes || 0,
      clientes_aprobados: clientesStats[0]?.aprobados || 0,
      clientes_rechazados: clientesStats[0]?.rechazados || 0
    };

    console.log(`✅ [VALIDADORES] Estadísticas:`, estadisticas);
    
    res.status(200).json({ 
      success: true, 
      estadisticas 
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas del validador:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas' 
    });
  }
};

/**
 * Actualizar estado de un cliente (aprobar/rechazar)
 */
const actualizarEstadoCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado, comentarios } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autenticado' 
      });
    }

    console.log(`🔄 [VALIDADORES] Validador ${userId} actualizando cliente ${id} → ${nuevoEstado}`);

    // Verificar que el cliente está asignado a este validador
    const [cliente] = await pool.query(
      'SELECT id FROM clientes WHERE id = ? AND validador_asignado = ?',
      [id, userId]
    );

    if (cliente.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar este cliente'
      });
    }

    // Actualizar estado del cliente
    await pool.query(
      'UPDATE clientes SET estatus_comercial_subcategoria = ? WHERE id = ?',
      [nuevoEstado, id]
    );

    // Registrar en historial
    await pool.query(
      `INSERT INTO historial_estados 
       (cliente_id, usuario_id, tipo, estado_nuevo, comentarios) 
       VALUES (?, ?, 'validador', ?, ?)`,
      [id, userId, nuevoEstado, comentarios || null]
    );

    // Notificación WebSocket (si está disponible)
    try {
      const webSocketService = require('../services/WebSocketService');
      webSocketService.notifyAll('CLIENT_VALIDATION_STATUS_UPDATED', {
        clienteId: parseInt(id),
        nuevoEstado,
        validadorId: userId,
        timestamp: new Date().toISOString()
      });
    } catch (wsError) {
      console.log('⚠️ WebSocket no disponible, continuando sin notificación');
    }

    console.log(`✅ [VALIDADORES] Cliente ${id} actualizado a ${nuevoEstado}`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Estado actualizado correctamente' 
    });
  } catch (error) {
    console.error('❌ Error al actualizar estado del cliente:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar estado' 
    });
  }
};

/**
 * Obtener lista de todos los validadores activos (para admin/GTR)
 */
const getValidadores = async (req, res) => {
  try {
    console.log(`📋 [VALIDADORES] Obteniendo lista de validadores`);

    const [validadores] = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.email,
        u.estado,
        ut.theme_name,
        ut.primary_color,
        ut.secondary_color,
        COUNT(c.id) as clientes_asignados
      FROM usuarios u
      LEFT JOIN user_themes ut ON u.id = ut.usuario_id
      LEFT JOIN clientes c ON u.id = c.validador_asignado 
        AND c.estatus_comercial_subcategoria = 'PREVENTA COMPLETA'
      WHERE u.tipo = 'validador' AND u.estado = 'activo'
      GROUP BY u.id
      ORDER BY u.nombre ASC
    `);

    console.log(`✅ [VALIDADORES] ${validadores.length} validadores encontrados`);

    res.status(200).json({ 
      success: true, 
      validadores,
      total: validadores.length 
    });
  } catch (error) {
    console.error('❌ Error al obtener validadores:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener validadores' 
    });
  }
};

module.exports = {
  getClientesValidador,
  getEstadisticasValidador,
  actualizarEstadoCliente,
  getValidadores
};
