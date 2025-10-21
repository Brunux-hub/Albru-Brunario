const express = require('express');
const router = express.Router();

// Importar el controlador de usuarios para reutilizar la lógica
const { login, getProfile } = require('../controllers/usuariosController');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/authMiddleware');

// Validaciones para auth/login (compatible con frontend)
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email o username es requerido')
    .isLength({ min: 3 }).withMessage('Debe tener al menos 3 caracteres'),
  body('password').isLength({ min: 3 }).withMessage('Password debe tener al menos 3 caracteres')
];

// POST /api/auth/login - Redirigir a la lógica de usuarios
router.post('/login', loginValidation, login);

// GET /api/auth/profile - Obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, getProfile);

module.exports = router;