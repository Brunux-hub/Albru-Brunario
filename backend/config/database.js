const { Pool } = require('pg');

const pool = new Pool({
  user: 'albru_user',
  host: 'localhost',
  database: 'albru',
  password: 'password',
  port: 5432,
});

module.exports = pool;