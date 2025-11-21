/**
 * Script para agregar asesores al sistema
 * Uso: node agregar_asesor.js "Nombre Completo" "DNI"
 * Ejemplo: node agregar_asesor.js "Juan Pérez García" "12345678"
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3308,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root_password_here',
  database: process.env.DB_NAME || 'albru'
};

async function agregarAsesor(nombre, dni) {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa\n');

    // Generar datos del asesor
    const username = nombre.toLowerCase().replace(/\s+/g, '.'); // juan.perez.garcia
    const email = `${username}@albru.com`;
    const password = dni; // DNI como contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar si el usuario ya existe
    const [existing] = await connection.query(
      'SELECT id FROM usuarios WHERE username = ? OR email = ? OR telefono = ?',
      [username, email, parseInt(dni)]
    );

    if (existing.length > 0) {
      console.log('❌ Error: El asesor ya existe en el sistema');
      console.log('   Username:', username);
      console.log('   Email:', email);
      console.log('   DNI:', dni);
      return;
    }

    // Insertar en la tabla usuarios
    const [result] = await connection.query(
      `INSERT INTO usuarios (nombre, email, username, password, telefono, tipo, estado, created_at) 
       VALUES (?, ?, ?, ?, ?, 'asesor', 'activo', NOW())`,
      [nombre, email, username, hashedPassword, parseInt(dni)]
    );

    const usuarioId = result.insertId;

    // Insertar en la tabla asesores
    await connection.query(
      `INSERT INTO asesores (usuario_id, nombre, email, telefono, estado, meta_mensual, comision_porcentaje, created_at) 
       VALUES (?, ?, ?, ?, 'Activo', 50, 5.00, NOW())`,
      [usuarioId, nombre, email, parseInt(dni)]
    );

    console.log('✅ Asesor agregado exitosamente!\n');
    console.log('📋 Datos del asesor:');
    console.log('   Nombre:', nombre);
    console.log('   DNI/Teléfono:', dni);
    console.log('   Username:', username);
    console.log('   Email:', email);
    console.log('   Contraseña:', password, '(mismo que el DNI)');
    console.log('   ID Usuario:', usuarioId);
    console.log('\n🔐 Credenciales de acceso:');
    console.log('   Usuario:', username);
    console.log('   Contraseña:', password);

  } catch (error) {
    console.error('❌ Error al agregar asesor:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Modo interactivo
async function modoInteractivo() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

  console.log('═══════════════════════════════════════');
  console.log('  AGREGAR NUEVO ASESOR - MODO INTERACTIVO');
  console.log('═══════════════════════════════════════\n');

  const nombre = await question('Nombre completo del asesor: ');
  const dni = await question('DNI (será usado como contraseña): ');

  rl.close();

  if (!nombre || !dni) {
    console.log('❌ Error: Debes proporcionar nombre y DNI');
    process.exit(1);
  }

  await agregarAsesor(nombre.trim(), dni.trim());
}

// Ejecutar script
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 2) {
    // Modo con argumentos: node agregar_asesor.js "Nombre" "DNI"
    const [nombre, dni] = args;
    agregarAsesor(nombre, dni);
  } else if (args.length === 0) {
    // Modo interactivo
    modoInteractivo();
  } else {
    console.log('❌ Uso incorrecto del script\n');
    console.log('Modo 1 - Con argumentos:');
    console.log('  node agregar_asesor.js "Nombre Completo" "DNI"\n');
    console.log('Modo 2 - Interactivo:');
    console.log('  node agregar_asesor.js\n');
    process.exit(1);
  }
}

module.exports = { agregarAsesor };
