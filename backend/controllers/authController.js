// Controlador Unificado de Autenticación - Monolito de Servicios Separados
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const pool = require('../config/database');

class AuthService {
  static async authenticateUser(email, password) {
    try {
      // Buscar usuario con configuración completa
      const [users] = await pool.query(
        `SELECT 
          id, nombre, email, password, telefono, tipo, estado,
          theme_primary, theme_secondary, theme_accent, theme_background, theme_surface,
          brand_name, logo_path, permissions, dashboard_path,
          created_at, updated_at
         FROM usuarios WHERE email = ? AND estado = 'activo'`,
        [email]
      );

      if (!users || users.length === 0) {
        return { success: false, message: 'Usuario no encontrado o inactivo' };
      }

      const user = users[0];
      
      // Verificar contraseña con bcrypt
      let isValidPassword = false;
      
      if (user.password) {
        // Si la contraseña empieza con $2b$, es bcrypt hash
        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$') || user.password.startsWith('$2y$')) {
          isValidPassword = await bcrypt.compare(password, user.password);
        } else {
          // Comparación directa para contraseñas legacy (no recomendado en producción)
          isValidPassword = password === user.password.toString();
        }
      }
      
      if (!isValidPassword) {
        return { success: false, message: 'Credenciales inválidas' };
      }

      // Actualizar último acceso
      await pool.query(
        'UPDATE usuarios SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      // Generar token JWT con todos los campos necesarios
      const token = jwt.sign(
        { 
          userId: user.id,
          nombre: user.nombre,
          email: user.email, 
          tipo: user.tipo,
          tenant_id: user.tenant_id || 1
        },
        process.env.JWT_SECRET || 'albru_jwt_secret_key_2025_secure_production',
        { expiresIn: '24h' }
      );

      // Preparar respuesta completa
      return {
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
      };

    } catch (error) {
      console.error('Error en AuthService.authenticateUser:', error);
      return { success: false, message: 'Error interno del servidor' };
    }
  }
}

// Controlador unificado de login
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

    // Soportar tanto 'email' como 'username' para compatibilidad
    const { email, username, password } = req.body;
    const userEmail = email || username;

    if (!userEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/usuario y contraseña son requeridos'
      });
    }

    console.log('Intento de login:', userEmail);

    const result = await AuthService.authenticateUser(userEmail, password);
    
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(401).json(result);
    }

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

module.exports = {
  AuthService,
  login
};