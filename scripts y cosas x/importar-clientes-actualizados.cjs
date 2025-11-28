const fs = require('fs');
const mysql = require('mysql2/promise');
const readline = require('readline');

const DB_CONFIG = {
  host: 'localhost',
  port: 3308,
  user: 'root',
  password: 'root_password_here',
  database: 'albru'
};

async function importarClientes() {
  const connection = await mysql.createConnection(DB_CONFIG);
  
  console.log('✓ Conectado a MySQL');
  console.log('📄 Leyendo archivo CSV...');
  
  const fileStream = fs.createReadStream('clientes (updated).csv');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  let headers = [];
  let imported = 0;
  let updated = 0;
  let errors = 0;
  const batchSize = 100;
  let batch = [];

  for await (const line of rl) {
    lineNumber++;
    
    if (lineNumber === 1) {
      headers = line.split(';');
      console.log(`📋 Columnas encontradas: ${headers.length}`);
      continue;
    }

    try {
      const values = line.split(';');
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });

      // Convertir fechas de formato YYYY/MM/DD a YYYY-MM-DD
      const convertirFecha = (fecha) => {
        if (!fecha) return null;
        return fecha.replace(/\//g, '-');
      };

      // Preparar datos para inserción/actualización
      const clienteData = {
        id: parseInt(row.id) || null,
        nombre: row.nombre || 'SIN NOMBRE',
        telefono: row.telefono || row.leads_original_telefono,
        leads_original_telefono: row.leads_original_telefono,
        campana: row.campana,
        canal_adquisicion: row.canal_adquisicion,
        sala_asignada: row.sala_asignada,
        compania: row.compania,
        created_at: convertirFecha(row.created_at),
        updated_at: convertirFecha(row.updated_at),
        dni: row.dni,
        asesor_asignado: row.asesor_asignado ? parseInt(row.asesor_asignado) : null,
        wizard_completado: parseInt(row.wizard_completado) || 0,
        es_duplicado: parseInt(row.es_duplicado) || 0,
        telefono_principal_id: row.telefono_principal_id ? parseInt(row.telefono_principal_id) : null,
        cantidad_duplicados: parseInt(row.cantidad_duplicados) || 1
      };

      batch.push(clienteData);

      if (batch.length >= batchSize) {
        const result = await procesarBatch(connection, batch);
        imported += result.imported;
        updated += result.updated;
        errors += result.errors;
        batch = [];
        
        if (lineNumber % 1000 === 0) {
          console.log(`📊 Procesadas ${lineNumber} líneas | Importados: ${imported} | Actualizados: ${updated} | Errores: ${errors}`);
        }
      }

    } catch (error) {
      console.error(`❌ Error en línea ${lineNumber}:`, error.message);
      errors++;
    }
  }

  // Procesar últimas líneas
  if (batch.length > 0) {
    const result = await procesarBatch(connection, batch);
    imported += result.imported;
    updated += result.updated;
    errors += result.errors;
  }

  console.log('\n✅ Importación completada:');
  console.log(`   📥 Registros importados: ${imported}`);
  console.log(`   🔄 Registros actualizados: ${updated}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log(`   📊 Total procesado: ${lineNumber - 1} líneas`);

  await connection.end();
}

async function procesarBatch(connection, batch) {
  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (const cliente of batch) {
    try {
      // Intentar actualizar primero
      const [result] = await connection.execute(
        `UPDATE clientes SET 
          nombre = ?,
          telefono = ?,
          leads_original_telefono = ?,
          campana = ?,
          canal_adquisicion = ?,
          sala_asignada = ?,
          compania = ?,
          updated_at = COALESCE(?, NOW()),
          dni = ?,
          asesor_asignado = ?,
          wizard_completado = ?,
          es_duplicado = ?,
          telefono_principal_id = ?,
          cantidad_duplicados = ?
        WHERE id = ?`,
        [
          cliente.nombre,
          cliente.telefono,
          cliente.leads_original_telefono,
          cliente.campana,
          cliente.canal_adquisicion,
          cliente.sala_asignada,
          cliente.compania,
          cliente.updated_at,
          cliente.dni,
          cliente.asesor_asignado,
          cliente.wizard_completado,
          cliente.es_duplicado,
          cliente.telefono_principal_id,
          cliente.cantidad_duplicados,
          cliente.id
        ]
      );

      if (result.affectedRows > 0) {
        updated++;
      } else {
        // Si no existe, insertar
        await connection.execute(
          `INSERT INTO clientes (
            id, nombre, telefono, leads_original_telefono, campana, 
            canal_adquisicion, sala_asignada, compania, created_at, updated_at,
            dni, asesor_asignado, wizard_completado, es_duplicado,
            telefono_principal_id, cantidad_duplicados
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, NOW()), COALESCE(?, NOW()), ?, ?, ?, ?, ?, ?)`,
          [
            cliente.id,
            cliente.nombre,
            cliente.telefono,
            cliente.leads_original_telefono,
            cliente.campana,
            cliente.canal_adquisicion,
            cliente.sala_asignada,
            cliente.compania,
            cliente.created_at,
            cliente.updated_at,
            cliente.dni,
            cliente.asesor_asignado,
            cliente.wizard_completado,
            cliente.es_duplicado,
            cliente.telefono_principal_id,
            cliente.cantidad_duplicados
          ]
        );
        imported++;
      }
    } catch (error) {
      console.error(`Error procesando cliente ID ${cliente.id}:`, error.message);
      errors++;
    }
  }

  return { imported, updated, errors };
}

// Ejecutar
importarClientes().catch(console.error);
