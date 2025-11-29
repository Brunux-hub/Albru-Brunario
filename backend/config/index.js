/**
 * Configuración centralizada del backend
 * Maneja todas las variables de entorno y configuraciones del sistema
 */

require('dotenv').config();

const config = {
  // Configuración del servidor
  server: {
    port: Number(process.env.PORT) || 3001,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production'
  },

  // Configuración de la base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'albru',
    connectionLimit: Number(process.env.DB_CONN_LIMIT) || 50,
    acquireTimeout: Number(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
    timeout: Number(process.env.DB_TIMEOUT) || 60000,
    charset: process.env.DB_CHARSET || 'utf8mb4'
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'albru-backend',
    audience: process.env.JWT_AUDIENCE || 'albru-frontend'
  },

  // Configuración de CORS
  cors: {
    origin: function (origin, callback) {
      // Permitir solicitudes sin origen (aplicaciones móviles, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Permitir cualquier IP local en puerto 5173
      const localPattern = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):5173$/;
      
      if (localPattern.test(origin)) {
        console.log('✅ CORS: Permitiendo origen IP local:', origin);
        callback(null, true);
      } else {
        // Lista de orígenes específicos
        const allowedOrigins = process.env.CORS_ORIGIN ? 
          process.env.CORS_ORIGIN.split(',').map(url => url.trim()) : 
          ['https://albru-brunario.vercel.app'];
        
        if (allowedOrigins.includes(origin)) {
          console.log('✅ CORS: Permitiendo origen específico:', origin);
          callback(null, true);
        } else {
          console.log('🔒 CORS: Origen no permitido:', origin);
          callback(null, true); // Permitir durante desarrollo
        }
      }
    },
    credentials: process.env.CORS_CREDENTIALS !== 'false',
    optionsSuccessStatus: 200
  },

  // Configuración de rate limiting
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    authWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    authMaxRequests: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    enableConsole: process.env.LOG_CONSOLE !== 'false',
    enableFile: process.env.LOG_FILE === 'true',
    filePattern: process.env.LOG_FILE_PATTERN || 'logs/app-%DATE%.log',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    maxSize: process.env.LOG_MAX_SIZE || '20m'
  },

  // Configuración de seguridad
  security: {
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
    maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutTime: Number(process.env.LOCKOUT_TIME) || 15 * 60 * 1000, // 15 minutos
    sessionTimeout: Number(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000, // 24 horas
    enableHelmet: process.env.ENABLE_HELMET !== 'false',
    enableXSS: process.env.ENABLE_XSS_PROTECTION !== 'false'
  },

  // Configuración de WebSocket
  websocket: {
    enable: process.env.WEBSOCKET_ENABLE !== 'false',
    pingTimeout: Number(process.env.WEBSOCKET_PING_TIMEOUT) || 60000,
    pingInterval: Number(process.env.WEBSOCKET_PING_INTERVAL) || 25000
  },

  // Configuración de uploads (si se implementa)
  uploads: {
    maxFileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES ? 
      process.env.UPLOAD_ALLOWED_TYPES.split(',').map(type => type.trim()) :
      ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    uploadDir: process.env.UPLOAD_DIR || 'uploads/'
  },

  // Configuración de email (para futuras notificaciones)
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@albru.pe'
  },

  // URLs y endpoints dinámicos
  urls: {
    frontend: process.env.FRONTEND_URL || 'http://localhost:5173',
    backend: process.env.BACKEND_URL || 'http://localhost:3001',
    apiPrefix: process.env.API_PREFIX || '/api',
    authPrefix: process.env.AUTH_PREFIX || '/api/auth',
    adminPrefix: process.env.ADMIN_PREFIX || '/api/admin'
  },

  // Configuración de paginación
  pagination: {
    defaultLimit: Number(process.env.PAGINATION_DEFAULT_LIMIT) || 20,
    maxLimit: Number(process.env.PAGINATION_MAX_LIMIT) || 100,
    defaultPage: Number(process.env.PAGINATION_DEFAULT_PAGE) || 1
  },

  // Configuración de cache (para futuras implementaciones)
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: Number(process.env.CACHE_TTL) || 300, // 5 minutos
    maxKeys: Number(process.env.CACHE_MAX_KEYS) || 1000
  }
};

// Validación de configuraciones críticas
const validateConfig = () => {
  const errors = [];

  // Validar JWT secret en producción
  if (config.server.isProduction && config.jwt.secret === 'default_jwt_secret_change_in_production') {
    errors.push('JWT_SECRET debe ser configurado en producción');
  }

  // Validar configuración de base de datos
  if (!config.database.host) {
    errors.push('DB_HOST es requerido');
  }
  if (!config.database.user) {
    errors.push('DB_USER es requerido');
  }
  if (!config.database.name) {
    errors.push('DB_NAME es requerido');
  }

  // Validar CORS en producción
  if (config.server.isProduction && config.cors.origin.includes('http://localhost:5173')) {
    console.warn('⚠️  ADVERTENCIA: CORS incluye localhost en producción');
  }

  if (errors.length > 0) {
    console.error('❌ Errores de configuración:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
};

// Exportar configuración validada
validateConfig();

// Función para obtener configuración específica
config.get = (path) => {
  return path.split('.').reduce((obj, key) => obj && obj[key], config);
};

// Función para verificar si estamos en desarrollo
config.isDev = () => config.server.isDevelopment;

// Función para verificar si estamos en producción
config.isProd = () => config.server.isProduction;

// Log de configuración en desarrollo
if (config.server.isDevelopment) {
  console.log('🔧 Configuración del backend cargada:');
  console.log(`  - Entorno: ${config.server.nodeEnv}`);
  console.log(`  - Puerto: ${config.server.port}`);
  console.log(`  - Base de datos: ${config.database.host}:${config.database.port}/${config.database.name}`);
  console.log(`  - Frontend URL: ${config.server.frontendUrl}`);
  console.log(`  - CORS origins: ${config.cors.origin.join(', ')}`);
}

module.exports = config;