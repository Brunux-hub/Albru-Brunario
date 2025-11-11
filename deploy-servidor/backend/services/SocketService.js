/**
 * ALBRU CRM - SERVICIO DE SOCKET.IO
 * Gestión profesional de WebSocket con rooms, namespaces y eventos tipados
 * @module services/SocketService
 */

const { Server } = require('socket.io');
const config = require('../config/environment');

class SocketService {
  constructor() {
    this.io = null;
    this.connections = new Map(); // userId -> socket.id
  }

  /**
   * Inicializa Socket.io con el servidor HTTP
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: config.websocket.corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();

    console.log('✅ Socket.io inicializado correctamente');
  }

  /**
   * Configura los event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Cliente conectado: ${socket.id}`);

      // Autenticación/Identificación
      socket.on('authenticate', (data) => {
        const { userId, role } = data;
        
        socket.userId = userId;
        socket.role = role;
        
        this.connections.set(userId, socket.id);

        // Unir a rooms según rol
        if (role === 'gtr') {
          socket.join('gtr-room');
        } else if (role === 'asesor') {
          socket.join('asesor-room');
          socket.join(`asesor-${userId}`);
        }

        console.log(`✅ Usuario autenticado: ${userId} (${role})`);
        
        socket.emit('authenticated', { success: true, userId, role });
      });

      // GTR se une a su sala
      socket.on('join-gtr-room', (data) => {
        const { username } = data;
        socket.join('gtr-room');
        socket.role = 'gtr';
        console.log(`✅ GTR unido a sala: ${username}`);
        socket.emit('joined-room', { room: 'gtr-room', username });
      });

      // Asesor se une a su sala
      socket.on('join-asesor-room', (data) => {
        const { asesorId, username } = data;
        socket.join('asesor-room');
        if (asesorId) {
          socket.join(`asesor-${asesorId}`);
          socket.asesorId = asesorId;
          this.connections.set(asesorId, socket.id);
        }
        socket.role = 'asesor';
        console.log(`✅ Asesor unido a sala: ${username} (ID: ${asesorId})`);
        socket.emit('joined-room', { room: 'asesor-room', asesorId, username });
      });

      // Heartbeat manual (además del ping/pong automático)
      socket.on('heartbeat', (data) => {
        socket.emit('heartbeat-ack', { timestamp: Date.now() });
      });

      // Desconexión
      socket.on('disconnect', (reason) => {
        if (socket.userId) {
          this.connections.delete(socket.userId);
          console.log(`🔌 Usuario desconectado: ${socket.userId} - Razón: ${reason}`);
        }
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`❌ Socket error: ${socket.id}`, error);
      });
    });
  }

  /**
   * EVENTOS DE NEGOCIO
   */

  /**
   * Notifica que un cliente entró en gestión
   */
  clientInGestion(clienteData) {
    this.io.to('gtr-room').emit('CLIENT_IN_GESTION', {
      clienteId: clienteData.id,
      asesorId: clienteData.asesor_asignado,
      timestamp: new Date().toISOString(),
      data: clienteData,
    });

    console.log(`📢 [CLIENT_IN_GESTION] Cliente ${clienteData.id} -> GTR`);
  }

  /**
   * Notifica que un cliente fue devuelto a GTR (timeout)
   */
  clientReturnedToGTR(clienteData) {
    // Notificar a GTR
    this.io.to('gtr-room').emit('CLIENT_RETURNED_TO_GTR', {
      clienteId: clienteData.id,
      asesorId: clienteData.asesor_asignado,
      reason: 'timeout',
      timestamp: new Date().toISOString(),
      data: clienteData,
    });

    // Notificar al asesor específico
    if (clienteData.asesor_asignado) {
      this.io.to(`asesor-${clienteData.asesor_asignado}`).emit('CLIENT_TIMEOUT', {
        clienteId: clienteData.id,
        reason: 'Inactividad',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📢 [CLIENT_RETURNED_TO_GTR] Cliente ${clienteData.id} -> GTR (timeout)`);
  }

  /**
   * Notifica que un cliente fue completado
   */
  clientCompleted(clienteData) {
    this.io.to('gtr-room').emit('CLIENT_COMPLETED', {
      clienteId: clienteData.id,
      asesorId: clienteData.asesor_asignado,
      resultado: clienteData.seguimiento_status,
      timestamp: new Date().toISOString(),
      data: clienteData,
    });

    console.log(`📢 [CLIENT_COMPLETED] Cliente ${clienteData.id} -> GTR`);
  }

  /**
   * Notifica reasignación de cliente
   */
  clientReassigned(clienteData, oldAsesorId) {
    // Notificar a GTR
    this.io.to('gtr-room').emit('CLIENT_REASSIGNED', {
      clienteId: clienteData.id,
      oldAsesorId,
      newAsesorId: clienteData.asesor_asignado,
      timestamp: new Date().toISOString(),
    });

    // Notificar al asesor anterior
    if (oldAsesorId) {
      this.io.to(`asesor-${oldAsesorId}`).emit('CLIENT_REMOVED', {
        clienteId: clienteData.id,
        reason: 'Reasignado a otro asesor',
      });
    }

    // Notificar al nuevo asesor
    if (clienteData.asesor_asignado) {
      this.io.to(`asesor-${clienteData.asesor_asignado}`).emit('CLIENT_ASSIGNED', {
        clienteId: clienteData.id,
        data: clienteData,
      });
    }

    console.log(`📢 [CLIENT_REASSIGNED] Cliente ${clienteData.id}: ${oldAsesorId} -> ${clienteData.asesor_asignado}`);
  }

  /**
   * Notifica cambio de estado de cliente
   */
  clientStatusChanged(clienteData, oldStatus) {
    this.io.emit('CLIENT_STATUS_CHANGED', {
      clienteId: clienteData.id,
      oldStatus,
      newStatus: clienteData.seguimiento_status,
      asesorId: clienteData.asesor_asignado,
      timestamp: new Date().toISOString(),
    });

    console.log(`📢 [CLIENT_STATUS_CHANGED] Cliente ${clienteData.id}: ${oldStatus} -> ${clienteData.seguimiento_status}`);
  }

  /**
   * Notifica actualización de TTL de sesión
   */
  sessionTTLUpdated(clienteId, ttl) {
    this.io.emit('SESSION_TTL_UPDATED', {
      clienteId,
      ttl,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * HELPERS Y UTILIDADES
   */

  /**
   * Envía mensaje a un usuario específico
   */
  sendToUser(userId, event, data) {
    const socketId = this.connections.get(userId);
    
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    
    console.warn(`⚠️  Usuario ${userId} no conectado`);
    return false;
  }

  /**
   * Envía mensaje a todos los GTR
   */
  sendToGTR(event, data) {
    this.io.to('gtr-room').emit(event, data);
  }

  /**
   * Envía mensaje a todos los asesores
   */
  sendToAsesores(event, data) {
    this.io.to('asesor-room').emit(event, data);
  }

  /**
   * Broadcast a todos los clientes conectados
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  /**
   * Notifica a TODOS los clientes (GTR + Asesores)
   * Compatible con WebSocketService legacy
   */
  notifyAll(eventType, data) {
    console.log(`📡 [SocketService.notifyAll] Evento: '${eventType}'`);
    console.log(`📡 [SocketService.notifyAll] Payload:`, JSON.stringify(data, null, 2));
    
    if (!this.io) {
      console.error('❌ [SocketService.notifyAll] Socket.io no inicializado!');
      return;
    }

    // Emitir a TODOS los clientes conectados
    this.io.emit(eventType, data);
    
    // También emitir específicamente a las salas para asegurar llegada
    this.io.to('gtr-room').emit(eventType, data);
    this.io.to('asesor-room').emit(eventType, data);
    
    console.log(`✅ [SocketService.notifyAll] Evento '${eventType}' enviado a todos los clientes`);
  }

  /**
   * Obtiene estadísticas de conexiones
   */
  getStats() {
    return {
      totalConnections: this.connections.size,
      connectedUsers: Array.from(this.connections.keys()),
      rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
    };
  }

  /**
   * Verifica si un usuario está conectado
   */
  isUserConnected(userId) {
    return this.connections.has(userId);
  }

  /**
   * Desconecta un usuario específico
   */
  disconnectUser(userId, reason = 'Server requested') {
    const socketId = this.connections.get(userId);
    
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        console.log(`🔌 Usuario desconectado manualmente: ${userId}`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Health check
   */
  healthCheck() {
    return {
      status: this.io ? 'ok' : 'not initialized',
      connections: this.connections.size,
      uptime: process.uptime(),
    };
  }
}

// Singleton
const socketService = new SocketService();

module.exports = socketService;
