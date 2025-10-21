// Tipos para los mensajes WebSocket
type MessageCallback = (data: unknown) => void;

interface WebSocketMessage {
  type: string;
  data?: unknown;
  clientType?: 'GTR' | 'ASESOR';
  advisorName?: string;
  payload?: unknown;
}

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
class RealtimeService {
  private static instance: RealtimeService;
  private ws: WebSocket | null = null;
  private listeners: Map<string, MessageCallback[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private clientType: 'GTR' | 'ASESOR' | null = null;
  private advisorName: string | null = null;

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  // Conectar al WebSocket
  connect(clientType: 'GTR' | 'ASESOR', advisorName?: string) {
    this.clientType = clientType;
    this.advisorName = advisorName || null;

    // Determinar URL del WebSocket según el entorno
    const getWebSocketURL = (): string => {
      if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        
        // En desarrollo local
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'ws://localhost:3001';
        }
        
        // En producción
        const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
        const backendHost = import.meta.env?.VITE_BACKEND_URL || `${protocol}//${hostname}:3001`;
        
        // Convertir HTTP/HTTPS URL a WebSocket URL
        return backendHost.replace(/^https?:/, wsProtocol);
      }
      
      return 'ws://localhost:3001';
    };

    const wsUrl = getWebSocketURL();
    console.log('🔌 Conectando WebSocket a:', wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔌 Conectado al WebSocket');
        this.reconnectAttempts = 0;
        
        // Identificarse con el servidor
        this.send({
          type: 'IDENTIFY',
          clientType: this.clientType ?? undefined,
          advisorName: this.advisorName ?? undefined
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ Error procesando mensaje WebSocket:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket desconectado');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
      };

    } catch (error) {
      console.error('❌ Error conectando WebSocket:', error);
      this.attemptReconnect();
    }
  }

  // Intentar reconexión
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.clientType) {
          this.connect(this.clientType, this.advisorName || undefined);
        }
      }, 3000 * this.reconnectAttempts);
    } else {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
    }
  }

  // Manejar mensajes del servidor
  private handleMessage(message: WebSocketMessage) {
    console.log('📨 Mensaje recibido:', message);
    
    switch (message.type) {
      case 'IDENTIFICATION_CONFIRMED':
        console.log('✅ Identificación confirmada');
        this.notify('CONNECTED', message);
        break;
      
      case 'CLIENT_REASSIGNED':
        console.log('🔄 Cliente reasignado:', message.data);
        this.notify('CLIENT_REASSIGNED', message.data);
        break;
      
      case 'NEW_CLIENT_ASSIGNED':
        console.log('👤 Nuevo cliente asignado:', message.data);
        this.notify('NEW_CLIENT', message.data);
        break;
      
      case 'CLIENT_REASSIGNMENT_CONFIRMED':
        console.log('✅ Reasignación confirmada');
        this.notify('REASSIGNMENT_CONFIRMED', message.data);
        break;
      
      // Manejar eventos específicos del backend
      case 'reasignacion de cliente':
        console.log('� Evento de reasignación recibido:', message.data);
        this.notify('reasignacion de cliente', message.data);
        break;
      
      default:
        console.log('📨 Evento:', message.type, 'Data:', message.data);
        // Notificar eventos genéricos por su tipo
        this.notify(message.type, message.data || message);
    }
  }

  // Enviar mensaje al servidor
  private send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket no está conectado');
    }
  }

  // Emitir evento de reasignación
  emitClientReassigned(data: ReassignmentData) {
    console.log('📡 Enviando reasignación al servidor:', data);
    this.send({
      type: 'CLIENT_REASSIGNED',
      payload: data
    });
  }

  // Emitir evento de nuevo cliente
  emitNewClient(data: NewClientData) {
    console.log('📡 Enviando nuevo cliente al servidor:', data);
    this.send({
      type: 'NEW_CLIENT',
      payload: data
    });
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

  // Notificar a todos los listeners
  private notify(eventType: string, data: unknown) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error en callback:', error);
        }
      });
    }
  }

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