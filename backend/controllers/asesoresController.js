const { Pool } = require('pg');
const pool = require('../config/database');

// Controlador para manejar la lógica de asesores

// Datos simulados para desarrollo (sin base de datos)
let asesoresSimulados = [
  {
    id: 1,
    nombre: 'JUAN',
    email: 'juan@albru.com',
    estado: 'Activo',
    sala: 'Sala 1',
    clientesAsignados: 5,
    clientesAtendidos: 12,
    ventasRealizadas: 8
  },
  {
    id: 2,
    nombre: 'SASKYA',
    email: 'saskya@albru.com',
    estado: 'Ocupado',
    sala: 'Sala 2',
    clientesAsignados: 3,
    clientesAtendidos: 15,
    ventasRealizadas: 12
  },
  {
    id: 3,
    nombre: 'MIA',
    email: 'mia@albru.com',
    estado: 'Activo',
    sala: 'Sala 3',
    clientesAsignados: 7,
    clientesAtendidos: 9,
    ventasRealizadas: 6
  }
];

const getAsesores = async (req, res) => {
  try {
    // Usar datos simulados en lugar de base de datos
    console.log('👥 Obteniendo lista de asesores simulados');
    res.status(200).json({ 
      success: true,
      asesores: asesoresSimulados,
      total: asesoresSimulados.length
    });
  } catch (error) {
    console.error('Error al obtener datos de los asesores:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const actualizarDatosCliente = async (req, res) => {
  const { clienteId, datos } = req.body;
  
  console.log(`✏️ Actualizando datos del cliente ${clienteId}:`, datos);

  try {
    // Simulación sin base de datos
    res.status(200).json({ 
      success: true,
      message: 'Datos actualizados correctamente', 
      clienteId,
      datos 
    });
  } catch (error) {
    console.error('Error al actualizar datos del cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const obtenerDatosClientes = async (req, res) => {
  try {
    // Simulación sin base de datos
    console.log('📋 Obteniendo datos de clientes para asesor');
    res.status(200).json({ 
      success: true,
      clientes: [],
      message: 'Datos simulados - implementar con base de datos real'
    });
  } catch (error) {
    console.error('Error al obtener datos de los clientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const updateEstadoAsesor = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  
  console.log(`🔄 Cambiando estado del asesor ${id} a: ${estado}`);
  
  try {
    const index = asesoresSimulados.findIndex(a => a.id === parseInt(id));
    if (index !== -1) {
      asesoresSimulados[index].estado = estado;
      res.status(200).json({
        success: true,
        message: 'Estado del asesor actualizado',
        asesor: asesoresSimulados[index]
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Asesor no encontrado'
      });
    }
  } catch (error) {
    console.error('Error al actualizar estado del asesor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getAsesores,
  actualizarDatosCliente,
  obtenerDatosClientes,
  updateEstadoAsesor
};