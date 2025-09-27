const WebSocket = require('ws');

class WebSocketService {
  constructor() {
    this.clients = new Map(); // Almacenar clientes conectados por tipo
    this.wss = null;
  }

  // Inicializar servidor WebSocket
  initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws, req) => {
      console.log('🔌 Nueva conexión WebSocket establecida');

      // Manejar identificación del cliente (GTR o Asesor)
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'IDENTIFY') {
            this.handleIdentification(ws, data);
          } else if (data.type === 'CLIENT_REASSIGNED') {
            this.handleClientReassignment(data);
          } else if (data.type === 'NEW_CLIENT') {
            this.handleNewClient(data);
          } else {
            console.log('📨 Mensaje recibido:', data);
          }
        } catch (error) {
          console.error('❌ Error procesando mensaje WebSocket:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 Conexión WebSocket cerrada');
        this.removeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ Error en WebSocket:', error);
      });
    });

    console.log('🚀 Servidor WebSocket iniciado');
  }

  // Manejar identificación de clientes
  handleIdentification(ws, data) {
    const { clientType, advisorName } = data;
    
    ws.clientType = clientType; // 'GTR' o 'ASESOR'
    ws.advisorName = advisorName; // Solo para asesores
    
    if (!this.clients.has(clientType)) {
      this.clients.set(clientType, new Set());
    }
    this.clients.get(clientType).add(ws);

    console.log(`✅ Cliente identificado: ${clientType}${advisorName ? ` (${advisorName})` : ''}`);
    
    // Confirmar identificación
    ws.send(JSON.stringify({
      type: 'IDENTIFICATION_CONFIRMED',
      clientType,
      advisorName
    }));
  }

  // Manejar reasignación de cliente
  handleClientReassignment(data) {
    console.log('🔄 Procesando reasignación de cliente:', data);
    
    // Notificar a todos los asesores
    this.broadcastToAsesores({
      type: 'CLIENT_REASSIGNED',
      data: data.payload
    });

    // Notificar a GTR
    this.broadcastToGTR({
      type: 'CLIENT_REASSIGNMENT_CONFIRMED',
      data: data.payload
    });
  }

  // Manejar nuevo cliente
  handleNewClient(data) {
    console.log('👤 Procesando nuevo cliente:', data);
    
    // Notificar al asesor específico
    this.notifySpecificAsesor(data.payload.assignedTo, {
      type: 'NEW_CLIENT_ASSIGNED',
      data: data.payload
    });

    // Notificar a GTR
    this.broadcastToGTR({
      type: 'NEW_CLIENT_CONFIRMED',
      data: data.payload
    });
  }

  // Enviar mensaje a todos los asesores
  broadcastToAsesores(message) {
    const asesores = this.clients.get('ASESOR');
    if (asesores) {
      asesores.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
      console.log(`📡 Mensaje enviado a ${asesores.size} asesores`);
    }
  }

  // Enviar mensaje a GTR
  broadcastToGTR(message) {
    const gtrClients = this.clients.get('GTR');
    if (gtrClients) {
      gtrClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
      console.log(`📡 Mensaje enviado a ${gtrClients.size} clientes GTR`);
    }
  }

  // Notificar a un asesor específico
  notifySpecificAsesor(advisorName, message) {
    const asesores = this.clients.get('ASESOR');
    if (asesores) {
      let notified = false;
      asesores.forEach(ws => {
        if (ws.advisorName === advisorName && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
          notified = true;
        }
      });
      
      if (notified) {
        console.log(`📧 Mensaje enviado específicamente a asesor: ${advisorName}`);
      } else {
        console.log(`⚠️ Asesor ${advisorName} no encontrado o no conectado`);
      }
    }
  }

  // Remover cliente desconectado
  removeClient(ws) {
    if (ws.clientType) {
      const clients = this.clients.get(ws.clientType);
      if (clients) {
        clients.delete(ws);
      }
    }
  }

  // Notificar a todos los clientes (método faltante)
  notifyAll(eventType, data) {
    console.log(`📡 Enviando evento '${eventType}' a todos los clientes`);
    
    const message = {
      type: eventType,
      data: data,
      timestamp: new Date().toISOString()
    };

    // Notificar a GTR con el tipo de evento específico
    this.broadcastToGTR(message);
    
    // Notificar a todos los asesores con el tipo de evento específico
    this.broadcastToAsesores(message);
  }

  // Obtener estadísticas de conexiones
  getStats() {
    const stats = {};
    this.clients.forEach((clients, type) => {
      stats[type] = clients.size;
    });
    return stats;
  }
}

module.exports = new WebSocketService();