const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { 
  login, 
  obtenerAsesores, 
  crearAsesor, 
  actualizarAsesor, 
  eliminarAsesor 
} = require('../controllers/usuariosController');

const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Validaciones
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username es requerido'),
  body('password').isLength({ min: 3 }).withMessage('Password debe tener al menos 3 caracteres')
];

const crearAsesorValidation = [
  body('nombre').trim().notEmpty().withMessage('Nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('telefono').optional().isMobilePhone().withMessage('Teléfono inválido'),
  body('tipo').isIn(['gtr', 'asesor', 'validador']).withMessage('Tipo inválido'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username debe tener al menos 3 caracteres'),
  body('password').isLength({ min: 6 }).withMessage('Password debe tener al menos 6 caracteres'),
  body('role').isIn(['admin', 'gtr', 'asesor', 'supervisor', 'validaciones']).withMessage('Rol inválido')
];

// Rutas públicas
router.post('/login', loginValidation, login);

// Rutas protegidas - Solo admin
router.get('/admin/asesores', verifyToken, requireAdmin, obtenerAsesores);
router.post('/admin/crear-asesor', verifyToken, requireAdmin, crearAsesorValidation, crearAsesor);
router.put('/admin/asesor/:id', verifyToken, requireAdmin, actualizarAsesor);
router.delete('/admin/asesor/:id', verifyToken, requireAdmin, eliminarAsesor);

module.exports = router;