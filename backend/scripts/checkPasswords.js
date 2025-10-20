const pool = require('./config/database');

async function verificarContraseñas() {
  try {
    const [users] = await pool.query('SELECT id, nombre, email, password FROM usuarios WHERE id <= 5 ORDER BY id');
    
    console.log('=== CONTRASEÑAS EN LA BD ===');
    
    users.forEach(user => {
      const isHashed = user.password.startsWith('$2');
      console.log(`ID: ${user.id}`);
      console.log(`Nombre: ${user.nombre}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${isHashed ? 'HASHEADA ✅' : 'TEXTO PLANO ❌'} - ${user.password.substring(0, 15)}...`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

verificarContraseñas();