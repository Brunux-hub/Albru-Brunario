import axios from 'axios';

// URL base del backend - se puede configurar según el entorno
const getBaseURL = (): string => {
  // En desarrollo local (Vite suele correr en localhost:5173)
  if (typeof window !== 'undefined') {
  const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      // Si estás en el dev server (por ejemplo puerto 5173) apuntamos al backend en 3001
      return import.meta.env?.VITE_BACKEND_URL || 'http://localhost:3001';
    }
  }

  // Producción o fallback: usar variable de entorno VITE_BACKEND_URL si está definida
  const backendUrl = import.meta.env?.VITE_BACKEND_URL || 'http://localhost:3001';
  return backendUrl;
};

// Crear instancia de Axios con configuración base
const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para configuración de requests
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;