// Script de Importación de CSV con Categorización Automática
// Fecha: 12 de noviembre de 2025
// Objetivo: Importar clientes2.csv con mapeo de tipificaciones a categorías

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de base de datos
const dbConfig = {
  host: 'localhost',
  port: 3308,
  user: 'root',
  password: 'root_password_here',
  database: 'albru'
};

// MAPEO DE TIPIFICACIONES A CATEGORÍAS (según wizard estatusComercial.ts)
const MAPEO_TIPIFICACIONES = {
  // SIN CONTACTO
  '0 - NO CONTESTA': { cat: 'Sin contacto', subcat: 'No contesta' },
  '0 - CORTA LLAMADA': { cat: 'Sin contacto', subcat: 'Corta llamada' },
  '0 - BUZON': { cat: 'Sin contacto', subcat: 'Buzón' },
  '0 - FUERA DE SERVICIO': { cat: 'Sin contacto', subcat: 'Fuera de servicio' },
  '0 - N° EQUIVOCADO': { cat: 'Sin contacto', subcat: 'Número equivocado' },
  
  // SEGUIMIENTO
  '1 - SOLO INFO': { cat: 'Seguimiento', subcat: 'Solo info' },
  '1 - GESTION x CHAT': { cat: 'Seguimiento', subcat: 'Gestión o chat' },
  '1 - SEGUIMIENTO': { cat: 'Seguimiento', subcat: 'Seguimiento' },
  '4 - DOBLE CLICK': { cat: 'Seguimiento', subcat: 'Seguimiento' },
  
  // AGENDADO
  '2 - AGENDADO': { cat: 'Agendado', subcat: 'Agendado' },
  '2 - CONSULTARA CON FAMILIAR': { cat: 'Agendado', subcat: 'Consultaría con familiar' },
  '2 - FIN DE MES': { cat: 'Agendado', subcat: 'Fin de mes' },
  
  // RECHAZADO
  '3 - NO DESEA': { cat: 'Rechazado', subcat: 'No desea' },
  '3 - CON PROGRAMACIÓN': { cat: 'Rechazado', subcat: 'Con programación' },
  '3 - NO CALIFICA': { cat: 'Rechazado', subcat: 'No califica' },
  '3 - VC DESAPROBADA': { cat: 'Rechazado', subcat: 'Venta cerrada desaprobada' },
  '3 - ZONA F': { cat: 'Rechazado', subcat: 'Zona fraude' },
  
  // RETIRADO
  '4 - ND PUBLICIDAD': { cat: 'Retirado', subcat: 'No desea publicidad' },
  
  // SIN FACILIDADES
  '5 - SIN COBERTURA': { cat: 'Sin facilidades', subcat: 'Sin cobertura' },
  '5 - SERVICIO ACTIVO': { cat: 'Sin facilidades', subcat: 'Servicio activo' },
  '5 - EDIFICIO SIN LIBERAR': { cat: 'Sin facilidades', subcat: 'Edificio sin liberar' },
  '5 - SIN CTO': { cat: 'Sin facilidades', subcat: 'Sin CTO' },
  
  // PREVENTA COMPLETA
  '6 - PDTE SCORE': { cat: 'Preventa completa', subcat: 'Preventa pendiente de score' },
  '6 - PREVENTA': { cat: 'Preventa completa', subcat: 'Preventa pendiente de score' },
  
  // LISTA NEGRA
  '8 - LISTA NEGRA': { cat: 'Lista negra', subcat: 'Lista negra' }
};

// Función para convertir fecha DD/MM/YYYY a YYYY-MM-DD HH:MM:SS
function convertirFecha(fechaStr) {
  if (!fechaStr || fechaStr.trim() === '') return null;
  
  try {
    // Entrada: "7/06/2025 00:00" o "07/06/2025 00:00"
    const partes = fechaStr.split(' ')[0].split('/');
    if (partes.length !== 3) return null;
    
    const dia = partes[0].padStart(2, '0');
    const mes = partes[1].padStart(2, '0');
    const año = partes[2];
    
    return `${año}-${mes}-${dia} 00:00:00`;
  } catch (error) {
    console.error(`Error al convertir fecha: ${fechaStr}`, error);
    return null;
  }
}

// Función para escapar valores SQL
function toSQL(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  if (typeof value === 'number') return value;
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function importarCSV() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa\n');
    
    // Leer CSV
    const csvPath = path.join(__dirname, 'clientes2.csv');
    console.log(`📄 Leyendo CSV: ${csvPath}`);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📊 Total líneas en CSV: ${lines.length - 1} (sin header)\n`);
    
    // Parsear CSV
    const header = lines[0].split(';');
    const rows = lines.slice(1).map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ';' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current);
      return values;
    });
    
    console.log(`✅ CSV parseado correctamente\n`);
    
    // Estadísticas
    let insertados = 0;
    let errores = 0;
    let sinTipificacion = 0;
    const tipificaciones = {};
    
    // Procesar en lotes
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, Math.min(i + batchSize, rows.length));
      
      for (const row of batch) {
        try {
          // Columnas del CSV (índices 0-49)
          const id = row[0] || null;
          const nombre = row[1]?.trim() || 'SIN NOMBRE';
          const tipo_base = row[2]?.trim() || null;
          const leads_original_telefono = row[3]?.trim() || null;
          const campana = row[4]?.trim() || null;
          const canal_adquisicion = row[5]?.trim() || null;
          const sala_asignada = row[6]?.trim() || null;
          const compania = row[7]?.trim() || null;
          const telefono = row[13]?.trim() || leads_original_telefono || 'SIN TELEFONO';
          const created_at = convertirFecha(row[16]);
          const updated_at = convertirFecha(row[17]);
          const tipificacion_original = row[49]?.trim() || '';
          
          // Mapear tipificación a categoría/subcategoría
          const mapeo = MAPEO_TIPIFICACIONES[tipificacion_original] || { cat: null, subcat: null };
          
          if (!tipificacion_original) {
            sinTipificacion++;
          } else {
            tipificaciones[tipificacion_original] = (tipificaciones[tipificacion_original] || 0) + 1;
          }
          
          // INSERT
          const query = `
            INSERT INTO clientes (
              nombre, tipo_base, leads_original_telefono, campana, 
              canal_adquisicion, sala_asignada, compania, telefono,
              created_at, updated_at,
              estatus_comercial_categoria, estatus_comercial_subcategoria,
              tipificacion_original
            ) VALUES (
              ${toSQL(nombre)},
              ${toSQL(tipo_base)},
              ${toSQL(leads_original_telefono)},
              ${toSQL(campana)},
              ${toSQL(canal_adquisicion)},
              ${toSQL(sala_asignada)},
              ${toSQL(compania)},
              ${toSQL(telefono)},
              ${toSQL(created_at)},
              ${toSQL(updated_at)},
              ${toSQL(mapeo.cat)},
              ${toSQL(mapeo.subcat)},
              ${toSQL(tipificacion_original)}
            )
          `;
          
          await connection.query(query);
          insertados++;
          
        } catch (error) {
          console.error(`❌ Error en fila ${i + insertados + errores + 1}:`, error.message);
          errores++;
        }
      }
      
      // Progreso
      const progreso = Math.min(i + batchSize, rows.length);
      process.stdout.write(`\r📥 Procesando: ${progreso}/${rows.length} (${Math.round(progreso/rows.length*100)}%)`);
    }
    
    console.log('\n\n✅ IMPORTACIÓN COMPLETADA\n');
    
    // Resumen
    console.log('📊 ESTADÍSTICAS DE IMPORTACIÓN:');
    console.log(`   ✅ Registros insertados: ${insertados}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   ⚠️  Sin tipificación: ${sinTipificacion}\n`);
    
    console.log('📋 TIPIFICACIONES ENCONTRADAS:');
    Object.entries(tipificaciones)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tip, count]) => {
        const mapeo = MAPEO_TIPIFICACIONES[tip];
        if (mapeo) {
          console.log(`   ${tip.padEnd(30)} → ${mapeo.cat.padEnd(15)} / ${mapeo.subcat.padEnd(25)} (${count})`);
        } else {
          console.log(`   ${tip.padEnd(30)} → SIN MAPEO (${count})`);
        }
      });
    
    // Ahora identificar duplicados
    console.log('\n🔄 Identificando duplicados...');
    
    await connection.query(`
      UPDATE clientes c1
      SET 
          es_duplicado = FALSE,
          cantidad_duplicados = (
              SELECT COUNT(*) 
              FROM (SELECT * FROM clientes) c2 
              WHERE c2.telefono = c1.telefono 
                AND c2.telefono IS NOT NULL 
                AND c2.telefono != ''
          ),
          telefono_principal_id = NULL
      WHERE c1.id IN (
          SELECT MIN(id) 
          FROM (SELECT id, telefono FROM clientes) AS temp
          WHERE telefono IS NOT NULL AND telefono != ''
          GROUP BY telefono
      )
    `);
    
    await connection.query(`
      UPDATE clientes c1
      SET 
          es_duplicado = TRUE,
          telefono_principal_id = (
              SELECT MIN(id) 
              FROM (SELECT id, telefono FROM clientes) AS temp
              WHERE temp.telefono = c1.telefono 
                AND temp.telefono IS NOT NULL
          )
      WHERE c1.id NOT IN (
          SELECT MIN(id) 
          FROM (SELECT id, telefono FROM clientes) AS temp
          WHERE telefono IS NOT NULL AND telefono != ''
          GROUP BY telefono
      ) 
      AND c1.telefono IS NOT NULL 
      AND c1.telefono != ''
    `);
    
    // Verificar duplicados
    const [stats] = await connection.query(`
      SELECT 
          COUNT(*) as total_registros,
          COUNT(CASE WHEN es_duplicado = FALSE THEN 1 END) as registros_principales,
          COUNT(CASE WHEN es_duplicado = TRUE THEN 1 END) as registros_duplicados,
          SUM(cantidad_duplicados) as total_gestiones_posibles
      FROM clientes
      WHERE telefono IS NOT NULL AND telefono != ''
    `);
    
    console.log('\n📊 RESUMEN DE DUPLICADOS:');
    console.log(`   Total registros con teléfono: ${stats[0].total_registros}`);
    console.log(`   Registros principales (únicos): ${stats[0].registros_principales}`);
    console.log(`   Registros duplicados: ${stats[0].registros_duplicados}`);
    console.log(`   Total gestiones posibles: ${stats[0].total_gestiones_posibles}\n`);
    
    // Top duplicados
    const [topDuplicados] = await connection.query(`
      SELECT 
          telefono,
          cantidad_duplicados,
          MIN(id) as id_principal
      FROM clientes
      WHERE cantidad_duplicados > 1
      GROUP BY telefono, cantidad_duplicados
      ORDER BY cantidad_duplicados DESC
      LIMIT 10
    `);
    
    if (topDuplicados.length > 0) {
      console.log('🔝 TOP 10 TELÉFONOS CON MÁS DUPLICADOS:');
      topDuplicados.forEach((dup, idx) => {
        console.log(`   ${idx + 1}. ${dup.telefono} → ×${dup.cantidad_duplicados} (ID principal: ${dup.id_principal})`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ ERROR GENERAL:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
console.log('🚀 Iniciando importación de clientes2.csv...\n');
importarCSV();
