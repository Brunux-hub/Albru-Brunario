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

// Mount usuarios/auth routes
const usuariosRoutes = require('./routes/usuarios');
app.use('/api/auth', usuariosRoutes);
// Evitar montar en '/api' genérico para prevenir colisiones con rutas simples
app.use('/api/usuarios', usuariosRoutes);

// Simple endpoints
app.get('/api/asesores', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.id as asesor_id,
        u.id as usuario_id,
        u.nombre,
        u.email,
        u.telefono,
        u.estado,
        a.clientes_asignados,
        a.meta_mensual,
        a.ventas_realizadas,
        a.comision_porcentaje
      FROM asesores a
      JOIN usuarios u ON a.usuario_id = u.id
      WHERE u.estado = 'activo' AND u.tipo = 'asesor'
    `);
    res.json({ success: true, asesores: rows });
  } catch (error) {
    console.error('Error obteniendo asesores:', error);
    res.status(500).json({ success: false, message: 'Error al obtener asesores', error: error.message });
  }
});

app.get('/api/asesores/buscar/:nombre', async (req, res) => {
  try {
    const nombre = req.params.nombre || '';
    const [rows] = await pool.query(`
      SELECT 
        a.id as asesor_id,
        u.id as usuario_id,
        u.nombre,
        u.email,
        u.telefono,
        u.estado
      FROM asesores a
      JOIN usuarios u ON a.usuario_id = u.id
      WHERE UPPER(u.nombre) LIKE UPPER(?) AND u.estado = 'activo' AND u.tipo = 'asesor'
    `, [`%${nombre}%`]);
    res.json({ success: true, resultados: rows });
  } catch (error) {
    console.error('Error buscando asesores:', error);
    res.status(500).json({ success: false, message: 'Error al buscar asesores', error: error.message });
  }
});

app.get('/api/clientes/asesor/:asesorId', async (req, res) => {
  try {
    const asesorId = req.params.asesorId;
    const [rows] = await pool.query('SELECT id, nombre, telefono, dni, email, direccion, estado, observaciones_asesor as gestion, fecha_primer_contacto as fecha, fecha_ultimo_contacto as seguimiento FROM clientes WHERE asesor_asignado = ? ORDER BY created_at DESC', [asesorId]);
    res.json({ success: true, clientes: rows });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener clientes', error: error.message });
  }
});

// Exponer endpoint para cambiar estado del asesor (activo/inactivo)
app.put('/api/asesores/:id/estado', async (req, res) => {
  return updateEstadoAsesor(req, res);
});

// Reasignar cliente a otro asesor con transacción
app.post('/api/clientes/reasignar', async (req, res) => {
  const { clienteId, nuevoAsesorId, gtrId, comentario } = req.body || {};

  console.log('🎯 Backend: Reasignación solicitada. Payload recibido:', JSON.stringify(req.body, null, 2));

  // Validaciones específicas
  if (!clienteId) {
    console.error('❌ Backend: clienteId faltante o inválido:', clienteId);
    return res.status(400).json({ 
      success: false, 
      message: 'clienteId es requerido',
      received: { clienteId, nuevoAsesorId, gtrId }
    });
  }

  if (!nuevoAsesorId) {
    console.error('❌ Backend: nuevoAsesorId faltante o inválido:', nuevoAsesorId);
    return res.status(400).json({ 
      success: false, 
      message: 'nuevoAsesorId es requerido',
      received: { clienteId, nuevoAsesorId, gtrId }
    });
  }

  console.log('✅ Backend: Validaciones iniciales pasadas');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Obtener datos del cliente actual
    const [clienteRows] = await connection.query('SELECT id, nombre, telefono, dni, estado, asesor_asignado FROM clientes WHERE id = ?', [clienteId]);
    const cliente = clienteRows[0];

    if (!cliente) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    const antiguoAsesorId = cliente.asesor_asignado;

    // Obtener usuario_id del nuevo asesor (nuevoAsesorId es el asesor_id de la tabla asesores)
    const [nuevoAsesorData] = await connection.query('SELECT usuario_id FROM asesores WHERE id = ?', [nuevoAsesorId]);
    
    if (!nuevoAsesorData || nuevoAsesorData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Asesor no encontrado' });
    }
    
    const nuevoUsuarioId = nuevoAsesorData[0].usuario_id;
    console.log(`✅ Backend: Asesor encontrado - asesor_id: ${nuevoAsesorId}, usuario_id: ${nuevoUsuarioId}`);

    // Actualizar asignación en la tabla clientes (usa usuario_id)
    await connection.query('UPDATE clientes SET asesor_asignado = ? WHERE id = ?', [nuevoUsuarioId, clienteId]);
    console.log(`✅ Backend: Cliente ${clienteId} actualizado con asesor_asignado = ${nuevoUsuarioId}`);

    // Registrar en historial si la tabla existe
    try {
      await connection.query('INSERT INTO historial_cliente (cliente_id, usuario_id, accion, descripcion, estado_nuevo) VALUES (?, ?, ?, ?, ?)', [clienteId, gtrId || null, 'reasignado_asesor', comentario || `Reasignado a asesor ${nuevoAsesorId}`, cliente.estado || null]);
    } catch (e) {
      // Si la tabla no existe, no falle la operación completa
      console.warn('No se pudo insertar en historial_cliente (posible ausencia de tabla):', e.message);
    }

    // Actualizar contadores: decrementar en antiguo asesor (si existe) y aumentar en nuevo asesor
    if (antiguoAsesorId) {
      // Obtener asesor_id del antiguo usuario_id
      const [antiguoAsesorData] = await connection.query('SELECT id FROM asesores WHERE usuario_id = ?', [antiguoAsesorId]);
      if (antiguoAsesorData && antiguoAsesorData.length > 0) {
        await connection.query('UPDATE asesores SET clientes_asignados = GREATEST(IFNULL(clientes_asignados,0) - 1,0), updated_at = CURRENT_TIMESTAMP WHERE id = ?', [antiguoAsesorData[0].id]);
      }
    }
    await connection.query('UPDATE asesores SET clientes_asignados = IFNULL(clientes_asignados,0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [nuevoAsesorId]);
    console.log(`✅ Backend: Contadores de asesores actualizados`);

    // Obtener datos del nuevo asesor
    const [asesorRows] = await connection.query('SELECT a.id, u.nombre, u.id as usuario_id FROM asesores a JOIN usuarios u ON a.usuario_id = u.id WHERE a.id = ?', [nuevoAsesorId]);

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
          estado: cliente.estado
        },
        asesor: asesorRows[0] || { id: nuevoAsesorId },
        fecha_reasignacion: new Date()
      }
    });

    // Enviar notificación por WebSocket
    const webSocketService = require('./services/WebSocketService');
    webSocketService.notifyAll('CLIENT_REASSIGNED', {
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        dni: cliente.dni,
        estado: cliente.estado
      },
      nuevoAsesor: asesorRows[0] || { id: nuevoAsesorId },
      antiguoAsesor: { id: antiguoAsesorId },
      fecha_reasignacion: new Date(),
      clienteId: clienteId,
      nuevoAsesorId: nuevoAsesorId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error en reasignación:', error);
    res.status(500).json({ success: false, message: 'Error al reasignar cliente', error: error.message });
  } finally {
    connection.release();
  }
});

// Endpoints específicos para tipos de usuarios
app.get('/api/usuarios/todos', async (req, res) => {
  try {
    const [usuarios] = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.email,
        u.telefono,
        u.tipo,
        u.estado,
        u.created_at,
        u.username,
        CASE WHEN u.estado = 'activo' THEN 1 ELSE 0 END as activo,
        u.ultimo_acceso,
        CASE 
          WHEN u.tipo = 'admin' THEN a.nivel_acceso
          WHEN u.tipo = 'gtr' THEN g.region
          WHEN u.tipo = 'asesor' THEN CONCAT('Meta: $', ases.meta_mensual)
          WHEN u.tipo = 'supervisor' THEN s.area_supervision
          WHEN u.tipo = 'validador' THEN v.tipo_validacion
          ELSE 'Sin detalle'
        END as detalle_rol
      FROM usuarios u
      -- usuarios_sistema removed (consolidated)
      LEFT JOIN administradores a ON u.id = a.usuario_id
      LEFT JOIN gtr g ON u.id = g.usuario_id  
      LEFT JOIN asesores ases ON u.id = ases.usuario_id
      LEFT JOIN supervisores s ON u.id = s.usuario_id
      LEFT JOIN validadores v ON u.id = v.usuario_id
      ORDER BY u.tipo, u.created_at DESC
    `);

    res.json({
      success: true,
      usuarios
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener usuarios' 
    });
  }
});

app.get('/api/usuarios/asesores', async (req, res) => {
  try {
    const [asesores] = await pool.query(`
      SELECT 
        a.id as asesor_id,
        u.id as usuario_id,
        u.nombre,
        u.email,
        u.telefono,
        u.estado,
        a.clientes_asignados,
        a.meta_mensual,
        a.ventas_realizadas,
        a.comision_porcentaje,
        a.created_at,
        u.username,
        CASE WHEN u.estado = 'activo' THEN 1 ELSE 0 END as activo,
        u.ultimo_acceso,
        g.nombre as gtr_nombre
      FROM asesores a
      JOIN usuarios u ON a.usuario_id = u.id
      -- usuarios_sistema removed (consolidated)
      LEFT JOIN gtr gt ON a.gtr_asignado = gt.id
      LEFT JOIN usuarios g ON gt.usuario_id = g.id
      WHERE u.tipo = 'asesor'
      ORDER BY a.created_at DESC
    `);

    res.json({
      success: true,
      asesores
    });
  } catch (error) {
    console.error('Error obteniendo asesores:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener asesores' 
    });
  }
});

app.get('/api/usuarios/administradores', async (req, res) => {
  try {
    const [administradores] = await pool.query(`
      SELECT 
        a.id as admin_id,
        u.id as usuario_id,
        u.nombre,
        u.email,
        u.telefono,
        u.estado,
        a.nivel_acceso,
        a.permisos_especiales,
        a.created_at,
        u.username,
        CASE WHEN u.estado = 'activo' THEN 1 ELSE 0 END as activo
      FROM administradores a
      JOIN usuarios u ON a.usuario_id = u.id
      -- usuarios_sistema removed (consolidated)
      WHERE u.tipo = 'admin'
      ORDER BY a.created_at DESC
    `);

    res.json({
      success: true,
      administradores
    });
  } catch (error) {
    console.error('Error obteniendo administradores:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener administradores' 
    });
  }
});

app.get('/api/usuarios/gtr', async (req, res) => {
  try {
    const [gtr] = await pool.query(`
      SELECT 
        g.id as gtr_id,
        u.id as usuario_id,
        u.nombre,
        u.email,
        u.telefono,
        u.estado,
        g.asesores_a_cargo,
        g.region,
        g.created_at,
        u.username,
        CASE WHEN u.estado = 'activo' THEN 1 ELSE 0 END as activo
      FROM gtr g
      JOIN usuarios u ON g.usuario_id = u.id
      -- usuarios_sistema removed (consolidated)
      WHERE u.tipo = 'gtr'
      ORDER BY g.created_at DESC
    `);

    res.json({
      success: true,
      gtr
    });
  } catch (error) {
    console.error('Error obteniendo GTR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener GTR' 
    });
  }
});

app.get('/api/usuarios/validadores', async (req, res) => {
  try {
    const [validadores] = await pool.query(`
      SELECT 
        v.id as validador_id,
        u.id as usuario_id,
        u.nombre,
        u.email,
        u.telefono,
        u.estado,
        v.tipo_validacion,
        v.validaciones_realizadas,
        v.created_at,
        u.username,
        CASE WHEN u.estado = 'activo' THEN 1 ELSE 0 END as activo
      FROM validadores v
      JOIN usuarios u ON v.usuario_id = u.id
      -- usuarios_sistema removed (consolidated)
      WHERE u.tipo = 'validador'
      ORDER BY v.created_at DESC
    `);

    res.json({
      success: true,
      validadores
    });
  } catch (error) {
    console.error('Error obteniendo validadores:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener validadores' 
    });
  }
});

app.get('/api/usuarios/supervisores', async (req, res) => {
  try {
    const [supervisores] = await pool.query(`
      SELECT 
        s.id as supervisor_id,
        u.id as usuario_id,
        u.nombre,
        u.email,
        u.telefono,
        u.estado,
        s.area_supervision,
        s.asesores_supervisados,
        s.created_at,
        u.username,
        CASE WHEN u.estado = 'activo' THEN 1 ELSE 0 END as activo
      FROM supervisores s
      JOIN usuarios u ON s.usuario_id = u.id
      -- usuarios_sistema removed (consolidated)
      WHERE u.tipo = 'supervisor'
      ORDER BY s.created_at DESC
    `);

    res.json({
      success: true,
      supervisores
    });
  } catch (error) {
    console.error('Error obteniendo supervisores:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener supervisores' 
    });
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

// BYPASS LOGIN TEMPORAL - SOLO PARA PRUEBAS
app.post('/api/auth/bypass-login', async (req, res) => {
  const { username } = req.body;
  
  if (username === 'gtr_maria') {
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('./middleware/authMiddleware');
    
    const token = jwt.sign(
      { userId: 2, asesorId: 1, username: 'gtr_maria', role: 'gtr' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return res.json({
      success: true,
      message: 'Login exitoso (bypass)',
      token,
      user: {
        id: 1,
        nombre: 'María García',
        email: 'maria.gtr@empresa.com',
        username: 'gtr_maria',
        role: 'gtr'
      }
    });
  }
  
  if (username === 'asesor_carlos') {
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('./middleware/authMiddleware');
    
    const token = jwt.sign(
      { userId: 3, asesorId: 2, username: 'asesor_carlos', role: 'asesor' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return res.json({
      success: true,
      message: 'Login exitoso (bypass)',
      token,
      user: {
        id: 2,
        nombre: 'Carlos López',
        email: 'carlos.asesor@empresa.com',
        username: 'asesor_carlos',
        role: 'asesor'
      }
    });
  }
  
  return res.status(401).json({ success: false, message: 'Usuario no disponible para bypass' });
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  // Catch-all SOLO para rutas que NO sean API (para SPA routing)
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const http = require('http');
const server = http.createServer(app);

// Inicializar WebSocket
const webSocketService = require('./services/WebSocketService');
webSocketService.initialize(server);

server.listen(port, () => {
  console.log(`Backend listening on port ${port} (env=${process.env.NODE_ENV || 'development'})`);
  console.log(`WebSocket server initialized on port ${port}`);
});

module.exports = app;
