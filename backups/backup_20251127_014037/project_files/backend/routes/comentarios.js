const express = require('express');
const router = express.Router();
const {
  crearComentarioGTR,
  obtenerComentariosCliente,
  marcarComentarioLeido,
  obtenerComentariosNoLeidos
} = require('../controllers/comentariosController');

// Crear comentario GTR
router.post('/', crearComentarioGTR);

// Obtener comentarios de un cliente
router.get('/:clienteId', obtenerComentariosCliente);

// Marcar comentario como leído
router.put('/:id/marcar-leido', marcarComentarioLeido);

// Obtener comentarios no leídos de un asesor
router.get('/asesor/:asesorId/no-leidos', obtenerComentariosNoLeidos);

module.exports = router;
