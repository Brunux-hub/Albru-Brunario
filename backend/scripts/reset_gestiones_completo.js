/**
 * Script para resetear TODAS las gestiones del sistema
 * Esto incluye:
 * - Vaciar tabla historial_estados
 * - Resetear wizard_completado = 0
 * - Resetear fecha_wizard_completado = NULL
 * - Resetear asesor_asignado = NULL
 * - Resetear seguimiento_status = NULL
 * - Resetear estatus_comercial_categoria = NULL
 * - Resetear estatus_comercial_subcategoria = NULL
 * - Resetear ultima_fecha_gestion = NULL
 * - Resetear fecha_ultimo_contacto = NULL
 * 
 * USO: node backend/scripts/reset_gestiones_completo.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetearGestiones() {
  console.log('🔄 Iniciando reseteo completo de gestiones...\n');

  const connection = await mysql.createConnection({
    host: 'localhost', // Usar localhost para conexión desde fuera de Docker
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'albru3789',
    database: process.env.DB_NAME || 'albru',
    port: 3306 // Puerto mapeado de MySQL
  });

  try {
    // 1. Contar registros antes
    const [[{ totalClientes }]] = await connection.query('SELECT COUNT(*) as totalClientes FROM clientes');
    
    console.log('📊 Estado actual:');
    console.log(`   - Total clientes: ${totalClientes}`);
    
    // Verificar si existe tabla historial_estados
    let totalHistorial = 0;
    let tieneHistorial = false;
    try {
      const [[{ totalHistorial: count }]] = await connection.query('SELECT COUNT(*) as totalHistorial FROM historial_estados');
      totalHistorial = count;
      tieneHistorial = true;
      console.log(`   - Total eventos historial: ${totalHistorial}`);
    } catch (e) {
      console.log('   - Tabla historial_estados no existe (se omitirá)');
    }
    console.log('');

    // 2. Vaciar historial_estados si existe
    if (tieneHistorial) {
      console.log('🗑️  Vaciando tabla historial_estados...');
      await connection.query('DELETE FROM historial_estados');
      console.log('   ✅ Historial_estados vaciado\n');
    }

    // 3. Obtener columnas de la tabla clientes
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'albru' AND TABLE_NAME = 'clientes'
    `);
    
    const columnNames = columns.map(c => c.COLUMN_NAME);
    console.log(`📋 Columnas encontradas en tabla clientes: ${columnNames.length}`);
    
    // 4. Construir UPDATE solo con columnas que existan
    const fieldsToReset = [
      { name: 'asesor_asignado', value: 'NULL' },
      { name: 'seguimiento_status', value: 'NULL' },
      { name: 'estatus_comercial_categoria', value: 'NULL' },
      { name: 'estatus_comercial_subcategoria', value: 'NULL' },
      { name: 'wizard_completado', value: '0' },
      { name: 'fecha_wizard_completado', value: 'NULL' },
      { name: 'ultima_fecha_gestion', value: 'NULL' },
      { name: 'fecha_ultimo_contacto', value: 'NULL' },
      { name: 'ocupado', value: '0' }
    ];
    
    const existingFields = fieldsToReset.filter(f => columnNames.includes(f.name));
    
    if (existingFields.length === 0) {
      console.log('⚠️  No se encontraron campos de gestión para resetear');
      console.log('   La tabla clientes puede no tener las columnas esperadas\n');
    } else {
      console.log(`🔄 Reseteando ${existingFields.length} campos de gestión en clientes...`);
      console.log(`   Campos a resetear: ${existingFields.map(f => f.name).join(', ')}\n`);
      
      const setClause = existingFields.map(f => `${f.name} = ${f.value}`).join(', ');
      const [result] = await connection.query(`UPDATE clientes SET ${setClause} WHERE 1=1`);
      console.log(`   ✅ ${result.affectedRows} clientes reseteados\n`);
    }

    // 5. Verificar estado final
    const queries = [
      { label: 'Clientes con asesor', query: 'SELECT COUNT(*) as count FROM clientes WHERE asesor_asignado IS NOT NULL', checkColumn: 'asesor_asignado' },
      { label: 'Clientes con estatus', query: 'SELECT COUNT(*) as count FROM clientes WHERE estatus_comercial_categoria IS NOT NULL', checkColumn: 'estatus_comercial_categoria' }
    ];
    
    console.log('📊 Estado final:');
    for (const q of queries) {
      if (columnNames.includes(q.checkColumn)) {
        const [[{ count }]] = await connection.query(q.query);
        console.log(`   - ${q.label}: ${count}`);
      }
    }
    
    if (tieneHistorial) {
      const [[{ historialFinal: count }]] = await connection.query('SELECT COUNT(*) as historialFinal FROM historial_estados');
      console.log(`   - Eventos en historial: ${count}`);
    }
    console.log('');

    console.log('✅ Reseteo completo finalizado exitosamente!');
    console.log('');
    console.log('🔄 Todos los clientes están ahora en estado "nuevo"');
    console.log('📋 El historial de gestiones ha sido completamente vaciado');
    console.log('👥 Todos los asesores no tienen clientes asignados');

  } catch (error) {
    console.error('❌ Error al resetear gestiones:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar
resetearGestiones()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error fatal:', err);
    process.exit(1);
  });
