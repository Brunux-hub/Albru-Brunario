const fs = require('fs');
const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  port: 3308,
  user: 'root',
  password: 'root_password_here',
  database: 'albru'
};

async function importarClientes() {
  let connection;
  
  try {
    console.log('📂 Leyendo archivo CSV...');
    const csvPath = 'C:\\Users\\USER\\Albru-Brunario\\clientes (updated).csv';
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📊 Total de líneas en CSV: ${lines.length}`);
    
    // Conectar a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');
    
    // Leer encabezados
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    console.log('📋 Encabezados:', headers);
    
    let insertados = 0;
    let actualizados = 0;
    let errores = 0;
    
    // Procesar cada línea (saltando el encabezado)
    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Parsear CSV considerando comillas
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim());
        
        // Crear objeto con los datos
        const cliente = {};
        headers.forEach((header, index) => {
          cliente[header] = values[index] || null;
        });
        
        // Verificar si el cliente ya existe (por teléfono o ID)
        const telefono = cliente.TELEFONO || cliente.telefono;
        const id = cliente.ID || cliente.id;
        
        if (!telefono && !id) {
          console.log(`⚠️ Línea ${i + 1}: Sin teléfono ni ID, saltando`);
          continue;
        }
        
        // Buscar cliente existente
        let [existing] = await connection.query(
          'SELECT id FROM clientes WHERE telefono = ? OR leads_original_telefono = ? OR id = ? LIMIT 1',
          [telefono, telefono, id]
        );
        
        // Preparar datos para insertar/actualizar
        const nombre = cliente.NOMBRE || cliente.nombre || 'SIN NOMBRE';
        const dni = cliente.DNI || cliente.dni || null;
        const direccion = cliente.DIRECCION || cliente.direccion || null;
        const distrito = cliente.DISTRITO || cliente.distrito || null;
        const campana = cliente.CAMPAÑA || cliente.CAMPANA || cliente.campana || null;
        const canal = cliente.CANAL || cliente.canal || null;
        const compania = cliente.COMPAÑIA || cliente.COMPANIA || cliente.compania || null;
        const sala = cliente.SALA || cliente.sala || null;
        const createdAt = cliente.CREATED_AT || cliente.created_at || new Date().toISOString().slice(0, 19).replace('T', ' ');
        
        if (existing.length > 0) {
          // Actualizar cliente existente
          await connection.query(
            `UPDATE clientes SET 
              nombre = ?,
              telefono = ?,
              leads_original_telefono = ?,
              dni = ?,
              direccion = ?,
              distrito = ?,
              campana = ?,
              canal_adquisicion = ?,
              compania = ?,
              sala_asignada = ?,
              updated_at = NOW()
            WHERE id = ?`,
            [nombre, telefono, telefono, dni, direccion, distrito, campana, canal, compania, sala, existing[0].id]
          );
          actualizados++;
        } else {
          // Insertar nuevo cliente
          await connection.query(
            `INSERT INTO clientes (
              nombre, telefono, leads_original_telefono, dni, direccion, distrito,
              campana, canal_adquisicion, compania, sala_asignada, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [nombre, telefono, telefono, dni, direccion, distrito, campana, canal, compania, sala, createdAt]
          );
          insertados++;
        }
        
        // Mostrar progreso cada 100 registros
        if ((i - 1) % 100 === 0) {
          console.log(`📝 Procesados ${i - 1}/${lines.length - 1} registros...`);
        }
        
      } catch (err) {
        console.error(`❌ Error en línea ${i + 1}:`, err.message);
        errores++;
      }
    }
    
    console.log('\n✅ Importación completada');
    console.log(`📊 Resultados:`);
    console.log(`   - Insertados: ${insertados}`);
    console.log(`   - Actualizados: ${actualizados}`);
    console.log(`   - Errores: ${errores}`);
    console.log(`   - Total procesados: ${insertados + actualizados}`);
    
    // Mostrar estadísticas finales
    const [stats] = await connection.query('SELECT COUNT(*) as total FROM clientes');
    console.log(`\n📈 Total de clientes en BD: ${stats[0].total}`);
    
  } catch (err) {
    console.error('❌ Error general:', err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
importarClientes();
