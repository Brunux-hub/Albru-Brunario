const mysql = require('mysql2/promise');
const fs = require('fs');

async function importarClientes() {
  console.log('🔄 Conectando a BD...');
  const connection = await mysql.createConnection({
    host: 'db',
    port: 3306,
    user: 'albru',
    password: 'albru12345',
    database: 'albru'
  });
  console.log('✅ Conectado');

  // Leer CSV
  const csv = fs.readFileSync('/usr/src/app/clientes.csv', 'utf-8');
  const lineas = csv.split('\n');
  
  console.log(`📋 Total líneas CSV: ${lineas.length - 1}`);

  let insertados = 0;
  let actualizados = 0;
  let errores = 0;

  for (let i = 1; i < lineas.length; i++) {
    if (!lineas[i].trim()) continue;
    
    const cols = lineas[i].split(';');
    
    // Extraer datos del CSV
    const id = parseInt(cols[0]);
    const nombre = cols[1] || '';
    const tipo_base = cols[2] || null;
    const telefono = cols[3] || null;
    const campana = cols[4] || null;
    const canal = cols[5] || null;
    const sala = cols[6] || null;
    const compania = cols[7] || null;
    const dni = cols[36] || null;
    
    // Fecha de creación (última columna)
    const fechaStr = cols[cols.length - 1];
    let created_at = null;
    
    if (fechaStr && fechaStr.trim()) {
      try {
        const partes = fechaStr.trim().split('/');
        if (partes.length === 3) {
          created_at = `${partes[2]}-${partes[1].padStart(2,'0')}-${partes[0].padStart(2,'0')} 00:00:00`;
        }
      } catch (e) {
        console.log(`⚠️  Error parseando fecha línea ${i}: ${fechaStr}`);
      }
    }

    try {
      // Verificar si el cliente ya existe
      const [existing] = await connection.execute(
        'SELECT id FROM clientes WHERE id = ?',
        [id]
      );

      if (existing.length > 0) {
        // Cliente existe, actualizar
        await connection.execute(`
          UPDATE clientes 
          SET nombre = ?,
              tipo_base = ?,
              leads_original_telefono = ?,
              telefono = ?,
              campana = ?,
              canal_adquisicion = ?,
              sala_asignada = ?,
              compania = ?,
              dni = ?,
              created_at = ?
          WHERE id = ?
        `, [nombre, tipo_base, telefono, telefono, campana, canal, sala, compania, dni, created_at, id]);
        actualizados++;
      } else {
        // Cliente no existe, insertar
        await connection.execute(`
          INSERT INTO clientes (
            id, nombre, tipo_base, leads_original_telefono, telefono,
            campana, canal_adquisicion, sala_asignada, compania, dni, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, nombre, tipo_base, telefono, telefono, campana, canal, sala, compania, dni, created_at]);
        insertados++;
      }

      // Progreso cada 500 registros
      if ((insertados + actualizados) % 500 === 0) {
        console.log(`✅ ${insertados + actualizados}... (${insertados} nuevos, ${actualizados} actualizados)`);
      }

    } catch (error) {
      errores++;
      if (errores < 10) {
        console.log(`❌ Error línea ${i} (ID ${id}):`, error.message);
      }
    }
  }

  console.log('\n📊 RESUMEN:');
  console.log(`✅ Clientes nuevos insertados: ${insertados}`);
  console.log(`🔄 Clientes actualizados: ${actualizados}`);
  console.log(`❌ Errores: ${errores}`);
  console.log(`📈 Total procesados: ${insertados + actualizados}`);

  await connection.end();
}

importarClientes().catch(console.error);
