const mysql = require('mysql2/promise');
const fs = require('fs');

async function importarClientesATemp() {
  console.log('🔄 Conectando a BD...');
  const connection = await mysql.createConnection({
    host: 'db',
    port: 3306,
    user: 'albru',
    password: 'albru12345',
    database: 'albru'
  });
  console.log('✅ Conectado');

  // Asegurarse de que la tabla clientes_temp exista y esté vacía
  await connection.execute('DROP TABLE IF EXISTS clientes_temp;');
  await connection.execute('CREATE TABLE IF NOT EXISTS clientes_temp LIKE clientes;');
  await connection.execute('TRUNCATE TABLE clientes_temp;');

  // Leer CSV
  const csvPath = '/usr/src/app/clientes.csv';
  console.log(`📥 Leyendo CSV en ${csvPath}...`);
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const lineas = csv.split('\n');

  console.log(`📋 Total líneas CSV: ${lineas.length - 1}`);

  let insertados = 0;
  let errores = 0;

  for (let i = 1; i < lineas.length; i++) {
    if (!lineas[i].trim()) continue;

    const cols = lineas[i].split(';');

    // Extraer datos del CSV (índices basados en estructura del CSV)
    const id = parseInt(cols[0]) || null;
    const nombre = cols[1] || '';
    const tipo_base = cols[2] || null;
    const leads_original_telefono = cols[3] || null;
    const campana = cols[4] || null;
    const canal_adquisicion = cols[5] || null;
    const sala_asignada = cols[6] || null;
    const compania = cols[7] || null;
    const telefono = cols[13] || null;
    const dni = cols[38] || null;
    const estatus_comercial_categoria = cols[47] || null;
    const estatus_comercial_subcategoria = cols[48] || null;

    // Parsear created_at (columna 17, índice 16) - formato en CSV: YYYY/MM/DD
    const fechaStr = cols[16];
    let created_at = null;
    if (fechaStr && fechaStr.trim()) {
      try {
        const partes = fechaStr.trim().split('/');
        if (partes.length === 3) {
          // partes[0] = año, partes[1] = mes, partes[2] = día
          created_at = `${partes[0]}-${partes[1].padStart(2,'0')}-${partes[2].padStart(2,'0')} 00:00:00`;
        }
      } catch (e) {
        // ignore
      }
    }

    try {
      await connection.execute(`
        INSERT INTO clientes_temp (
          id, nombre, tipo_base, leads_original_telefono, telefono,
          campana, canal_adquisicion, sala_asignada, compania, dni, created_at,
          estatus_comercial_categoria, estatus_comercial_subcategoria
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, nombre, tipo_base, leads_original_telefono, telefono, campana, canal_adquisicion, sala_asignada, compania, dni, created_at, estatus_comercial_categoria, estatus_comercial_subcategoria]);

      insertados++;

      if (insertados % 500 === 0) {
        console.log(`✅ ${insertados} insertados...`);
      }

    } catch (error) {
      errores++;
      if (errores < 10) console.log(`❌ Error línea ${i} (ID ${id}):`, error.message);
    }
  }

  console.log('\n📊 RESUMEN:');
  console.log(`✅ Clientes insertados en clientes_temp: ${insertados}`);
  console.log(`❌ Errores: ${errores}`);
  console.log(`📈 Total procesados: ${insertados}`);

  await connection.end();
}

importarClientesATemp().catch(console.error);
