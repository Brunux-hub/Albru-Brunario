// Controlador para manejar la lógica de clientes

const getClientes = (req, res) => {
  res.send('Obteniendo todos los clientes');
};

const createCliente = (req, res) => {
  res.send('Creando un nuevo cliente');
};

const updateCliente = (req, res) => {
  res.send(`Actualizando cliente con ID ${req.params.id}`);
};

module.exports = {
  getClientes,
  createCliente,
  updateCliente,
};