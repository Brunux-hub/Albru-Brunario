const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Middleware para obtener configuración del usuario desde BD (SOLUCIÓN SENIOR)
const getUserConfig = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token requerido' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'albru_jwt_secret_key_2025_secure_production');
    const userEmail = decoded.email;
    
    // Obtener configuración del usuario desde la base de datos
    const [users] = await pool.query(
      `SELECT 
        id, nombre, email, tipo,
        theme_primary, theme_secondary, theme_accent, theme_background, theme_surface,
        brand_name, logo_path, permissions, dashboard_path
       FROM usuarios WHERE email = ? AND estado = 'activo'`,
      [userEmail]
    );
    
    if (!users || users.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usuario no autorizado o configuración no encontrada' 
      });
    }

    const user = users[0];
    
    // Construir configuración dinámica
    const userConfig = {
      userId: user.id,
      name: user.nombre,
      email: user.email,
      tipo: user.tipo,
      theme: {
        primary: user.theme_primary,
        secondary: user.theme_secondary,
        accent: user.theme_accent,
        background: user.theme_background,
        surface: user.theme_surface
      },
      brandName: user.brand_name,
      logoPath: user.logo_path,
      permissions: user.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : [],
      dashboardPath: user.dashboard_path
    };

    // Agregar configuración al request
    req.user = decoded;
    req.userConfig = userConfig;
    
    next();
  } catch (error) {
    console.error('Error en getUserConfig:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

// Endpoint para obtener configuración del usuario logueado
const getUserThemeConfig = async (req, res) => {
  try {
    const userConfig = req.userConfig;
    
    if (!userConfig) {
      return res.status(404).json({
        success: false,
        message: 'Configuración de usuario no encontrada'
      });
    }

    return res.json({
      success: true,
      config: {
        userId: userConfig.userId,
        name: userConfig.name,
        email: userConfig.email,
        tipo: userConfig.tipo,
        theme: userConfig.theme,
        brandName: userConfig.brandName,
        logoPath: userConfig.logoPath,
        permissions: userConfig.permissions,
        dashboardPath: userConfig.dashboardPath
      }
    });
  } catch (error) {
    console.error('Error getUserThemeConfig:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getUserConfig,
  getUserThemeConfig
};