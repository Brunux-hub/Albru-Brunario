// Controlador para manejar la lógica de clientes

const pool = require('../config/database');

const getClientes = (req, res) => {
  res.send('Obteniendo todos los clientes');
};

const createCliente = (req, res) => {
  res.send('Creando un nuevo cliente');
};

const updateCliente = (req, res) => {
  res.send(`Actualizando cliente con ID ${req.params.id}`);
};

const reassignCliente = async (req, res) => {
  const { clientId, previousAdvisor, newAdvisor } = req.body;

  console.log('Datos recibidos para reasignación:', { clientId, previousAdvisor, newAdvisor });

  try {
    // Actualizar el asesor en la base de datos
    const query = 'UPDATE clientes SET asesor = $1 WHERE id = $2 RETURNING *';
    const values = [newAdvisor, clientId];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      console.log('Cliente no encontrado:', clientId);
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    console.log('Reasignación exitosa:', result.rows[0]);
    res.status(200).json({ message: 'Reasignación exitosa', cliente: result.rows[0] });
  } catch (error) {
    console.error('Error al reasignar cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getClientes,
  createCliente,
  updateCliente,
  reassignCliente,
};