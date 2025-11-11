const pool = require('/usr/src/app/config/database');
const bcrypt = require('bcryptjs');

async function check(email) {
  try {
    const [rows] = await pool.query('SELECT id, nombre, email, password, estado FROM usuarios WHERE email = ?', [email]);
    if (rows.length === 0) {
      console.log('NO_USER', email);
      return;
    }
    const u = rows[0];
    console.log('ID:', u.id);
    console.log('NOMBRE:', u.nombre);
    console.log('EMAIL:', u.email);
    console.log('ESTADO:', u.estado);
    console.log('HASH:', u.password);
    console.log('LENGTH:', u.password ? u.password.length : 0);
    const ok = await bcrypt.compare('password', u.password);
    console.log("bcrypt.compare('password') =>", ok);
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await pool.end();
  }
}

const emails = process.argv.slice(2);
if (emails.length === 0) emails.push('acatalanm@albru.pe');

(async () => {
  for (const e of emails) {
    console.log('\n--- Checking', e, '---');
    await check(e);
  }
})();
