import axios from 'axios';

// URL base del backend - configuración dinámica basada en hostname
const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    // Primero intenta usar la variable de entorno
    if (import.meta.env?.VITE_BACKEND_URL) {
      console.log('🔗 Axios usando VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
      return import.meta.env.VITE_BACKEND_URL;
    }
    
    // Si no hay variable, detecta dinámicamente
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const dynamicURL = `${protocol}//${hostname}:3001`;
    
    console.log('🔗 Axios configurado con URL dinámica:', dynamicURL);
    return dynamicURL;
  }
  
  // Fallback para entornos servidor
  return import.meta.env?.VITE_BACKEND_URL || 'http://localhost:3001';
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