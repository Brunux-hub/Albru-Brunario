/**
 * ALBRU CRM - SERVICIO DE API DE SESIONES
 * Cliente HTTP para endpoints de sesiones
 * @module services/sessionApi
 */

// Detecta dinámicamente la URL del backend
const getAPIUrl = (): string => {
  // Si existe VITE_API_URL, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Si existe VITE_BACKEND_URL, construir API_URL desde ella
  if (import.meta.env.VITE_BACKEND_URL) {
    return `${import.meta.env.VITE_BACKEND_URL}/api`;
  }
  
  // Detección dinámica basada en window.location
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:3001/api`;
    }
  }
  
  // Fallback a localhost
  return 'http://localhost:3001/api';
};

const API_URL = getAPIUrl();

export interface SessionStartRequest {
  clienteId: number;
  asesorId: number;
}

export interface SessionEndRequest {
  clienteId: number;
  asesorId: number;
  resultado?: 'gestionado' | 'no_gestionado' | 'cerrado';
}

export interface HeartbeatRequest {
  clienteId: number;
  asesorId: number;
}

export interface SessionResponse {
  success: boolean;
  message?: string;
  session?: SessionData;
  ttl?: number;
}

interface SessionData {
  clienteId: number;
  asesorId: number;
  status: string;
  startedAt: string;
}

/**
 * Inicia una sesión
 */
export const startSession = async (data: SessionStartRequest): Promise<SessionResponse> => {
  const response = await fetch(`${API_URL}/sessions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al iniciar sesión');
  }

  return response.json();
};

/**
 * Finaliza una sesión
 */
export const endSession = async (data: SessionEndRequest): Promise<SessionResponse> => {
  const response = await fetch(`${API_URL}/sessions/end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al finalizar sesión');
  }

  return response.json();
};

/**
 * Envía heartbeat para mantener sesión viva
 */
export const sendHeartbeat = async (data: HeartbeatRequest): Promise<SessionResponse> => {
  const response = await fetch(`${API_URL}/sessions/heartbeat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al enviar heartbeat');
  }

  return response.json();
};

export interface SessionStatusResponse {
  success: boolean;
  status: {
    source: string;
    active: boolean;
    ttl?: number;
    clienteId?: number;
    asesorId?: number;
    status?: string;
  };
}

/**
 * Obtiene el estado de una sesión
 */
export const getSessionStatus = async (clienteId: number): Promise<SessionStatusResponse> => {
  const response = await fetch(`${API_URL}/sessions/status/${clienteId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener estado de sesión');
  }

  return response.json();
};

/**
 * Restaura una sesión desde MySQL a Redis
 */
export const restoreSession = async (clienteId: number): Promise<SessionResponse> => {
  const response = await fetch(`${API_URL}/sessions/restore/${clienteId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al restaurar sesión');
  }

  return response.json();
};

export interface ActiveSessionsResponse {
  success: boolean;
  count: number;
  sessions: Array<{
    clienteId: number;
    ttl: number;
    data: SessionData;
  }>;
}

/**
 * Obtiene todas las sesiones activas
 */
export const getActiveSessions = async (): Promise<ActiveSessionsResponse> => {
  const response = await fetch(`${API_URL}/sessions/active`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener sesiones activas');
  }

  return response.json();
};

/**
 * Sincroniza sesiones (recovery)
 */
export const syncSessions = async (): Promise<SessionResponse> => {
  const response = await fetch(`${API_URL}/sessions/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al sincronizar sesiones');
  }

  return response.json();
};

export default {
  startSession,
  endSession,
  sendHeartbeat,
  getSessionStatus,
  restoreSession,
  getActiveSessions,
  syncSessions,
};
