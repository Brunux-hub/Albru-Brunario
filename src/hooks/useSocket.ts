/**
 * ALBRU CRM - HOOK DE SOCKET.IO
 * Gestión profesional de WebSocket con reconexión automática
 * @module hooks/useSocket
 */

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Detecta la URL del backend dinámicamente basándose en window.location
const getSocketURL = (): string => {
  if (window.location.port === '5173') {
    // Producción: usar Nginx proxy en el mismo origin
    return window.location.origin;
  }
  
  // Desarrollo (puerto 5174): conectar directamente al backend
  // Si estamos accediendo por IP, usar esa IP para el backend
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3001`;
  }
  
  // Fallback a variable de entorno o localhost
  return import.meta.env.VITE_WS_URL || 'http://localhost:3001';
};

const SOCKET_URL = getSocketURL();

interface UseSocketOptions {
  userId?: number;
  role?: 'gtr' | 'asesor';
  autoConnect?: boolean;
}

interface SocketEventHandler {
  event: string;
  handler: (...args: unknown[]) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<SocketEventHandler[]>([]);
  const { userId, role, autoConnect = true } = options;

  /**
   * Conecta al servidor Socket.io
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('⚠️  Socket ya está conectado');
      return;
    }

    console.log('🔄 Conectando a Socket.io...', SOCKET_URL);

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    // Event handlers de conexión
    socketRef.current.on('connect', () => {
      console.log('✅ Socket conectado:', socketRef.current?.id);

      // Autenticar si tenemos userId y role
      if (userId && role) {
        socketRef.current?.emit('authenticate', { userId, role });
      }
    });

    socketRef.current.on('authenticated', (data: unknown) => {
      console.log('✅ Socket autenticado:', data);
    });

    socketRef.current.on('disconnect', (reason: string) => {
      console.log('🔌 Socket desconectado:', reason);
    });

    socketRef.current.on('connect_error', (error: Error) => {
      console.error('❌ Error de conexión Socket:', error.message);
    });

    socketRef.current.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 Socket reconectado (intento', attemptNumber, ')');
    });

    socketRef.current.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('🔄 Intentando reconectar...', attemptNumber);
    });

    // Re-registrar listeners
    listenersRef.current.forEach(({ event, handler }) => {
      socketRef.current?.on(event, handler);
    });
  }, [userId, role]);

  /**
   * Desconecta del servidor
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Desconectando socket...');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  /**
   * Suscribe a un evento
   */
  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }

    // Guardar para re-registro en reconexión
    listenersRef.current.push({ event, handler });

    // Retornar función de cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
      listenersRef.current = listenersRef.current.filter(
        (l) => l.event !== event || l.handler !== handler
      );
    };
  }, []);

  /**
   * Emite un evento
   */
  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('⚠️  Socket no conectado, no se puede emitir:', event);
    }
  }, []);

  /**
   * Envía heartbeat
   */
  const heartbeat = useCallback(() => {
    emit('heartbeat', { timestamp: Date.now() });
  }, [emit]);

  /**
   * Obtiene el estado de conexión
   */
  const isConnected = useCallback(() => {
    return socketRef.current?.connected || false;
  }, []);

  /**
   * Auto-conectar al montar
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    on,
    emit,
    heartbeat,
    isConnected,
  };
};

export default useSocket;
