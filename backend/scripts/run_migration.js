const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const migrationFile = path.join(__dirname, '..', 'migrations', '003_add_seguimiento_columns.sql');
  if (!fs.existsSync(migrationFile)) {
    console.error('No se encontró el archivo de migración:', migrationFile);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, 'utf8');
  // Simple split; as defensa eliminamos comentarios y splits vacíos
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  const host = process.env.DB_HOST || '127.0.0.1';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'albru';
  const port = Number(process.env.DB_PORT || 3306);

  let conn;
  try {
    conn = await mysql.createConnection({ host, user, password, database, port, multipleStatements: true });
    console.log('Conectado a la BD', host, database);

    for (const stmt of statements) {
      try {
        console.log('Ejecutando statement...');
        await conn.query(stmt);
      } catch (e) {
        console.warn('Statement falló, continuando:', e.message);
      }
    }

    console.log('Migración ejecutada (intentos completos).');
    await conn.end();
    process.exit(0);
  } catch (e) {
    console.error('No se pudo conectar o ejecutar migración:', e.message);
    if (conn) try { await conn.end(); } catch(_){}
    process.exit(2);
  }
}

if (require.main === module) main();
