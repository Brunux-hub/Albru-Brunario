const express = require('express');
const app = express();
const port = 3000;

// Importar rutas
const clientesRoutes = require('./routes/clientes');
const asesoresRoutes = require('./routes/asesores');
const pool = require('./config/database');

// Middleware para parsear el cuerpo de las peticiones como JSON
app.use(express.json());

// Rutas
app.use('/clientes', clientesRoutes);
app.use('/asesores', asesoresRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor funcionando.');
});

// Probar conexión a la base de datos
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
  } else {
    console.log('Conexión exitosa a la base de datos:', res.rows[0]);
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});