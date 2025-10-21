const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'albru_secret_key_2025';

// Middleware para verificar token JWT
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acceso requerido' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar que el usuario sigue siendo válido en la tabla unificada
    const [users] = await pool.query(
      'SELECT * FROM usuarios WHERE id = ? AND estado = "activo"',
      [decoded.userId]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido o usuario sin acceso' 
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

// Middleware para verificar rol de administrador
const requireAdmin = (req, res, next) => {
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Solo administradores.' 
    });
  }
  next();
};

// Middleware para verificar múltiples roles
const requireRoles = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.tipo)) {
      return res.status(403).json({ 
        success: false, 
        message: `Acceso denegado. Roles requeridos: ${roles.join(', ')}` 
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireRoles,
  JWT_SECRET
};