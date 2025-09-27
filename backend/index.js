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
const pool = require('./config/database');

// Middleware para parsear el cuerpo de las peticiones como JSON
app.use(express.json());

// Configurar CORS para permitir solicitudes desde diferentes orígenes
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (aplicaciones móviles, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'https://albru-brunario.vercel.app',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('✅ Permitiendo origen:', origin);
      // Permitir cualquier origen durante desarrollo
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

app.use(cors(corsOptions));

// Rutas
app.use('/clientes', clientesRoutes);
app.use('/asesores', asesoresRoutes);

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

server.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  console.log(`🔌 WebSocket disponible en ws://localhost:${port}`);
});