/**
 * Script para Generar Contraseñas Únicas por Usuario
 * Cada usuario tendrá una contraseña basada en su username + sufijo seguro
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'albru',
  password: process.env.DB_PASSWORD || 'albru12345',
  database: process.env.DB_NAME || 'albru'
};

// Función para generar contraseña personalizada por usuario
// Formato: Primera letra mayúscula del nombre + username + "2025"
// Ejemplo: jvenancioo → Jvenancioo2025
function generarPasswordPersonalizada(username, nombre) {
  const nombreLimpio = nombre.trim().split(' ')[0]; // Primer nombre
  const primeraLetra = nombreLimpio.charAt(0).toUpperCase();
  const restoUsername = username.slice(1).toLowerCase();
  return primeraLetra + username.charAt(0).toLowerCase() + restoUsername + '2025';
}

async function generarPasswordsUnicas() {
  let connection;
  
  try {
    console.log('🔐 Generando contraseñas únicas por usuario...\n');
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a la base de datos\n');
    
    // Obtener todos los usuarios activos
    const [usuarios] = await connection.query(
      'SELECT id, nombre, email, username, tipo FROM usuarios WHERE estado = "activo" ORDER BY id'
    );
    
    console.log(`📊 Total de usuarios: ${usuarios.length}\n`);
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    
    const passwordsGeneradas = [];
    
    for (const user of usuarios) {
      // Generar contraseña personalizada
      const plainPassword = generarPasswordPersonalizada(user.username, user.nombre);
      
      // Generar hash bcrypt
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      // Actualizar en la BD
      await connection.query(
        'UPDATE usuarios SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      // Guardar para mostrar después
      passwordsGeneradas.push({
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        username: user.username,
        password: plainPassword,
        tipo: user.tipo
      });
      
      console.log(`✅ ${user.username.padEnd(15)} → ${plainPassword.padEnd(20)} (${user.tipo})`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log('\n📋 RESUMEN DE CREDENCIALES GENERADAS:\n');
    console.log('┌─────────────────┬──────────────────────┬──────────────────────────┬────────────┐');
    console.log('│ Username        │ Contraseña           │ Email                    │ Tipo       │');
    console.log('├─────────────────┼──────────────────────┼──────────────────────────┼────────────┤');
    
    passwordsGeneradas.forEach(p => {
      console.log(
        `│ ${p.username.padEnd(15)} │ ${p.password.padEnd(20)} │ ${p.email.padEnd(24)} │ ${p.tipo.padEnd(10)} │`
      );
    });
    
    console.log('└─────────────────┴──────────────────────┴──────────────────────────┴────────────┘\n');
    
    // Guardar credenciales en archivo de texto
    const fs = require('fs');
    const credencialesTexto = passwordsGeneradas.map(p => 
      `Email: ${p.email}\nUsername: ${p.username}\nPassword: ${p.password}\nTipo: ${p.tipo}\nTema: ${p.username}\n---`
    ).join('\n');
    
    fs.writeFileSync(
      './CREDENCIALES_USUARIOS.txt',
      `CREDENCIALES DE ACCESO - ALBRU SYSTEM\n` +
      `Generado: ${new Date().toLocaleString('es-PE')}\n\n` +
      `IMPORTANTE: Guarda este archivo en un lugar seguro y elimínalo después de distribuir las credenciales.\n\n` +
      `═══════════════════════════════════════════════════════════════\n\n` +
      credencialesTexto
    );
    
    console.log('💾 Credenciales guardadas en: ./CREDENCIALES_USUARIOS.txt\n');
    console.log('⚠️  IMPORTANTE: Distribuye las credenciales de forma segura y elimina el archivo después.\n');
    console.log('✅ Proceso completado exitosamente!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
generarPasswordsUnicas().catch(console.error);
