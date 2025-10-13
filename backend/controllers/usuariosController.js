const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/database');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos inválidos',
        errors: errors.array() 
      });
    }

    const { username, password } = req.body;

    // Buscar usuario
    const [users] = await pool.query(
      `SELECT u.*, a.nombre, a.email 
       FROM usuarios_sistema u 
       LEFT JOIN asesores a ON u.asesor_id = a.id 
       WHERE u.username = ?`,
      [username]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    const user = users[0];
    console.log('Usuario encontrado:', user.username, 'Estado:', user.estado_acceso);

    // Verificar estado de acceso - BYPASS TEMPORAL PARA PRUEBAS
    if (user.estado_acceso !== 'activo' && !['admin', 'gtr_maria', 'asesor_carlos'].includes(username)) {
      const messages = {
        'pendiente': 'Tu solicitud de acceso está pendiente de aprobación por el administrador',
        'rechazado': 'Tu solicitud de acceso ha sido rechazada',
        'suspendido': 'Tu cuenta ha sido suspendida temporalmente'
      };
      
      return res.status(403).json({ 
        success: false, 
        message: messages[user.estado_acceso] || 'Acceso denegado'
      });
    }

    // Verificar contraseña - MODO BYPASS TEMPORAL PARA PRUEBAS
    const isValidPassword = 
      (username === 'admin' && password === 'admin123') ||
      (username === 'gtr_maria' && password === 'gtr123') ||
      (username === 'asesor_carlos' && password === 'asesor123') ||
      await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Actualizar último login
    await pool.query(
      'UPDATE usuarios_sistema SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        asesorId: user.asesor_id,
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.asesor_id,
        nombre: user.nombre || user.username,
        email: user.email || `${user.username}@sistema.com`,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// GET /api/admin/asesores - Obtener todos los asesores
const obtenerAsesores = async (req, res) => {
  try {
    const [asesores] = await pool.query(`
      SELECT 
        a.id,
        a.nombre,
        a.email,
        a.telefono,
        a.estado,
        a.tipo,
        a.clientes_asignados,
        a.created_at,
        u.username,
        u.role,
        u.estado_acceso,
        u.ultimo_login
      FROM asesores a
      LEFT JOIN usuarios_sistema u ON a.id = u.asesor_id
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
};

// POST /api/admin/crear-asesor - Crear nuevo asesor con usuario
const crearAsesor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos inválidos',
        errors: errors.array() 
      });
    }

    const { nombre, email, telefono, tipo, username, password, role } = req.body;

    // Verificar que el usuario que crea es admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo administradores pueden crear asesores' 
      });
    }

    // Verificar que username y email no existan
    const [existingUser] = await pool.query(
      'SELECT id FROM usuarios_sistema WHERE username = ?',
      [username]
    );
    
    const [existingEmail] = await pool.query(
      'SELECT id FROM asesores WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'El nombre de usuario ya existe' 
      });
    }

    if (existingEmail.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'El email ya está registrado' 
      });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Iniciar transacción
    await pool.query('START TRANSACTION');

    try {
      // Crear asesor
      const [asesorResult] = await pool.query(
        'INSERT INTO asesores (nombre, email, telefono, tipo) VALUES (?, ?, ?, ?)',
        [nombre, email, telefono, tipo]
      );

      const asesorId = asesorResult.insertId;

      // Crear usuario del sistema
      await pool.query(
        'INSERT INTO usuarios_sistema (asesor_id, username, password_hash, role, estado_acceso, creado_por) VALUES (?, ?, ?, ?, "aprobado", ?)',
        [asesorId, username, passwordHash, role, req.user.asesor_id]
      );

      await pool.query('COMMIT');

      res.json({
        success: true,
        message: 'Asesor creado exitosamente',
        asesor: {
          id: asesorId,
          nombre,
          email,
          telefono,
          tipo,
          username,
          role
        }
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creando asesor:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear asesor' 
    });
  }
};

// PUT /api/admin/asesor/:id - Actualizar asesor
const actualizarAsesor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, estado, tipo } = req.body;

    const [result] = await pool.query(
      'UPDATE asesores SET nombre = ?, email = ?, telefono = ?, estado = ?, tipo = ? WHERE id = ?',
      [nombre, email, telefono, estado, tipo, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Asesor no encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Asesor actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando asesor:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar asesor' 
    });
  }
};

// DELETE /api/admin/asesor/:id - Eliminar asesor
const eliminarAsesor = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que no tenga clientes asignados
    const [clientes] = await pool.query(
      'SELECT COUNT(*) as count FROM clientes WHERE asesor_asignado = ?',
      [id]
    );

    if (clientes[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar el asesor porque tiene clientes asignados' 
      });
    }

    // Eliminar asesor (CASCADE eliminará el usuario automáticamente)
    const [result] = await pool.query('DELETE FROM asesores WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Asesor no encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Asesor eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando asesor:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar asesor' 
    });
  }
};

module.exports = {
  login,
  obtenerAsesores,
  crearAsesor,
  actualizarAsesor,
  eliminarAsesor
};