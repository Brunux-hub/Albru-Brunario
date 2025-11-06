// Tipos para los mensajes WebSocket (LEGACY - mantener para compatibilidad)
type MessageCallback = (data: unknown) => void;

// Comentado - no usado en versión actual
// interface WebSocketMessage {
//   type: string;
//   data?: unknown;
//   clientType?: 'GTR' | 'ASESOR';
//   advisorName?: string;
//   payload?: unknown;
// }

interface ReassignmentData {
  clientId: number;
  previousAdvisor: string;
  newAdvisor: string;
  client: unknown;
}

interface NewClientData {
  client: unknown;
  assignedTo: string;
}

// Servicio para manejar la comunicación en tiempo real entre GTR y Asesor usando WebSockets
// ⚠️ LEGACY CODE - Sistema migrado a Socket.io, mantener solo para compatibilidad
class RealtimeService {
  private static instance: RealtimeService;
  private ws: WebSocket | null = null;
  private listeners: Map<string, MessageCallback[]> = new Map();

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  // Conectar al WebSocket (DESACTIVADO - usar useSocket hook)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connect(_clientType: 'GTR' | 'ASESOR', _advisorName?: string) {
    // ⚠️ TEMPORALMENTE DESACTIVADO - Sistema migrado a Socket.io
    // El nuevo sistema usa useSocket hook + SocketService en backend
    console.warn('⚠️ [RealtimeService] Sistema WebSocket legacy desactivado.');
    console.warn('⚠️ [RealtimeService] Usa el hook useSocket() para Socket.io');
  }

  // Intentar reconexión (DESACTIVADO - legacy code)
  // private attemptReconnect() {
  //   if (this.reconnectAttempts < this.maxReconnectAttempts) {
  //     this.reconnectAttempts++;
  //     console.log(`🔄 Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
  //     
  //     setTimeout(() => {
  //       if (this.clientType) {
  //         this.connect(this.clientType, this.advisorName || undefined);
  //       }
  //     }, 3000 * this.reconnectAttempts);
  //   } else {
  //     console.error('❌ Máximo de intentos de reconexión alcanzado');
  //   }
  // }

  // Manejar mensajes del servidor (DESACTIVADO - legacy code)
  // private handleMessage(message: WebSocketMessage) {
  //   console.log('📨 Mensaje recibido:', message);
  //   
  //   switch (message.type) {
  //     case 'IDENTIFICATION_CONFIRMED':
  //       console.log('✅ Identificación confirmada');
  //       this.notify('CONNECTED', message);
  //       break;
  //     
  //     case 'CLIENT_REASSIGNED':
  //       console.log('🔄 Cliente reasignado:', message.data);
  //       this.notify('CLIENT_REASSIGNED', message.data);
  //       break;
  //     
  //     case 'NEW_CLIENT_ASSIGNED':
  //       console.log('👤 Nuevo cliente asignado:', message.data);
  //       this.notify('NEW_CLIENT', message.data);
  //       break;
  //     
  //     case 'CLIENT_REASSIGNMENT_CONFIRMED':
  //       console.log('✅ Reasignación confirmada');
  //       this.notify('REASSIGNMENT_CONFIRMED', message.data);
  //       break;
  //     
  //     case 'reasignacion de cliente':
  //       console.log('📨 Evento de reasignación recibido:', message.data);
  //       this.notify('reasignacion de cliente', message.data);
  //       break;
  //     
  //     default:
  //       console.log('📨 Evento:', message.type, 'Data:', message.data);
  //       this.notify(message.type, message.data || message);
  //   }
  // }

  // Enviar mensaje al servidor (DESACTIVADO - legacy code)
  // private send(message: WebSocketMessage) {
  //   if (this.ws && this.ws.readyState === WebSocket.OPEN) {
  //     this.ws.send(JSON.stringify(message));
  //   } else {
  //     console.warn('⚠️ WebSocket no está conectado');
  //   }
  // }

  // Emitir evento de reasignación (DESACTIVADO - usar SocketService)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  emitClientReassigned(_data: ReassignmentData) {
    console.warn('⚠️ [RealtimeService] emitClientReassigned() desactivado. Usa SocketService');
  }

  // Emitir evento de nuevo cliente (DESACTIVADO - usar SocketService)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  emitNewClient(_data: NewClientData) {
    console.warn('⚠️ [RealtimeService] emitNewClient() desactivado. Usa SocketService');
  }

  // Suscribirse a eventos
  subscribe(eventType: string, callback: MessageCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    // Retornar función para desuscribirse
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Notificar a todos los listeners (DESACTIVADO - legacy code)
  // private notify(eventType: string, data: unknown) {
  //   const callbacks = this.listeners.get(eventType);
  //   if (callbacks) {
  //     callbacks.forEach(callback => {
  //       try {
  //         callback(data);
  //       } catch (error) {
  //         console.error('❌ Error en callback:', error);
  //       }
  //     });
  //   }
  // }

  // Desconectar
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  // Verificar estado de conexión
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export default RealtimeService;