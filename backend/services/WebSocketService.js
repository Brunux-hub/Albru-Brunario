const WebSocket = require('ws');
const socketService = require('./SocketService');

class WebSocketService {
  constructor() {
    this.clients = new Map(); // Almacenar clientes conectados por tipo
    this.wss = null;
    this.socketService = socketService;
  }

  // Inicializar servidor WebSocket (LEGACY - mantener para compatibilidad)
  initialize(server) {
    console.log('⚠️  WebSocketService.initialize() llamado (LEGACY - usando SocketService)');
    // Ya no inicializamos ws nativo, Socket.io maneja todo
  }

  // LEGACY METHODS - Mantenidos para compatibilidad pero ahora usan SocketService

  handleIdentification(ws, data) {
    console.log('⚠️  handleIdentification (LEGACY) - Socket.io maneja esto automáticamente');
  }

  handleClientReassignment(data) {
    console.log('🔄 handleClientReassignment (LEGACY) - redirigiendo a SocketService');
    if (this.socketService && this.socketService.io) {
      this.socketService.clientReassigned(data.payload);
    }
  }

  handleNewClient(data) {
    console.log('👤 handleNewClient (LEGACY) - redirigiendo a SocketService');
    if (this.socketService && this.socketService.io) {
      this.socketService.notifyAll('NEW_CLIENT_ASSIGNED', data.payload);
    }
  }

  broadcastToAsesores(message) {
    console.log('📡 broadcastToAsesores (LEGACY) - usando SocketService');
    if (this.socketService && this.socketService.io) {
      this.socketService.sendToAsesores(message.type, message.data || message);
    }
  }

  broadcastToGTR(message) {
    console.log('📡 broadcastToGTR (LEGACY) - usando SocketService');
    if (this.socketService && this.socketService.io) {
      this.socketService.sendToGTR(message.type, message.data || message);
    }
  }

  notifySpecificAsesor(advisorName, message) {
    console.log(`📧 notifySpecificAsesor (LEGACY) - No implementado en Socket.io (enviar a sala específica)`);
    // Socket.io usa rooms por ID, no por nombre
  }

  removeClient(ws) {
    console.log('🔌 removeClient (LEGACY) - Socket.io maneja esto automáticamente');
  }

  // Notificar a todos los clientes - AHORA USA SOCKET.IO
  notifyAll(eventType, data) {
    console.log(`📡 [WebSocketService→SocketService] Enviando evento '${eventType}' a todos los clientes`);
    
    // Usar el nuevo SocketService en lugar del viejo ws
    if (this.socketService && this.socketService.io) {
      this.socketService.notifyAll(eventType, data);
    } else {
      console.warn('⚠️  SocketService no disponible, evento no enviado');
    }
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