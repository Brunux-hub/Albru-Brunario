const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const loginRateLimit = require('../middleware/loginRateLimit');

const { 
  login, 
  obtenerUsuarios,
  obtenerAsesores,
  obtenerAdministradores,
  obtenerGtr,
  obtenerValidadores,
  obtenerSupervisores,
  crearAsesor, 
  actualizarAsesor, 
  eliminarAsesor 
} = require('../controllers/usuariosController');

const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Validaciones
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email o username es requerido')
    .isLength({ min: 3 }).withMessage('Debe tener al menos 3 caracteres'),
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
router.post('/login', loginRateLimit, loginValidation, login);

// Admin: desbloquear cuenta temporal
router.post('/admin/unlock', verifyToken, requireAdmin, (req, res) => {
  const { desbloquearUsuario } = require('../controllers/usuariosController');
  return desbloquearUsuario(req, res);
});

// Rutas protegidas - Para consultas por tipo
router.get('/todos', obtenerUsuarios);
router.get('/asesores', obtenerAsesores);
router.get('/administradores', obtenerAdministradores);
router.get('/gtr', obtenerGtr);
router.get('/validadores', obtenerValidadores);
router.get('/supervisores', obtenerSupervisores);

// Rutas protegidas - Solo admin
router.get('/admin/asesores', verifyToken, requireAdmin, obtenerAsesores);
router.post('/admin/crear-asesor', verifyToken, requireAdmin, crearAsesorValidation, crearAsesor);
router.put('/admin/asesor/:id', verifyToken, requireAdmin, actualizarAsesor);
router.delete('/admin/asesor/:id', verifyToken, requireAdmin, eliminarAsesor);

module.exports = router;