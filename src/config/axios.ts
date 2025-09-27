import axios from 'axios';

// URL base del backend - se puede configurar según el entorno
const getBaseURL = (): string => {
  // En desarrollo local
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  
  // En producción - usar variable de entorno si existe
  const backendUrl = import.meta.env?.VITE_BACKEND_URL || 'http://localhost:3000';
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