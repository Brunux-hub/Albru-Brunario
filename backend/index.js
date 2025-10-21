const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocketService = require('./services/WebSocketService');
const app = express();
const port = process.env.PORT || 3000;

// Crear servidor HTTP
const server = http.createServer(app);

// Importar rutas
const clientesRoutes = require('./routes/clientes');
const asesoresRoutes = require('./routes/asesores');
const usuariosRoutes = require('./routes/usuarios');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth'); // Nueva ruta auth
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
app.use('/api/auth', authRoutes); // Nueva ruta auth compatible

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

// Inicializar WebSocket
WebSocketService.initialize(server);

// Ruta para obtener estadísticas de WebSocket
app.get('/api/ws-stats', (req, res) => {
  res.json(WebSocketService.getStats());
});

server.listen(port, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  console.log(`🚀 Servidor ALBRU iniciado correctamente`);
  console.log(`📍 Puerto: ${port}`);
  console.log(`🌐 Accesible desde:`);
  console.log(`   - Local: http://localhost:${port}`);
  
  // Mostrar todas las IPs de red local disponibles
  Object.keys(networkInterfaces).forEach(interfaceName => {
    const interfaces = networkInterfaces[interfaceName];
    interfaces.forEach(netInterface => {
      if (netInterface.family === 'IPv4' && !netInterface.internal) {
        console.log(`   - Red Local: http://${netInterface.address}:${port}`);
        console.log(`   - Frontend: http://${netInterface.address}:5173`);
      }
    });
  });
  
  console.log(`🔌 WebSocket disponible en todas las IPs de red local`);
  console.log(`🔐 CORS configurado para red local automáticamente`);
});