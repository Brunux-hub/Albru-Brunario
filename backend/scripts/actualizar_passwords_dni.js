/**
 * Script para Actualizar Contraseñas con DNI
 * Cada usuario tendrá su número de DNI como contraseña
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

// Mapeo de usuarios con sus DNIs (de la tabla compartida)
const usuariosDNI = {
  'jvenancioo@albru.pe': '60946625',
  'adiazc@albru.pe': '70478547',
  'acatalanm@albru.pe': '71249673',
  'cmacedol@albru.pe': '72232415',
  'dsanchezc@albru.pe': '71662399',
  'rramirezt@albru.pe': '6138315',
  'gcabreran@albru.pe': '72540275',
  'jmezav@albru.pe': '73500150',
  'jariasr@albru.pe': '77143843',
  'jclementc@albru.pe': '76122260',
  'kriverab@albru.pe': '76211912',
  'lparedesc@albru.pe': '77421711',
  'mcaceresv@albru.pe': '70779032',
  'kvivancoa@albru.pe': '74000970',
  'npalacioss@albru.pe': '73666105',
  'rvillarb@albru.pe': '44647864',
  'sbatistal@albru.pe': '60854262'
};

async function actualizarPasswordsDNI() {
  let connection;
  
  try {
    console.log('🔐 Actualizando contraseñas con DNI...\n');
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a la base de datos\n');
    
    // Obtener todos los usuarios
    const [usuarios] = await connection.query(
      'SELECT id, nombre, email, username, tipo FROM usuarios WHERE estado = "activo" ORDER BY id'
    );
    
    console.log(`📊 Total de usuarios en BD: ${usuarios.length}`);
    console.log(`📊 Total de DNIs disponibles: ${Object.keys(usuariosDNI).length}\n`);
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    
    const credencialesActualizadas = [];
    const usuariosSinDNI = [];
    let actualizados = 0;
    
    for (const user of usuarios) {
      const dni = usuariosDNI[user.email];
      
      if (dni) {
        // Generar hash bcrypt del DNI
        const hashedPassword = await bcrypt.hash(dni, 10);
        
        // Actualizar en la BD
        await connection.query(
          'UPDATE usuarios SET password = ? WHERE id = ?',
          [hashedPassword, user.id]
        );
        
        credencialesActualizadas.push({
          nombre: user.nombre,
          email: user.email,
          username: user.username,
          password: dni,
          tipo: user.tipo
        });
        
        console.log(`✅ ${user.username.padEnd(15)} → DNI: ${dni.padEnd(12)} (${user.tipo})`);
        actualizados++;
      } else {
        usuariosSinDNI.push({
          nombre: user.nombre,
          email: user.email,
          username: user.username,
          tipo: user.tipo
        });
        console.log(`⚠️  ${user.username.padEnd(15)} → SIN DNI - NO ACTUALIZADO (${user.tipo})`);
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log(`\n📊 RESUMEN: ${actualizados} actualizados, ${usuariosSinDNI.length} sin DNI\n`);
    
    if (credencialesActualizadas.length > 0) {
      console.log('┌─────────────────┬──────────────────────┬──────────────────────────┬────────────┐');
      console.log('│ Username        │ Contraseña (DNI)     │ Email                    │ Tipo       │');
      console.log('├─────────────────┼──────────────────────┼──────────────────────────┼────────────┤');
      
      credencialesActualizadas.forEach(p => {
        console.log(
          `│ ${p.username.padEnd(15)} │ ${p.password.padEnd(20)} │ ${p.email.padEnd(24)} │ ${p.tipo.padEnd(10)} │`
        );
      });
      
      console.log('└─────────────────┴──────────────────────┴──────────────────────────┴────────────┘\n');
    }
    
    if (usuariosSinDNI.length > 0) {
      console.log('⚠️  USUARIOS SIN DNI (mantienen contraseña anterior):\n');
      usuariosSinDNI.forEach(u => {
        console.log(`   - ${u.username.padEnd(15)} (${u.email}) - ${u.tipo}`);
      });
      console.log('');
    }
    
    // Guardar credenciales en archivo
    const fs = require('fs');
    const credencialesTexto = credencialesActualizadas.map(p => 
      `Nombre: ${p.nombre}\nEmail: ${p.email}\nUsername: ${p.username}\nContraseña: ${p.password}\nTipo: ${p.tipo}\n${'─'.repeat(60)}`
    ).join('\n');
    
    fs.writeFileSync(
      './CREDENCIALES_DNI.txt',
      `╔═══════════════════════════════════════════════════════════════╗\n` +
      `║  CREDENCIALES DE ACCESO - ALBRU SYSTEM (DNI)                ║\n` +
      `║  Generado: ${new Date().toLocaleString('es-PE').padEnd(46)} ║\n` +
      `╚═══════════════════════════════════════════════════════════════╝\n\n` +
      `⚠️  IMPORTANTE: Cada usuario debe cambiar su contraseña en el primer login.\n` +
      `📌 La contraseña actual es el número de DNI.\n\n` +
      `═══════════════════════════════════════════════════════════════\n\n` +
      credencialesTexto +
      `\n\n${usuariosSinDNI.length > 0 ? '⚠️  USUARIOS SIN DNI (no incluidos):\n' + usuariosSinDNI.map(u => `- ${u.nombre} (${u.email})`).join('\n') : ''}`
    );
    
    console.log('💾 Credenciales guardadas en: ./CREDENCIALES_DNI.txt\n');
    console.log('✅ Proceso completado!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
actualizarPasswordsDNI().catch(console.error);
