/**
 * ALBRU CRM - CONFIGURACIÓN DE ENTORNO
 * Centraliza todas las variables de entorno con validación
 * @module config/environment
 */

require('dotenv').config();

const config = {
  // Base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'albru',
    password: process.env.DB_PASSWORD || 'albru12345',
    database: process.env.DB_NAME || 'albru_crm',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    waitForConnections: true,
    queueLimit: 0,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    retryStrategy: (times) => Math.min(times * 50, 2000),
  },

  // Servidor
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
  },

  // WebSocket
  websocket: {
    port: parseInt(process.env.WS_PORT || '3001', 10),
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5174,http://localhost:5173').split(','),
  },

  // Sesiones y timeouts
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT || '600', 10), // segundos
    workerInterval: parseInt(process.env.WORKER_INTERVAL || '30000', 10), // ms
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Helpers
  isDevelopment: () => (process.env.NODE_ENV || 'development') === 'development',
  isProduction: () => (process.env.NODE_ENV || 'development') === 'production',
};

// Validación básica
const validateConfig = () => {
  const required = [
    'DB_HOST',
    'DB_USER',
    'DB_NAME',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Variables de entorno faltantes: ${missing.join(', ')}`);
    console.warn('⚠️  Usando valores por defecto. Verifica tu archivo .env');
  }
};

validateConfig();

module.exports = config;
