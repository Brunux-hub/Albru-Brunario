const pool = require('../config/database');
const statusFlowEngine = require('../services/statusFlowEngine');
const webSocketService = require('../services/WebSocketService');

// PATCH /api/clientes/:id/estatus
const updateEstatus = async (req, res) => {
  const id = Number(req.params.id);
  const { tipo, estatus, comentarios, usuario_id, expected_updated_at, asesorId } = req.body || {};
  if (!id || !tipo || !estatus) return res.status(400).json({ success: false, message: 'clienteId, tipo y estatus requeridos' });

  try {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    const cliente = rows[0];

    const current = tipo === 'gtr' ? cliente.estatus_gtr : cliente.estatus_asesor;
    const validated = statusFlowEngine.validateTransition({ tipo, current, nuevo: estatus });
    if (!validated.valid) return res.status(400).json({ success: false, message: validated.reason });

    // optimistic locking if header provided
    if (expected_updated_at) {
      const currentUpdatedAt = cliente.updated_at ? new Date(cliente.updated_at).toISOString() : null;
      if (!currentUpdatedAt || currentUpdatedAt !== expected_updated_at) {
        return res.status(409).json({ success: false, message: 'Conflict: resource changed', current: cliente });
      }
    }

    const { updated, actions } = statusFlowEngine.applyRules({ cliente, tipo, nuevo: estatus });

    // CRÍTICO: Si el estatus es 'derivado' y viene asesorId, actualizar asesor_asignado y last_activity
    if (tipo === 'gtr' && estatus === 'derivado' && asesorId) {
      updated.asesor_asignado = asesorId;
      updated.last_activity = new Date(); // Inicializar last_activity al derivar
    }

    // Build UPDATE
    const setParts = [];
    const values = [];
    for (const [k, v] of Object.entries(updated)) {
      setParts.push(`${k} = ?`);
      values.push(v);
    }
    if (setParts.length) {
      values.push(id);
      const sql = `UPDATE clientes SET ${setParts.join(', ')}, updated_at = NOW() WHERE id = ?`;
      await pool.query(sql, values);
    }

    // Insertar en historial_estados (si la tabla existe)
    try {
      await pool.query(
        'INSERT INTO historial_estados (cliente_id, usuario_id, tipo, estado_anterior, estado_nuevo, comentarios) VALUES (?, ?, ?, ?, ?, ?)',
        [id, usuario_id || null, tipo, current || null, estatus, comentarios || null]
      );
    } catch (e) {
      console.warn('No se pudo insertar en historial_estados:', e.message);
    }

    // Notificar por websocket
    try {
      webSocketService.notifyAll('CLIENT_STATUS_UPDATED', {
        clienteId: id,
        tipo,
        estatus,
        usuarioId: usuario_id || null,
        timestamp: new Date().toISOString()
      });
    } catch (e) { console.warn('WS notify CLIENT_STATUS_UPDATED failed', e.message); }

    const [updatedRows] = await pool.query('SELECT * FROM clientes WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true, cliente: updatedRows[0], actions });

  } catch (err) {
    console.error('Error updateEstatus', err);
    return res.status(500).json({ success: false, message: 'Error interno', error: err.message });
  }
};

module.exports = { updateEstatus };
