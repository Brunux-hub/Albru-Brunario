require('dotenv').config();
const mysql = require('mysql2/promise');

// Centralizar la configuración del pool para que todos los controladores lo requieran
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'albru',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT || 10),
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;
