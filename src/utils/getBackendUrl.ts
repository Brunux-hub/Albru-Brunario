/**
 * ALBRU CRM - HELPER PARA DETECTAR URL DEL BACKEND
 * Detecta dinámicamente la URL correcta del backend basándose en el hostname actual
 * @module utils/getBackendUrl
 */

/**
 * Obtiene la URL del backend de forma dinámica
 * Orden de prioridad:
 * 1. Variable de entorno VITE_BACKEND_URL (si existe)
 * 2. Detección dinámica basada en window.location.hostname
 * 3. Fallback a localhost:3001
 */
export const getBackendUrl = (): string => {
  // 1. Intentar usar variable de entorno
  if (import.meta.env.VITE_BACKEND_URL) {
    console.log('🔗 Backend URL desde VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
    return import.meta.env.VITE_BACKEND_URL;
  }

  // 2. Detección dinámica en el navegador
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    
    // Si estamos accediendo por IP (no localhost), usar esa IP para el backend
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const dynamicUrl = `${protocol}//${hostname}:3001`;
      console.log('🔗 Backend URL detectada dinámicamente:', dynamicUrl);
      return dynamicUrl;
    }
  }

  // 3. Fallback a localhost
  console.log('🔗 Backend URL usando fallback: http://localhost:3001');
  return 'http://localhost:3001';
};

/**
 * Obtiene la URL completa de un endpoint de API
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getBackendUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

export default getBackendUrl;
