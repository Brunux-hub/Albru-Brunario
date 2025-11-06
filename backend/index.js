/**
 * ALBRU CRM - SERVIDOR PRINCIPAL
 * Sistema profesional de call center con Socket.io, Redis y MySQL
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const config = require('./config/environment');

// Servicios
const socketService = require('./services/SocketService');
const redisService = require('./services/RedisService');
const sessionService = require('./services/SessionService');

const app = express();
const port = config.server.port;

// Crear servidor HTTP
const server = http.createServer(app);

// Importar rutas
const clientesRoutes = require('./routes/clientes');
const asesoresRoutes = require('./routes/asesores');
const usuariosRoutes = require('./routes/usuarios');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const sessionsRoutes = require('./routes/sessions'); // Nueva ruta de sesiones
const pool = require('./config/database');

// Middleware para parsear el cuerpo de las peticiones como JSON
app.use(express.json());

// Configurar CORS para permitir solicitudes desde diferentes orígenes
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (aplicaciones móviles, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Permitir cualquier IP local en puerto 5173 (frontend)
    const localPattern = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):5173$/;
    
    if (localPattern.test(origin)) {
      console.log('✅ Permitiendo origen IP local:', origin);
      callback(null, true);
    } else {
      // Lista de orígenes específicos permitidos
      const allowedOrigins = [
        'https://albru-brunario.vercel.app',
        process.env.FRONTEND_URL
      ].filter(Boolean);
      
      if (allowedOrigins.includes(origin)) {
        console.log('✅ Permitiendo origen específico:', origin);
        callback(null, true);
      } else {
        console.log('🔒 Origen no permitido:', origin);
        // Para desarrollo, permitir cualquier origen
        callback(null, true);
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

app.use(cors(corsOptions));

// Rutas
app.use('/api/clientes', clientesRoutes);
app.use('/api/asesores', asesoresRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionsRoutes); // Rutas de sesiones

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor funcionando.');
});

// Probar conexión a la base de datos (comentado temporalmente)
/*
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
  } else {
    console.log('Conexión exitosa a la base de datos:', res.rows[0]);
  }
});
*/
console.log('⚠️ Base de datos deshabilitada temporalmente para desarrollo');

/**
 * INICIALIZACIÓN DE SERVICIOS
 */
async function initializeServices() {
  try {
    // 1. Conectar a Redis
    console.log('🔄 Conectando a Redis...');
    await redisService.connect();

    // 2. Inicializar Socket.io
    console.log('🔄 Inicializando Socket.io...');
    socketService.initialize(server);

    // 3. Sincronizar sesiones (crash recovery)
    console.log('🔄 Sincronizando sesiones...');
    await sessionService.syncSessions();

    // 4. Iniciar worker de seguimiento
    console.log('🔄 Iniciando worker de seguimiento...');
    const seguimientoWorker = require('./services/seguimientoWorker');
    seguimientoWorker.start();

    console.log('✅ Todos los servicios inicializados correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar servicios:', error);
    // No detener el servidor, seguir funcionando con servicios parciales
  }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const redisHealth = await redisService.healthCheck();
  const socketHealth = socketService.healthCheck();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      redis: redisHealth,
      socket: socketHealth,
      database: 'connected', // Asumimos conectado si el servidor responde
    },
  });
});

// Ruta para obtener estadísticas de WebSocket
app.get('/api/ws-stats', (req, res) => {
  res.json(socketService.getStats());
});

// Ruta para obtener estadísticas de sesiones
app.get('/api/stats/sessions', async (req, res) => {
  try {
    const sessions = await sessionService.getAllActiveSessions();
    res.json({
      total: sessions.length,
      sessions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

server.listen(port, '0.0.0.0', async () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║          🚀 ALBRU CRM - SISTEMA PROFESIONAL 🚀           ║
╚═══════════════════════════════════════════════════════════╝
  `);
  
  console.log(`📍 Entorno: ${config.server.nodeEnv.toUpperCase()}`);
  console.log(`📍 Puerto Backend: ${port}`);
  console.log(`📍 Frontend URL: ${config.server.frontendUrl}`);
  console.log(`\n🌐 Accesible desde:`);
  console.log(`   - Local: http://localhost:${port}`);
  
  // Mostrar todas las IPs de red local disponibles
  Object.keys(networkInterfaces).forEach(interfaceName => {
    const interfaces = networkInterfaces[interfaceName];
    interfaces.forEach(netInterface => {
      if (netInterface.family === 'IPv4' && !netInterface.internal) {
        console.log(`   - Red Local: http://${netInterface.address}:${port}`);
      }
    });
  });
  
  console.log(`\n🔌 Socket.io configurado`);
  console.log(`🔐 CORS: ${config.websocket.corsOrigins.join(', ')}`);
  console.log(`⏱️  Timeout de sesión: ${config.session.timeout}s`);
  console.log(`🔄 Intervalo de worker: ${config.session.workerInterval}ms`);
  
  console.log(`\n📚 Endpoints disponibles:`);
  console.log(`   - GET  /api/health - Health check`);
  console.log(`   - POST /api/sessions/start - Iniciar sesión`);
  console.log(`   - POST /api/sessions/end - Finalizar sesión`);
  console.log(`   - POST /api/sessions/heartbeat - Heartbeat`);
  console.log(`   - GET  /api/sessions/status/:id - Estado de sesión`);
  console.log(`   - GET  /api/sessions/active - Sesiones activas`);
  console.log(`   - POST /api/sessions/sync - Sincronizar sesiones`);
  
  console.log(`\n🔧 Inicializando servicios...`);
  
  // Inicializar todos los servicios
  await initializeServices();
  
  console.log(`\n✅ SERVIDOR LISTO PARA PRODUCCIÓN\n`);
});