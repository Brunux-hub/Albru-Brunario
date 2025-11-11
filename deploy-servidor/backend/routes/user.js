const express = require('express');
const router = express.Router();
const { getUserConfig, getUserThemeConfig } = require('../middleware/dynamicUserThemes');

// GET /api/user/theme - Obtener configuración de tema del usuario (DINÁMICO)
router.get('/theme', getUserConfig, getUserThemeConfig);

module.exports = router;