// Configuración de URLs para el entorno
function getNetworkIP(): string {
  // Primero intenta usar variables de entorno
  if (import.meta.env?.VITE_BACKEND_URL) {
    const url = new URL(import.meta.env.VITE_BACKEND_URL);
    console.log('✅ Usando hostname desde VITE_BACKEND_URL:', url.hostname);
    return url.hostname;
  }

  // En el navegador, obtenemos la IP desde el hostname actual
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('🌐 Detectando hostname:', hostname);
    
    // Si ya estamos accediendo desde una IP específica, la usamos
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      console.log('✅ Usando hostname detectado:', hostname);
      return hostname;
    }
  }

  // Fallback a localhost cuando no podemos detectar un hostname accesible
  console.log('🔄 No se detectó hostname público. Usando localhost como fallback');
  return 'localhost';
}

const NETWORK_IP = getNetworkIP();

// URLs base del backend y frontend (con soporte para variables de entorno)
export const backendURL = import.meta.env?.VITE_BACKEND_URL || `http://${NETWORK_IP}:3001`;
export const frontendURL = import.meta.env?.VITE_FRONTEND_URL || `http://${NETWORK_IP}:5173`;

// Funciones auxiliares para construir URLs de API
export const getAPIUrl = (endpoint: string): string => {
  return `${backendURL}/api${endpoint}`;
};

export const getAuthUrl = (endpoint: string): string => {
  return `${backendURL}/api/auth${endpoint}`;
};

// Log para debugging
console.log('🌐 ALBRU - Configuración de Red:', {
  detectedIP: NETWORK_IP,
  backendURL,
  frontendURL,
  source: typeof window !== 'undefined' ? 'browser' : 'server'
});
