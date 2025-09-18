const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT para un usuario.
 * @param {Object} user - Objeto del usuario con información relevante.
 * @returns {string} - Token JWT generado.
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = {
  generateToken,
};