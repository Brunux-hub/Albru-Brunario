const mysql = require('mysql2/promise');

async function limpiarDatosGestion() {
  console.log('🔄 Conectando a BD...');
  const connection = await mysql.createConnection({
    host: 'db',
    port: 3306,
    user: 'albru',
    password: 'albru12345',
    database: 'albru'
  });
  console.log('✅ Conectado');

  try {
    // Ver estado actual
    const [antes] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN seguimiento_status = 'gestionado' THEN 1 END) as gestionados,
        COUNT(CASE WHEN seguimiento_status = 'no_gestionado' THEN 1 END) as no_gestionados,
        COUNT(CASE WHEN asesor_asignado IS NOT NULL THEN 1 END) as con_asesor,
        COUNT(CASE WHEN ultima_fecha_gestion IS NOT NULL THEN 1 END) as con_fecha_gestion
      FROM clientes
    `);
    
    console.log('\n📊 ESTADO ANTES DE LIMPIAR:');
    console.log(`   Total clientes: ${antes[0].total}`);
    console.log(`   Gestionados: ${antes[0].gestionados}`);
    console.log(`   No gestionados: ${antes[0].no_gestionados}`);
    console.log(`   Con asesor asignado: ${antes[0].con_asesor}`);
    console.log(`   Con fecha de gestión: ${antes[0].con_fecha_gestion}`);

    // Limpiar todos los datos de gestión
    console.log('\n🧹 Limpiando datos de gestión...');
    const [result] = await connection.execute(`
      UPDATE clientes 
      SET 
        seguimiento_status = NULL,
        asesor_asignado = NULL,
        ultima_fecha_gestion = NULL,
        fecha_ultimo_contacto = NULL,
        derivado_at = NULL,
        opened_at = NULL,
        last_activity = NULL,
        returned_at = NULL,
        quality_status = NULL,
        estatus_comercial_categoria = NULL,
        estatus_comercial_subcategoria = NULL
      WHERE 
        seguimiento_status IS NOT NULL 
        OR asesor_asignado IS NOT NULL 
        OR ultima_fecha_gestion IS NOT NULL
    `);

    console.log(`✅ ${result.affectedRows} registros limpiados`);

    // Ver estado después
    const [despues] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN seguimiento_status IS NOT NULL THEN 1 END) as con_seguimiento,
        COUNT(CASE WHEN asesor_asignado IS NOT NULL THEN 1 END) as con_asesor
      FROM clientes
    `);

    console.log('\n📊 ESTADO DESPUÉS DE LIMPIAR:');
    console.log(`   Total clientes: ${despues[0].total}`);
    console.log(`   Con seguimiento: ${despues[0].con_seguimiento}`);
    console.log(`   Con asesor: ${despues[0].con_asesor}`);
    console.log('\n✨ Base de datos limpia y lista para usar con los 9,446 clientes');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

limpiarDatosGestion().catch(console.error);
