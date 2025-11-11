const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function hashExistingPasswords() {
  try {
    console.log('🔄 Iniciando hash de contraseñas existentes...');

    // Obtener todos los usuarios con contraseñas sin hash
    const [users] = await pool.query('SELECT id, password FROM usuarios WHERE password IS NOT NULL');
    
    console.log(`📊 Encontrados ${users.length} usuarios con contraseñas`);

    for (const user of users) {
      // Solo hashear si la contraseña no está ya hasheada (bcrypt hashes start with $2)
      if (!user.password.startsWith('$2')) {
        console.log(`🔐 Hasheando contraseña para usuario ID: ${user.id}`);
        
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await pool.query(
          'UPDATE usuarios SET password = ? WHERE id = ?',
          [hashedPassword, user.id]
        );
      } else {
        console.log(`✅ Usuario ID ${user.id} ya tiene contraseña hasheada`);
      }
    }

    console.log('✅ Proceso completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error hasheando contraseñas:', error);
  } finally {
    await pool.end();
  }
}

hashExistingPasswords();