require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
// Logging
app.use(morgan('combined'));

// Use centralized pool from config so controllers can require the same instance
const pool = require('./config/database');
// Import controller so we can reuse existing update logic
const { actualizarDatosCliente, updateEstadoAsesor } = require('./controllers/asesoresController');

// Mount clientes routes
const clientesRoutes = require('./routes/clientes');
app.use('/api/clientes', clientesRoutes);

// Simple endpoints
app.get('/api/asesores', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, email, tipo, clientes_asignados FROM asesores WHERE estado = "activo"');
    res.json({ success: true, asesores: rows });
  } catch (error) {
    console.error('Error obteniendo asesores:', error);
    res.status(500).json({ success: false, message: 'Error al obtener asesores', error: error.message });
  }
});

app.get('/api/asesores/buscar/:nombre', async (req, res) => {
  try {
    const nombre = req.params.nombre || '';
    const [rows] = await pool.query('SELECT id, nombre, email, tipo FROM asesores WHERE UPPER(nombre) LIKE UPPER(?) AND estado = "activo"', [`%${nombre}%`]);
    res.json({ success: true, resultados: rows });
  } catch (error) {
    console.error('Error buscando asesores:', error);
    res.status(500).json({ success: false, message: 'Error al buscar asesores', error: error.message });
  }
});

app.get('/api/clientes/asesor/:asesorId', async (req, res) => {
  try {
    const asesorId = req.params.asesorId;
    const [rows] = await pool.query('SELECT id, nombre, telefono, dni, correo_electronico, direccion, distrito, plan_seleccionado, precio_final, estado_cliente as estado, observaciones_asesor as gestion, fecha_asignacion as fecha, fecha_cita as seguimiento FROM clientes WHERE asesor_asignado = ? ORDER BY fecha_asignacion DESC', [asesorId]);
    res.json({ success: true, clientes: rows });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener clientes', error: error.message });
  }
});

// Exponer endpoint de actualización de cliente usando el controlador existente
// Se deja sin middleware de auth para desarrollo local (coincide con otras rutas públicas)
app.put('/api/asesores/actualizar-cliente', async (req, res) => {
  // Delegar en el controlador que ya maneja la validación y la query dinámica
  return actualizarDatosCliente(req, res);
});

// Exponer endpoint para cambiar estado del asesor (activo/inactivo)
app.put('/api/asesores/:id/estado', async (req, res) => {
  return updateEstadoAsesor(req, res);
});

// Reasignar cliente a otro asesor con transacción
app.post('/api/clientes/reasignar', async (req, res) => {
  const { clienteId, nuevoAsesorId, gtrId, comentario } = req.body || {};

  if (!clienteId || !nuevoAsesorId) {
    return res.status(400).json({ success: false, message: 'clienteId y nuevoAsesorId son requeridos' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Obtener datos del cliente actual
    const [clienteRows] = await connection.query('SELECT id, nombre, telefono, dni, lead_id, estado_cliente, asesor_asignado FROM clientes WHERE id = ?', [clienteId]);
    const cliente = clienteRows[0];

    if (!cliente) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    const antiguoAsesorId = cliente.asesor_asignado;

    // Actualizar asignación
    await connection.query('UPDATE clientes SET asesor_asignado = ? WHERE id = ?', [nuevoAsesorId, clienteId]);

    // Registrar en historial si la tabla existe
    try {
      await connection.query('INSERT INTO historial_cliente (cliente_id, usuario_id, accion, estado_nuevo, comentarios) VALUES (?, ?, ?, ?, ?)', [clienteId, gtrId || null, 'reasignado_asesor', cliente.estado_cliente || null, comentario || `Reasignado a asesor ${nuevoAsesorId}`]);
    } catch (e) {
      // Si la tabla no existe, no falle la operación completa
      console.warn('No se pudo insertar en historial_cliente (posible ausencia de tabla):', e.message);
    }

    // Actualizar contadores: decrementar en antiguo asesor (si existe) y aumentar en nuevo asesor
    if (antiguoAsesorId) {
      await connection.query('UPDATE asesores SET clientes_asignados = GREATEST(IFNULL(clientes_asignados,0) - 1,0), updated_at = CURRENT_TIMESTAMP WHERE id = ?', [antiguoAsesorId]);
    }
    await connection.query('UPDATE asesores SET clientes_asignados = IFNULL(clientes_asignados,0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [nuevoAsesorId]);

    // Obtener datos del nuevo asesor
    const [asesorRows] = await connection.query('SELECT id, nombre FROM asesores WHERE id = ?', [nuevoAsesorId]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Cliente reasignado exitosamente',
      data: {
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          dni: cliente.dni,
          lead_id: cliente.lead_id,
          estado: cliente.estado_cliente
        },
        asesor: asesorRows[0] || { id: nuevoAsesorId },
        fecha_reasignacion: new Date()
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error en reasignación:', error);
    res.status(500).json({ success: false, message: 'Error al reasignar cliente', error: error.message });
  } finally {
    connection.release();
  }
});

// Admin demo endpoints
const { getDashboard, getTopAsesores } = require('./controllers/adminController');

app.get('/api/admin/dashboard', async (req, res) => {
  return getDashboard(req, res);
});

app.get('/api/admin/asesores/top', async (req, res) => {
  return getTopAsesores(req, res);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.listen(port, () => {
  console.log(`Backend listening on port ${port} (env=${process.env.NODE_ENV || 'development'})`);
});

module.exports = app;