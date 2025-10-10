const express = require('express');
const router = express.Router();
const { getClienteByLead, getClienteByDni, searchClientes, getClienteById } = require('../controllers/clientesController');

router.get('/lead/:leadId', getClienteByLead);
router.get('/dni/:dni', getClienteByDni);
router.get('/search', searchClientes);
router.get('/:id', getClienteById);

module.exports = router;
