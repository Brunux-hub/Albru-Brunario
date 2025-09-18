import axios from 'axios';

// URL base del backend - se puede configurar según el entorno
const getBaseURL = () => {
  // En desarrollo local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // En producción (Vercel u otro hosting)
  // Por ahora, vamos a usar la misma URL que el frontend pero con diferente puerto
  // Esto se debe configurar según donde esté desplegado tu backend
  return process.env.REACT_APP_BACKEND_URL || `${window.location.protocol}//${window.location.hostname}:3000`;
};

// Crear instancia de Axios con configuración base
const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar automáticamente el token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
    console.error('Error en la solicitud:', error);
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;