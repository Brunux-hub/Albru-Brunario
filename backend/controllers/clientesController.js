// Controlador para manejar la lógica de clientes

const pool = require('../config/database');
const WebSocketService = require('../services/WebSocketService');

// Datos simulados para desarrollo
let clientesSimulados = [
  {
    id: '91411663',
    nombre: 'Juan Pérez',
    dni: '12345678',
    email: 'juan@email.com',
    campana: 'MASIVO',
    canal: 'WSP 1',
    estado: 'En gestión',
    asesor: 'JUAN',
    fecha: '09/09/2025'
  },
  {
    id: '96765432',
    nombre: 'María García',
    dni: '87654321',
    email: 'maria@email.com',
    campana: 'REFERIDOS',
    canal: 'REFERIDO',
    estado: 'Vendido',
    asesor: 'SASKYA',
    fecha: '09/09/2025'
  }
];

const getClientes = (req, res) => {
  console.log('📋 Obteniendo lista de clientes simulados');
  res.status(200).json({
    success: true,
    clientes: clientesSimulados,
    total: clientesSimulados.length
  });
};

const createCliente = (req, res) => {
  console.log('👤 Creando nuevo cliente:', req.body);
  
  const nuevoCliente = {
    id: Date.now().toString(),
    ...req.body,
    fecha: new Date().toLocaleDateString('es-PE')
  };
  
  clientesSimulados.push(nuevoCliente);
  
  res.status(201).json({
    success: true,
    message: 'Cliente creado exitosamente',
    cliente: nuevoCliente
  });
};

const updateCliente = (req, res) => {
  const { id } = req.params;
  console.log(`✏️ Actualizando cliente con ID ${id}:`, req.body);
  
  const index = clientesSimulados.findIndex(c => c.id === id);
  if (index !== -1) {
    clientesSimulados[index] = { ...clientesSimulados[index], ...req.body };
    res.status(200).json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      cliente: clientesSimulados[index]
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Cliente no encontrado'
    });
  }
};

const reassignCliente = async (req, res) => {
  const { clientId, previousAdvisor, newAdvisor } = req.body;

  console.log('🔄 BACKEND: Datos recibidos para reasignación:', { clientId, previousAdvisor, newAdvisor });

  // Validar que todos los datos estén presentes
  if (!clientId || !newAdvisor) {
    console.log('❌ BACKEND: Datos incompletos');
    return res.status(400).json({ message: 'Datos incompletos: clientId y newAdvisor son requeridos' });
  }

  try {
    // Simulación de actualización exitosa (sin base de datos por ahora)
    console.log('✅ BACKEND: Simulando reasignación exitosa');

    const simulatedClient = {
      id: clientId,
      asesor: newAdvisor,
      previousAdvisor: previousAdvisor,
      updatedAt: new Date().toISOString()
    };

    console.log('✅ BACKEND: Reasignación simulada exitosa:', simulatedClient);

    // Notificar a través de WebSocket con el evento específico que escucha el frontend
    console.log('📡 BACKEND: Enviando notificación WebSocket...');
    WebSocketService.notifyAll('reasignacion de cliente', {
      clientId,
      previousAdvisor,
      newAdvisor,
      updatedClient: simulatedClient,
      timestamp: new Date().toISOString()
    });
    console.log('✅ BACKEND: Notificación WebSocket enviada');

    res.status(200).json({ 
      message: 'Reasignación exitosa', 
      cliente: simulatedClient,
      success: true
    });
  } catch (error) {
    console.error('❌ BACKEND: Error al reasignar cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

module.exports = {
  getClientes,
  createCliente,
  updateCliente,
  reassignCliente,
};