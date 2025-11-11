const fs = require('fs');
const mysql = require('mysql2/promise');

async function actualizarFechas() {
  let connection;
  
  try {
    console.log('🔄 Conectando a BD...');
    connection = await mysql.createConnection({
      host: 'db',
      port: 3306,
      user: 'albru',
      password: 'albru12345',
      database: 'albru'
    });
    console.log('✅ Conectado\n');
    
    const contenido = fs.readFileSync('/usr/src/app/clientes.csv', 'utf-8');
    const lineas = contenido.split('\n');
    
    let actualizados = 0;
    
    for (let i = 1; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      if (!linea) continue;
      
      const cols = linea.split(';');
      const id = parseInt(cols[0]);
      const fecha = cols[cols.length - 1]; // Columna AX (última)
      
      if (!id || !fecha || !fecha.trim()) continue;
      
      // Convertir "7/06/2025" a "2025-06-07"
      const partes = fecha.trim().split('/');
      if (partes.length !== 3) continue;
      
      const fechaMySQL = `${partes[2]}-${partes[1].padStart(2,'0')}-${partes[0].padStart(2,'0')}`;
      
      await connection.execute(
        'UPDATE clientes SET created_at = ? WHERE id = ?',
        [fechaMySQL, id]
      );
      
      actualizados++;
      if (actualizados % 500 === 0) console.log(`✅ ${actualizados}...`);
    }
    
    console.log(`\n✅ Total: ${actualizados} fechas actualizadas`);
    
  } catch (error) {
    console.error('❌', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

actualizarFechas().then(() => process.exit(0));