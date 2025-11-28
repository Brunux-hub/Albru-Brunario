const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/database');
const { JWT_SECRET } = require('../middleware/authMiddleware');
// Simple in-memory failed attempts tracker
const failedAttempts = new Map();
const MAX_FAILED = Number(process.env.MAX_FAILED_ATTEMPTS) || 5;
const LOCK_MINUTES = Number(process.env.LOCK_MINUTES) || 15; // minutes

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

    const { email, password } = req.body;
    // No loguear contraseñas ni el contenido completo del body en producción.
    if (process.env.NODE_ENV === 'development') {
      console.log('LOGIN DEBUG - intento de login para:', { email, origin: req.headers.origin || req.ip });
    }

    // Buscar usuario en la tabla correcta con configuración completa
    // Ahora soporta buscar por email O username (consolidación de tablas)
    const [users] = await pool.query(
      `SELECT 
        id, nombre, email, username, password, telefono, tipo, estado,
        theme_primary, theme_secondary, theme_accent, theme_background, theme_surface,
        brand_name, logo_path, permissions, dashboard_path,
        created_at, updated_at
       FROM usuarios WHERE email = ? OR username = ?`,
      [email, email]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    const user = users[0];
    if (process.env.NODE_ENV === 'development') {
      console.log('Usuario encontrado:', user.nombre, 'Email:', user.email, 'Estado:', user.estado);
    }

    // Verificar estado de acceso
    if (user.estado !== 'activo') {
      return res.status(403).json({ 
        success: false, 
        message: 'Tu cuenta está desactivada. Contacta al administrador.'
      });
    }

    // Check temporary lockout
    const fa = failedAttempts.get(user.email);
    if (fa && fa.lockUntil && Date.now() < fa.lockUntil) {
      return res.status(423).json({ success: false, message: 'Cuenta temporalmente bloqueada por intentos fallidos. Intenta más tarde.' });
    }

    // Verificar contraseña usando bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    // Log minimal: éxito/fracaso sin incluir valores sensibles
    if (!isValidPassword) {
      // increment failed attempts
      const prev = failedAttempts.get(user.email) || { count: 0 };
      prev.count = (prev.count || 0) + 1;
      if (prev.count >= MAX_FAILED) {
        prev.lockUntil = Date.now() + LOCK_MINUTES * 60 * 1000;
        prev.count = 0; // reset after lock
      }
      failedAttempts.set(user.email, prev);
      console.warn(`Login failed for ${email}. Failed count: ${prev.count}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // login successful -> clear failed attempts
    failedAttempts.delete(user.email);

    // Actualizar último acceso
    await pool.query(
      'UPDATE usuarios SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generar token JWT con datos completos del usuario
    const token = jwt.sign(
      { 
        sub: user.id,
        userId: user.id,
        nombre: user.nombre,
        email: user.email, 
        tipo: user.tipo,
        tenant_id: user.tenant_id || 1,
        theme_primary: user.theme_primary,
        theme_secondary: user.theme_secondary,
        theme_background: user.theme_background,
        brand_name: user.brand_name
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        tipo: user.tipo,
        estado: user.estado
      },
      theme: {
        primary: user.theme_primary,
        secondary: user.theme_secondary,
        accent: user.theme_accent,
        background: user.theme_background,
        surface: user.theme_surface
      },
      config: {
        brandName: user.brand_name,
        logoPath: user.logo_path,
        permissions: user.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : [],
        dashboardPath: user.dashboard_path
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

// GET /api/auth/profile - Obtener perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.sub;
    
    // Obtener datos completos del usuario
    const [users] = await pool.query(
      `SELECT 
        id, nombre, email, telefono, tipo, estado,
        theme_primary, theme_secondary, theme_accent, theme_background, theme_surface,
        brand_name, logo_path, permissions, dashboard_path,
        created_at, updated_at
       FROM usuarios WHERE id = ? AND estado = 'activo'`,
      [userId]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    const user = users[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        tipo: user.tipo,
        estado: user.estado
      },
      theme: {
        primary: user.theme_primary,
        secondary: user.theme_secondary,
        accent: user.theme_accent,
        background: user.theme_background,
        surface: user.theme_surface
      },
      config: {
        brandName: user.brand_name,
        logoPath: user.logo_path,
        permissions: user.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : [],
        dashboardPath: user.dashboard_path
      }
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// GET /api/admin/usuarios - Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
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
        u.updated_at,
        CASE 
          WHEN u.tipo = 'asesor' THEN COALESCE(CONCAT('Meta: $', ases.meta_mensual), 'Sin meta asignada')
          WHEN u.tipo = 'gtr' THEN COALESCE(CONCAT('Clientes: ', g.clientes_asignados), 'Sin datos GTR')
          ELSE CONCAT('Rol: ', u.tipo)
        END as detalle_rol
      FROM usuarios u
      LEFT JOIN asesores ases ON u.id = ases.usuario_id AND u.tipo = 'asesor'
      LEFT JOIN gtr g ON u.id = g.usuario_id AND u.tipo = 'gtr'
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
};

// GET /api/admin/asesores - Obtener solo asesores
const obtenerAsesores = async (req, res) => {
  try {
    const [asesores] = await pool.query(`
      SELECT 
        u.id,
        u.nombre,
        u.email,
        u.telefono,
        u.estado,
        u.created_at,
        COALESCE(a.clientes_asignados, 0) as clientes_asignados,
        COALESCE(a.meta_mensual, 0) as meta_mensual,
        COALESCE(a.ventas_realizadas, 0) as ventas_realizadas,
        COALESCE(a.comision_porcentaje, 0) as comision_porcentaje,
        gtr_u.nombre as gtr_nombre,
        (
          SELECT COUNT(*) 
          FROM clientes c 
          WHERE c.asesor_asignado = u.id 
            AND c.wizard_completado = 1 
            AND DATE(c.fecha_wizard_completado) = CURDATE()
        ) as clientes_gestionados_hoy,
        (
          SELECT COUNT(*) 
          FROM clientes c 
          WHERE c.asesor_asignado = u.id 
            AND c.reasignado = 1 
            AND DATE(c.fecha_reasignacion) = CURDATE()
        ) as clientes_reasignados_hoy
      FROM usuarios u
      LEFT JOIN asesores a ON u.id = a.usuario_id
      LEFT JOIN gtr g ON a.gtr_asignado = g.id
      LEFT JOIN usuarios gtr_u ON g.usuario_id = gtr_u.id
      WHERE u.tipo = 'asesor' AND u.estado = 'activo'
      ORDER BY u.created_at DESC
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

    // Verificar que username y email no existan en la tabla unificada usuarios
    const [existingUser] = await pool.query(
      'SELECT id FROM usuarios WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'El nombre de usuario o email ya existe' 
      });
    }

    // Hash de la contraseña con bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Insertar directamente en la tabla usuarios consolidada
    try {
      const [usuarioResult] = await pool.query(
        `INSERT INTO usuarios (nombre, email, username, password, telefono, tipo, estado) 
         VALUES (?, ?, ?, ?, ?, ?, 'activo')`,
        [nombre, email, username, passwordHash, telefono, tipo]
      );

      const usuarioId = usuarioResult.insertId;

      res.json({
        success: true,
        message: 'Asesor creado exitosamente',
        asesor: {
          id: usuarioId,
          nombre,
          email,
          username,
          telefono,
          tipo,
          role
        }
      });

    } catch (error) {
      console.error('Error creando asesor:', error);
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

// GET /api/admin/administradores - Obtener solo administradores
const obtenerAdministradores = async (req, res) => {
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
        us.username,
        us.activo
      FROM usuarios u
      LEFT JOIN administradores a ON u.id = a.usuario_id
      WHERE u.tipo = 'admin' AND u.estado = 'activo'
      ORDER BY u.created_at DESC
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
};

// GET /api/admin/gtr - Obtener solo GTR
const obtenerGtr = async (req, res) => {
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
        us.username,
        us.activo
      FROM usuarios u
      LEFT JOIN gtr g ON u.id = g.usuario_id
      WHERE u.tipo = 'gtr' AND u.estado = 'activo'
      ORDER BY u.created_at DESC
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
};

// GET /api/admin/validadores - Obtener solo validadores
const obtenerValidadores = async (req, res) => {
  try {
    const [validadores] = await pool.query(`
      SELECT 
        v.id as validador_id,
        u.id as usuario_id,
        u.nombre,
        u.email,
        u.username,
        u.telefono,
        u.estado,
        v.tipo_validacion,
        v.validaciones_realizadas,
        v.created_at
      FROM validadores v
      JOIN usuarios u ON v.usuario_id = u.id
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
};

// GET /api/admin/supervisores - Obtener solo supervisores
const obtenerSupervisores = async (req, res) => {
  try {
    const [supervisores] = await pool.query(`
      SELECT 
        s.id as supervisor_id,
        u.id as usuario_id,
        u.nombre,
        u.email,
        u.username,
        u.telefono,
        u.estado,
        s.area_supervision,
        s.asesores_supervisados,
        s.created_at
      FROM supervisores s
      JOIN usuarios u ON s.usuario_id = u.id
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
};

// POST /api/auth/admin/unlock - Desbloquear cuenta temporalmente bloqueada (solo admin)
const desbloquearUsuario = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email requerido' });
    if (failedAttempts.has(email)) {
      failedAttempts.delete(email);
    }
    return res.json({ success: true, message: `Usuario ${email} desbloqueado` });
  } catch (error) {
    console.error('Error desbloqueando usuario:', error);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

module.exports = {
  login,
  getProfile,
  obtenerUsuarios,
  obtenerAsesores,
  obtenerAdministradores,
  obtenerGtr,
  obtenerValidadores,
  obtenerSupervisores,
  crearAsesor,
  actualizarAsesor,
  eliminarAsesor,
  desbloquearUsuario
};