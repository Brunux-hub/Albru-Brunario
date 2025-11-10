const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'db',  // Nombre del servicio Docker
  port: 3306,
  user: 'albru',
  password: 'albru12345',
  database: 'albru'
};

// Función para parsear fecha del CSV (formato: "7/06/2025" - última columna)
function parseFechaCSV(fechaStr) {
  if (!fechaStr || fechaStr.trim() === '') return null;
  
  try {
    // Formato: "7/06/2025" (dia/mes/año)
    const partes = fechaStr.trim().split('/');
    if (partes.length !== 3) return null;
    
    const [dia, mes, año] = partes;
    
    // Crear fecha en formato MySQL: YYYY-MM-DD HH:MM:SS
    const fechaMySQL = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')} 00:00:00`;
    return fechaMySQL;
  } catch (error) {
    console.error('Error parseando fecha:', fechaStr, error);
    return null;
  }
}

// Función para leer y parsear el CSV
function parseCSV(csvPath) {
  const contenido = fs.readFileSync(csvPath, 'utf-8');
  const lineas = contenido.split('\n');
  const headers = lineas[0].split(';');
  
  console.log(`📋 Headers encontrados: ${headers.length} columnas`);
  console.log(`📋 Última columna: "${headers[headers.length - 1].trim()}"`);
  
  const datos = [];
  for (let i = 1; i < lineas.length; i++) {
    if (!lineas[i].trim()) continue;
    
    const valores = lineas[i].split(';');
    
    // Validar que tenga al menos 50 columnas
    if (valores.length < 50) continue;
    
    const registro = {
      id: valores[0],
      // La fecha está en el último campo
      created_at: valores[valores.length - 1]?.trim()
    };
    
    // Solo agregar si tiene ID válido
    if (registro.id && !isNaN(parseInt(registro.id))) {
      datos.push(registro);
    }
  }
  
  return datos;
}

async function importarFechas() {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');
    
    // Ruta al CSV (en el contenedor Docker está en /usr/src/app)
    const csvPath = '/usr/src/app/clientes.csv';
    
    console.log('📂 Buscando CSV en:', csvPath);
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ No se encontró el archivo CSV en:', csvPath);
      console.log('📍 Por favor, copia el archivo "clientes (5).csv" a la raíz del proyecto y renómbralo a "clientes.csv"');
      return;
    }
    
    console.log('📖 Leyendo archivo CSV...');
    const registros = parseCSV(csvPath);
    console.log(`✅ Se encontraron ${registros.length} registros en el CSV`);
    
    let actualizados = 0;
    let errores = 0;
    let sinFecha = 0;
    
    console.log('🔄 Actualizando fechas en la base de datos...\n');
    
    for (const registro of registros) {
      const clienteId = parseInt(registro.id);
      const fechaCSV = registro.created_at;
      
      if (!clienteId) {
        console.warn(`⚠️  ID inválido en registro:`, registro);
        errores++;
        continue;
      }
      
      if (!fechaCSV || fechaCSV.trim() === '') {
        sinFecha++;
        continue;
      }
      
      const fechaMySQL = parseFechaCSV(fechaCSV);
      
      if (!fechaMySQL) {
        console.warn(`⚠️  Fecha inválida para cliente ID ${clienteId}: ${fechaCSV}`);
        errores++;
        continue;
      }
      
      try {
        const [result] = await connection.execute(
          'UPDATE clientes SET created_at = ? WHERE id = ?',
          [fechaMySQL, clienteId]
        );
        
        if (result.affectedRows > 0) {
          actualizados++;
          if (actualizados % 50 === 0) {
            console.log(`✅ Actualizados ${actualizados} registros...`);
          }
        } else {
          console.warn(`⚠️  Cliente ID ${clienteId} no encontrado en la BD`);
        }
      } catch (error) {
        console.error(`❌ Error actualizando cliente ID ${clienteId}:`, error.message);
        errores++;
      }
    }
    
    console.log('\n📊 Resumen de importación:');
    console.log(`  ✅ Actualizados: ${actualizados}`);
    console.log(`  ⚠️  Sin fecha: ${sinFecha}`);
    console.log(`  ❌ Errores: ${errores}`);
    console.log(`  📝 Total procesados: ${registros.length}`);
    
  } catch (error) {
    console.error('❌ Error en la importación:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la importación
importarFechas().then(() => {
  console.log('\n✨ Proceso completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
