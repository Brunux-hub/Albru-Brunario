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

// Mount user theme routes
const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

// Mount validadores routes
const validadoresRoutes = require('./routes/validadores');
app.use('/api/validadores', validadoresRoutes);

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

// Endpoint: obtener historial (últimas gestiones)
app.get('/api/historial', async (req, res) => {
  try {
    const limit = Math.min(1000, Number(req.query.limit) || 200);
    const [rows] = await pool.query(`
      SELECT h.id, h.cliente_id, h.usuario_id, h.accion, h.descripcion, h.estado_nuevo, h.created_at as fecha_accion,
             u.nombre as usuario_nombre
      FROM historial_cliente h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      ORDER BY h.created_at DESC
      LIMIT ?
    `, [limit]);
    return res.json({ success: true, historial: rows });
  } catch (e) {
    console.error('Error obteniendo historial:', e);
    return res.status(500).json({ success: false, message: 'Error interno', error: e.message });
  }
});

// NOTA: Esta ruta está DUPLICADA y comentada porque ya está manejada por el router en routes/clientes.js
// que usa getClientesByAsesor del controlador clientesController.js
/*
app.get('/api/clientes/asesor/:asesorId', async (req, res) => {
  try {
    const param = req.params.asesorId;

    // Selección defensiva y mínima: columnas que el frontend usa siempre o con alta probabilidad
    const safeSelect = `
      SELECT
        c.id,
        c.nombre,
        c.telefono,
        c.dni,
        c.observaciones_asesor AS gestion,
        c.created_at AS fecha,
        c.fecha_ultimo_contacto AS seguimiento,
        c.servicio_contratado AS servicio,
        c.leads_original_telefono AS leads_original_telefono
      FROM clientes c
      WHERE c.asesor_asignado = ?
      ORDER BY c.created_at DESC
    `;

    let rows = [];
    try {
      [rows] = await pool.query(safeSelect, [param]);
    } catch (e) {
      // Fallback: si no existe asesor_asignado o la consulta falla, intentar mapear por usuario_id o por JSON
      console.warn('Consulta segura falló, intentando fallback:', e.message);
      const [asesorMatch] = await pool.query('SELECT id FROM asesores WHERE usuario_id = ? LIMIT 1', [param]);
      if (asesorMatch && asesorMatch.length > 0) {
        const asesorIdFound = asesorMatch[0].id;
        [rows] = await pool.query(safeSelect, [asesorIdFound]);
      } else {
        // Fallback JSON
        const jsonSql = `
          SELECT
            c.id, c.nombre, c.telefono, c.dni,
            c.observaciones_asesor AS gestion,
            c.created_at AS fecha, c.fecha_ultimo_contacto AS seguimiento,
            c.servicio_contratado AS servicio,
            NULL AS leads_original_telefono
          FROM clientes c
          WHERE JSON_UNQUOTE(JSON_EXTRACT(COALESCE(c.wizard_data_json, JSON_OBJECT()), '$.assigned_asesor_id')) = ?
          ORDER BY c.created_at DESC
        `;
        const [jsonRows] = await pool.query(jsonSql, [param]);
        rows = jsonRows;
      }
    }

    res.json({ success: true, clientes: rows });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener clientes', error: error.message });
  }
});
*/

// Exponer endpoint para cambiar estado del asesor (activo/inactivo)
app.put('/api/asesores/:id/estado', async (req, res) => {
  return updateEstadoAsesor(req, res);
});

// NOTA: Esta ruta está DUPLICADA y comentada porque ya está manejada por el router en routes/clientes.js
// que usa reasignarCliente del controlador clientesController.js
/*
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

  // Comprobar si las columnas 'asesor_asignado' y 'estado' existen en la tabla clientes
  const dbName = process.env.DB_NAME || 'albru';
  const [colAsesor] = await connection.query("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'asesor_asignado' LIMIT 1", [dbName]);
  const [colEstado] = await connection.query("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'estado' LIMIT 1", [dbName]);

  // Construir SELECT dinámico según columnas disponibles
  let selectCols = ['id', 'nombre', 'telefono'];
  if (colAsesor && colAsesor.length > 0) selectCols.push('asesor_asignado');
  if (colEstado && colEstado.length > 0) selectCols.push('estado');

  const selectSql = `SELECT ${selectCols.join(', ')} FROM clientes WHERE id = ?`;
  const [clienteRows] = await connection.query(selectSql, [clienteId]);
  const cliente = clienteRows[0];

    if (!cliente) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

  const antiguoAsesorId = cliente && cliente.asesor_asignado ? cliente.asesor_asignado : null;

    // Obtener usuario_id del nuevo asesor (nuevoAsesorId es el asesor_id de la tabla asesores)
    const [nuevoAsesorData] = await connection.query('SELECT usuario_id FROM asesores WHERE id = ?', [nuevoAsesorId]);
    
    if (!nuevoAsesorData || nuevoAsesorData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Asesor no encontrado' });
    }
    
    const nuevoUsuarioId = nuevoAsesorData[0].usuario_id;
    console.log(`✅ Backend: Asesor encontrado - asesor_id: ${nuevoAsesorId}, usuario_id: ${nuevoUsuarioId}`);

    // Actualizar asignación en la tabla clientes si la columna existe
    // También actualizar seguimiento_status = 'derivado', derivado_at y fecha_asignacion
    if (colAsesor && colAsesor.length > 0) {
      await connection.query(
        'UPDATE clientes SET asesor_asignado = ?, seguimiento_status = ?, derivado_at = NOW(), fecha_asignacion = NOW(), updated_at = NOW() WHERE id = ?', 
        [nuevoUsuarioId, 'derivado', clienteId]
      );
      console.log(`✅ Backend: Cliente ${clienteId} actualizado con asesor_asignado = ${nuevoUsuarioId}, seguimiento_status = 'derivado', fecha_asignacion = NOW()`);
    } else {
      // Si la columna real no existe (entorno intermedio), persistimos la asignación en un JSON existente
      // para no tocar el esquema: usamos `wizard_data_json` (columna JSON) como fallback para guardar metadata de asignación.
      try {
        await connection.query("UPDATE clientes SET wizard_data_json = JSON_SET(COALESCE(wizard_data_json, JSON_OBJECT()), '$.assigned_asesor_id', ?, '$.assigned_at', NOW()) WHERE id = ?", [nuevoAsesorId, clienteId]);
        console.log(`✅ Backend: Cliente ${clienteId} actualizado (fallback) en wizard_data_json assigned_asesor_id = ${nuevoAsesorId}`);
      } catch (e) {
        console.warn('No se pudo persistir asignación en wizard_data_json, omitiendo persistencia:', e.message);
      }
    }

    // Registrar en historial si la tabla existe
    try {
      // Guardar historial; si 'estado' fue seleccionado lo podríamos usar, pero para robustez guardamos null si no existe
      const estadoNuevo = cliente && cliente.estado ? cliente.estado : null;
  // Guardar historial; incluimos el nuevo asesor en la descripción para trazabilidad
  const descripcionHist = comentario ? `${comentario} | nuevo_asesor_id:${nuevoAsesorId}` : `Reasignado a asesor ${nuevoAsesorId}`;
  await connection.query('INSERT INTO historial_cliente (cliente_id, usuario_id, accion, descripcion, estado_nuevo) VALUES (?, ?, ?, ?, ?)', [clienteId, gtrId || null, 'reasignado_asesor', descripcionHist, estadoNuevo]);
    } catch (e) {
      // Si la tabla no existe, no falle la operación completa
      console.warn('No se pudo insertar en historial_cliente (posible ausencia de tabla):', e.message);
    }

    // Actualizar contadores: decrementar en antiguo asesor (si existe) y aumentar en nuevo asesor
    if (antiguoAsesorId) {
      // antiguoAsesorId ya es el id de la tabla `asesores` (si estaba asignado)
      await connection.query('UPDATE asesores SET clientes_asignados = GREATEST(IFNULL(clientes_asignados,0) - 1,0), updated_at = CURRENT_TIMESTAMP WHERE id = ?', [antiguoAsesorId]);
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
        estado: cliente.estado,
        seguimiento_status: 'derivado'
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
*/

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

    res.json({ success: true, gtr });
  } catch (error) {
    console.error('Error obteniendo gtr:', error);
    res.status(500).json({ success: false, message: 'Error al obtener gtr', error: error.message });
  }
});

// Endpoints temporales de diagnóstico: habilitar únicamente si ENABLE_DEBUG_ENDPOINTS=true
if (process.env.ENABLE_DEBUG_ENDPOINTS === 'true') {
  // listar columnas de la tabla clientes
  app.get('/api/debug/clientes_columns', async (req, res) => {
    try {
      const dbName = process.env.DB_NAME || 'albru';
      const [cols] = await pool.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes' ORDER BY ORDINAL_POSITION", [dbName]);
      return res.json({ success: true, columns: cols });
    } catch (e) {
      console.error('Error obteniendo columnas clientes:', e);
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // obtener fila completa de un cliente por id
  app.get('/api/debug/cliente/:id', async (req, res) => {
    try {
      const clienteId = req.params.id;
      if (!clienteId) return res.status(400).json({ success: false, message: 'cliente id requerido' });
      const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [clienteId]);
      if (!rows || rows.length === 0) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      return res.json({ success: true, cliente: rows[0] });
    } catch (e) {
      console.error('Error debug cliente:', e);
      return res.status(500).json({ success: false, error: e.message });
    }
  });
} else {
  // Si los endpoints debug están deshabilitados, responder 404 de forma segura
  app.get('/api/debug/clientes_columns', (_req, res) => res.status(404).json({ success: false, message: 'Not found' }));
  app.get('/api/debug/cliente/:id', (_req, res) => res.status(404).json({ success: false, message: 'Not found' }));
}

// Endpoint para notificar que un cliente está siendo gestionado (transitorio)
app.post('/api/clientes/notify-ocupado', async (req, res) => {
  try {
    const { clienteId, asesorId, ocupado } = req.body || {};
    console.log('📣 Notificación OCUPADO recibida:', JSON.stringify(req.body));

    // Validación mínima
    if (!clienteId) return res.status(400).json({ success: false, message: 'clienteId requerido' });

    // Reenviar notificación por WebSocket para que clientes GTR puedan reaccionar en tiempo real
    try {
      const webSocketService = require('./services/WebSocketService');
      webSocketService.notifyAll('CLIENT_OCUPADO', { clienteId, asesorId: asesorId || null, ocupado: !!ocupado, timestamp: new Date() });
    } catch (e) {
      console.warn('No se pudo notificar por WebSocket CLIENT_OCUPADO:', e.message);
    }

    // Responder OK (no persiste nada en BD)
    return res.json({ success: true, message: 'Notificación recibida' });
  } catch (e) {
    console.error('Error en notify-ocupado:', e);
    return res.status(500).json({ success: false, message: 'Error interno' });
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

const { getFeatures } = require('./controllers/featuresController');

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Exponer flags de características detectadas en la BD
app.get('/api/features', getFeatures);

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

// Iniciar worker de seguimiento para timeout automático de clientes
const seguimientoWorker = require('./services/seguimientoWorker');
seguimientoWorker.start(30000); // Poll cada 30 segundos

// Only start the HTTP server when this module is run directly.
// When the file is required by tests (e.g. `const app = require('../server')`),
// we avoid binding to a fixed port so tests can start the server on a dynamic port
// or use the express app directly with supertest. This prevents EADDRINUSE when
// the developer already has a local server running on the default port.
if (require.main === module) {
  server.listen(port, () => {
    console.log(`Backend listening on port ${port} (env=${process.env.NODE_ENV || 'development'})`);
    console.log(`WebSocket server initialized on port ${port}`);
    
    // Inicializar servicio de estadísticas diarias (nuevo sistema) - DENTRO del callback
    try {
      const dailyStatsResetService = require('./services/dailyStatsResetService');
      dailyStatsResetService.start();
      console.log('✅ [DAILY STATS] Servicio de estadísticas diarias iniciado');
    } catch (e) {
      console.error('❌ Error al iniciar servicio de estadísticas diarias:', e.message || e);
    }
  });

  // Programar reinicio diario de contadores de asesores y notificación por WebSocket (sistema legacy)
  try {
    const cron = require('node-cron');

    // Job diario a las 00:05 (server time) para evitar colisiones con tareas de medianoche
    cron.schedule('5 0 * * *', async () => {
      console.log('🕛 Ejecutando tarea diaria: reset de contadores de asesores (legacy)');
      try {
        // Intentar resetear columnas si existen (mode defensivo)
        const dbName = process.env.DB_NAME || 'albru';
        const [cols] = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'asesores' AND COLUMN_NAME IN ('clientes_atendidos','ventas_hoy')", [dbName]);
        const names = (cols || []).map(c => c.COLUMN_NAME);

        if (names.includes('clientes_atendidos')) {
          await pool.query('UPDATE asesores SET clientes_atendidos = 0');
          console.log('✅ Column clientes_atendidos reseteada a 0');
        }
        if (names.includes('ventas_hoy')) {
          await pool.query('UPDATE asesores SET ventas_hoy = 0');
          console.log('✅ Column ventas_hoy reseteada a 0');
        }

        // Notificar a todos los clientes conectados para que refresquen contadores en UI
        try {
          webSocketService.notifyAll('DAILY_COUNTERS_RESET', { timestamp: new Date().toISOString() });
          console.log('🔔 Notificación DAILY_COUNTERS_RESET enviada por WebSocket');
        } catch (wsErr) {
          console.warn('No se pudo notificar por WebSocket DAILY_COUNTERS_RESET:', wsErr.message || wsErr);
        }
      } catch (e) {
        console.error('Error en tarea diaria de reinicio de contadores:', e.message || e);
      }
    }, {
      scheduled: true,
      timezone: process.env.SERVER_TIMEZONE || 'America/Lima'
    });
  } catch (e) {
    console.warn('node-cron no disponible, omitiendo tarea diaria de reinicio de contadores');
  }
} else {
  // When required as a module (e.g. tests), export server as a property so tests
  // can decide how/when to listen (for dynamic ports) if needed.
  module.exports.server = server;
}

module.exports = app;
