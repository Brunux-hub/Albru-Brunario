const express = require('express');
const router = express.Router();
const { getAsesores } = require('../controllers/asesoresController');

// Obtener todos los asesores
router.get('/', getAsesores);

module.exports = router;