/**
 * Script de Consolidación de Usuarios
 * Unifica usuarios_sistema → usuarios
 * Regenera passwords con hash conocido
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

const DEFAULT_PASSWORD = 'password'; // Contraseña temporal para todos

async function consolidarUsuarios() {
  let connection;
  
  try {
    console.log('🔄 Iniciando consolidación de usuarios...\n');
    
    // Conectar a la BD
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado a la base de datos\n');
    
    // ============================================================
    // PASO 1: Agregar campos faltantes
    // ============================================================
    console.log('📋 PASO 1: Agregando campos username y ultimo_acceso...');
    
    try {
      await connection.query(`
        ALTER TABLE usuarios 
        ADD COLUMN username VARCHAR(50) NULL UNIQUE AFTER email
      `);
      console.log('   ✅ Campo username agregado');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('   ℹ️  Campo username ya existe');
      } else {
        throw err;
      }
    }
    
    try {
      await connection.query(`
        ALTER TABLE usuarios 
        ADD COLUMN ultimo_acceso TIMESTAMP NULL AFTER updated_at
      `);
      console.log('   ✅ Campo ultimo_acceso agregado');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('   ℹ️  Campo ultimo_acceso ya existe');
      } else {
        throw err;
      }
    }
    
    // ============================================================
    // PASO 2: Migrar datos de usuarios_sistema
    // ============================================================
    console.log('\n📋 PASO 2: Migrando datos de usuarios_sistema...');
    
    const [migrateResult] = await connection.query(`
      UPDATE usuarios u
      INNER JOIN usuarios_sistema us ON u.id = us.usuario_id
      SET u.username = us.username,
          u.ultimo_acceso = us.ultimo_acceso
      WHERE u.username IS NULL
    `);
    
    console.log(`   ✅ ${migrateResult.affectedRows} usuarios actualizados con username`);
    
    // ============================================================
    // PASO 3: Generar hash bcrypt y actualizar passwords
    // ============================================================
    console.log('\n📋 PASO 3: Regenerando contraseñas...');
    console.log(`   🔐 Generando hash para: '${DEFAULT_PASSWORD}'`);
    
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    console.log(`   🔑 Hash generado: ${passwordHash.substring(0, 30)}...`);
    
    // Actualizar todas las contraseñas
    const [updateResult] = await connection.query(
      'UPDATE usuarios SET password = ?',
      [passwordHash]
    );
    
    console.log(`   ✅ ${updateResult.affectedRows} contraseñas actualizadas`);
    
    // ============================================================
    // PASO 4: Verificar foreign keys en usuarios_sistema
    // ============================================================
    console.log('\n📋 PASO 4: Verificando foreign keys...');
    
    const [foreignKeys] = await connection.query(`
      SELECT 
        TABLE_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
        AND REFERENCED_TABLE_NAME = 'usuarios_sistema'
    `, [DB_CONFIG.database]);
    
    if (foreignKeys.length > 0) {
      console.log(`   ⚠️  Se encontraron ${foreignKeys.length} foreign keys que referencian usuarios_sistema:`);
      foreignKeys.forEach(fk => {
        console.log(`      - ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}`);
      });
      console.log('   ℹ️  Estas FKs deben revisarse manualmente antes de eliminar la tabla');
    } else {
      console.log('   ✅ No hay foreign keys que referencien usuarios_sistema');
    }
    
    // ============================================================
    // PASO 5: Mostrar resumen
    // ============================================================
    console.log('\n📊 RESUMEN DE CAMBIOS:');
    
    const [usuarios] = await connection.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN username IS NOT NULL THEN 1 ELSE 0 END) as con_username,
        SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos
      FROM usuarios
    `);
    
    console.log(`   👥 Total usuarios: ${usuarios[0].total}`);
    console.log(`   ✅ Con username: ${usuarios[0].con_username}`);
    console.log(`   🟢 Activos: ${usuarios[0].activos}`);
    
    // Mostrar primeros 10 usuarios
    console.log('\n📋 Primeros 10 usuarios:');
    const [sample] = await connection.query(`
      SELECT 
        id,
        nombre,
        email,
        username,
        tipo,
        estado,
        LEFT(password, 30) as password_inicio
      FROM usuarios
      LIMIT 10
    `);
    
    console.table(sample);
    
    // ============================================================
    // PASO 6: Preguntar si eliminar usuarios_sistema
    // ============================================================
    console.log('\n⚠️  SIGUIENTE PASO MANUAL:');
    console.log('   1. Verifica que el login funcione correctamente');
    console.log('   2. Prueba con varios usuarios: email/username + password: "password"');
    console.log('   3. Si todo funciona, ejecuta manualmente:');
    console.log('      DROP TABLE usuarios_sistema;\n');
    
    console.log('✅ Consolidación completada exitosamente!\n');
    
  } catch (error) {
    console.error('❌ Error durante la consolidación:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
consolidarUsuarios().catch(console.error);
