const pool = require('../config/database');
const webSocketService = require('../services/WebSocketService');

// POST /api/comentarios-gtr - Crear comentario GTR para asesor
const crearComentarioGTR = async (req, res) => {
  try {
    const { cliente_id, gtr_id, asesor_id, mensaje } = req.body;

    if (!cliente_id || !gtr_id || !mensaje) {
      return res.status(400).json({
        success: false,
        message: 'cliente_id, gtr_id y mensaje son requeridos'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO comentarios_gtr (cliente_id, gtr_id, asesor_id, mensaje) 
       VALUES (?, ?, ?, ?)`,
      [cliente_id, gtr_id, asesor_id, mensaje]
    );

    const comentario = {
      id: result.insertId,
      cliente_id,
      gtr_id,
      asesor_id,
      mensaje,
      leido: false,
      created_at: new Date().toISOString()
    };

    // Obtener nombre del GTR
    const [gtrData] = await pool.query('SELECT nombre FROM usuarios WHERE id = ?', [gtr_id]);
    comentario.gtr_nombre = gtrData[0]?.nombre || 'GTR';

    console.log(`📝 Comentario GTR creado: ID ${result.insertId} para cliente ${cliente_id}`);

    // Notificar al asesor específico por WebSocket
    if (asesor_id) {
      webSocketService.notifyRoom(`asesor-${asesor_id}`, 'NEW_GTR_COMMENT', {
        comentario,
        clienteId: cliente_id
      });
      console.log(`📢 Notificación enviada al asesor ${asesor_id}`);
    }

    res.json({
      success: true,
      comentario
    });
  } catch (error) {
    console.error('Error creando comentario GTR:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear comentario'
    });
  }
};

// GET /api/comentarios-gtr/:clienteId - Obtener comentarios de un cliente
const obtenerComentariosCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;

    const [comentarios] = await pool.query(
      `SELECT 
        cg.*,
        u.nombre as gtr_nombre,
        u.email as gtr_email
       FROM comentarios_gtr cg
       LEFT JOIN usuarios u ON cg.gtr_id = u.id
       WHERE cg.cliente_id = ?
       ORDER BY cg.created_at DESC`,
      [clienteId]
    );

    res.json({
      success: true,
      comentarios
    });
  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comentarios'
    });
  }
};

// PUT /api/comentarios-gtr/:id/marcar-leido - Marcar comentario como leído
const marcarComentarioLeido = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE comentarios_gtr SET leido = TRUE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Comentario marcado como leído'
    });
  } catch (error) {
    console.error('Error marcando comentario como leído:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar comentario'
    });
  }
};

// GET /api/comentarios-gtr/asesor/:asesorId/no-leidos - Obtener comentarios no leídos de un asesor
const obtenerComentariosNoLeidos = async (req, res) => {
  try {
    const { asesorId } = req.params;

    const [comentarios] = await pool.query(
      `SELECT 
        cg.*,
        u.nombre as gtr_nombre,
        c.nombre as cliente_nombre,
        c.telefono as cliente_telefono
       FROM comentarios_gtr cg
       LEFT JOIN usuarios u ON cg.gtr_id = u.id
       LEFT JOIN clientes c ON cg.cliente_id = c.id
       WHERE cg.asesor_id = ? AND cg.leido = FALSE
       ORDER BY cg.created_at DESC`,
      [asesorId]
    );

    res.json({
      success: true,
      comentarios,
      count: comentarios.length
    });
  } catch (error) {
    console.error('Error obteniendo comentarios no leídos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comentarios'
    });
  }
};

module.exports = {
  crearComentarioGTR,
  obtenerComentariosCliente,
  marcarComentarioLeido,
  obtenerComentariosNoLeidos
};
