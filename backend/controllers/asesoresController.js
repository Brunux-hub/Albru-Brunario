const { Pool } = require('pg');
const pool = require('../config/database');

// Controlador para manejar la lógica de asesores

const getAsesores = (req, res) => {
  res.send('Obteniendo todos los asesores');
};

const actualizarDatosCliente = async (req, res) => {
  const { clienteId, datos } = req.body;

  try {
    // Actualizar datos del cliente en la base de datos
    const query = 'UPDATE clientes SET datos = $1 WHERE id = $2 RETURNING *';
    const values = [datos, clienteId];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Aquí se puede agregar la lógica para reflejar los datos en GTR

    res.status(200).json({ message: 'Datos actualizados correctamente', cliente: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar datos del cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const obtenerDatosClientes = async (req, res) => {
  try {
    // Recuperar datos de los clientes desde la base de datos
    const query = 'SELECT * FROM clientes';
    const result = await pool.query(query);

    res.status(200).json({ clientes: result.rows });
  } catch (error) {
    console.error('Error al obtener datos de los clientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getAsesores,
  actualizarDatosCliente,
  obtenerDatosClientes,
};