/**
 * Script de Importación de Historial de Gestiones desde Excel
 * 
 * Este script:
 * 1. Lee el archivo aña.xlsx (13,660 registros)
 * 2. Busca cada lead en la tabla clientes por teléfono (flexible, sin espacios)
 * 3. Si existe, inserta en historial_gestiones cada paso (ASESOR-1 a ASESOR-10)
 * 4. Mapea las tipificaciones (TIPI) a categorías/subcategorías del wizard
 * 5. Genera reporte de importación
 */

const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
const path = require('path');

// ========================================
// CONFIGURACIÓN
// ========================================

const DB_CONFIG = {
  host: 'localhost',
  port: 3308,
  user: 'root',
  password: 'root_password_here',
  database: 'albru'
};

const EXCEL_FILE = path.join(__dirname, 'aña.xlsx');

// ========================================
// MAPEO DE TIPIFICACIONES
// ========================================

const MAPEO_TIPIFICACIONES = {
  // LISTA NEGRA
  '8 - LISTA NEGRA': { 
    categoria: 'Lista negra', 
    subcategoria: 'Lista negra' 
  },
  
  // PREVENTA COMPLETA
  '7 - VENTA CERRADA': { 
    categoria: 'Preventa completa', 
    subcategoria: 'Venta cerrada' 
  },
  '7 - VC MES SIGUIENTE': { 
    categoria: 'Preventa completa', 
    subcategoria: 'Venta cerrada' 
  },
  
  // PREVENTA INCOMPLETA
  '6 - PREVENTA': { 
    categoria: 'Preventa incompleta', 
    subcategoria: 'Preventa incompleta' 
  },
  '6 - PDTE SCORE': { 
    categoria: 'Preventa completa', 
    subcategoria: 'Preventa pendiente de score' 
  },
  
  // SIN FACILIDADES
  '5 - SIN COBERTURA': { 
    categoria: 'Sin facilidades', 
    subcategoria: 'Sin cobertura' 
  },
  '5 - SERVICIO ACTIVO': { 
    categoria: 'Sin facilidades', 
    subcategoria: 'Servicio activo' 
  },
  '5 - EDIFICIO SIN LIBERAR': { 
    categoria: 'Sin facilidades', 
    subcategoria: 'Edificio sin liberar' 
  },
  '5 - SIN CTO': { 
    categoria: 'Sin facilidades', 
    subcategoria: 'Sin CTO' 
  },
  
  // RETIRADO
  '4 - ND PUBLICIDAD': { 
    categoria: 'Retirado', 
    subcategoria: 'No desea publicidad' 
  },
  '4 - DOBLE CLICK': { 
    categoria: 'Seguimiento', 
    subcategoria: 'Seguimiento' 
  },
  '4 - CON PROGRAMACIÓN': { 
    categoria: 'Rechazado', 
    subcategoria: 'Con programación' 
  },
  '4 - CON PROGRAMACIÃ“N': { 
    categoria: 'Rechazado', 
    subcategoria: 'Con programación' 
  },
  
  // RECHAZADO
  '3 - NO DESEA': { 
    categoria: 'Rechazado', 
    subcategoria: 'No desea' 
  },
  '3 - CON PROGRAMACIÓN': { 
    categoria: 'Rechazado', 
    subcategoria: 'Con programación' 
  },
  '3 - CON PROGRAMACIÃ“N': { 
    categoria: 'Rechazado', 
    subcategoria: 'Con programación' 
  },
  '3 - NO CALIFICA': { 
    categoria: 'Rechazado', 
    subcategoria: 'No califica' 
  },
  '3 - VC DESAPROBADA': { 
    categoria: 'Rechazado', 
    subcategoria: 'Venta cerrada desaprobada' 
  },
  '3 - ZONA F': { 
    categoria: 'Rechazado', 
    subcategoria: 'Zona fraude' 
  },
  
  // AGENDADO
  '2 - AGENDADO': { 
    categoria: 'Agendado', 
    subcategoria: 'Agendado' 
  },
  '2 - CONSULTARA CON FAMILIAR': { 
    categoria: 'Agendado', 
    subcategoria: 'Consultaría con familiar' 
  },
  '2 - FIN DE MES': { 
    categoria: 'Agendado', 
    subcategoria: 'Fin de mes' 
  },
  
  // SEGUIMIENTO
  '1 - SEGUIMIENTO': { 
    categoria: 'Seguimiento', 
    subcategoria: 'Seguimiento' 
  },
  '1 - SOLO INFO': { 
    categoria: 'Seguimiento', 
    subcategoria: 'Solo info' 
  },
  '1 - GESTION x CHAT': { 
    categoria: 'Seguimiento', 
    subcategoria: 'Gestión o chat' 
  },
  
  // SIN CONTACTO
  '0 - NO CONTESTA': { 
    categoria: 'Sin contacto', 
    subcategoria: 'No contesta' 
  },
  '0 - BUZON': { 
    categoria: 'Sin contacto', 
    subcategoria: 'Buzón' 
  },
  '0 - FUERA DE SERVICIO': { 
    categoria: 'Sin contacto', 
    subcategoria: 'Fuera de servicio' 
  },
  '0 - N° EQUIVOCADO': { 
    categoria: 'Sin contacto', 
    subcategoria: 'Número equivocado' 
  },
  '0 - Nº EQUIVOCADO': { 
    categoria: 'Sin contacto', 
    subcategoria: 'Número equivocado' 
  },
  '0 - NÂ° EQUIVOCADO': { 
    categoria: 'Sin contacto', 
    subcategoria: 'Número equivocado' 
  },
  '0 - CORTA LLAMADA': { 
    categoria: 'Sin contacto', 
    subcategoria: 'Corta llamada' 
  }
};

// ========================================
// FUNCIONES AUXILIARES
// ========================================

/**
 * Limpia un teléfono quitando espacios
 */
function limpiarTelefono(tel) {
  if (!tel) return '';
  return tel.toString().replace(/\s/g, '').trim();
}

/**
 * Valida si una tipificación está mapeada
 */
function validarTipificacion(tipi) {
  if (!tipi || tipi === '') return null;
  
  const mapeado = MAPEO_TIPIFICACIONES[tipi];
  if (!mapeado) {
    console.warn(`⚠️  Tipificación no mapeada: "${tipi}"`);
    return null;
  }
  
  return mapeado;
}

// ========================================
// SCRIPT PRINCIPAL
// ========================================

async function importarHistorial() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   IMPORTACIÓN DE HISTORIAL DE GESTIONES DESDE EXCEL  ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');

  let connection;
  
  try {
    // 1. CONECTAR A BASE DE DATOS
    console.log('📊 Conectando a la base de datos...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conexión exitosa\n');

    // 2. LEER EXCEL
    console.log('📂 Leyendo archivo Excel:', EXCEL_FILE);
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`✅ Excel leído: ${data.length} filas\n`);

    // 3. ESTADÍSTICAS
    let procesadas = 0;
    let clientesEncontrados = 0;
    let clientesNoEncontrados = 0;
    let gestionesInsertadas = 0;
    let tipificacionesNoMapeadas = new Set();

    // 4. PROCESAR CADA FILA
    console.log('🔄 Procesando registros...\n');
    
    for (const [index, row] of data.entries()) {
      procesadas++;
      
      // Mostrar progreso cada 500 registros
      if (procesadas % 500 === 0) {
        console.log(`   Procesados: ${procesadas}/${data.length} (${Math.round(procesadas/data.length*100)}%)`);
      }

      // Extraer datos
      const telefonoOriginal = row['LEADS'];
      const dni = row['DNI'];
      
      if (!telefonoOriginal) {
        clientesNoEncontrados++;
        continue;
      }

      const telefonoLimpio = limpiarTelefono(telefonoOriginal);

      // Buscar cliente en BD
      const [clientes] = await connection.query(`
        SELECT id, nombre, leads_original_telefono
        FROM clientes 
        WHERE REPLACE(leads_original_telefono, ' ', '') = ?
           OR (dni IS NOT NULL AND dni != '' AND dni = ?)
        LIMIT 1
      `, [telefonoLimpio, dni]);

      if (clientes.length === 0) {
        clientesNoEncontrados++;
        continue;
      }

      const cliente = clientes[0];
      clientesEncontrados++;

      // Procesar hasta 10 asesores por cliente
      for (let paso = 1; paso <= 10; paso++) {
        const asesorKey = `ASESOR ${paso}`;
        const tipiKey = `TIPI ${paso}`;
        
        const asesorNombre = row[asesorKey];
        const tipi = row[tipiKey];

        // Si no hay asesor en este paso, terminar
        if (!asesorNombre || asesorNombre === '') break;

        // Validar tipificación
        const mapeado = validarTipificacion(tipi);
        
        if (!mapeado) {
          if (tipi) tipificacionesNoMapeadas.add(tipi);
          continue;
        }

        // Insertar en historial_gestiones
        try {
          await connection.query(`
            INSERT INTO historial_gestiones 
            (cliente_id, telefono, paso, asesor_nombre, categoria, subcategoria, tipo_contacto, fecha_gestion, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'telefónico', NOW(), NOW())
          `, [
            cliente.id,
            telefonoOriginal,
            paso,
            asesorNombre,
            mapeado.categoria,
            mapeado.subcategoria
          ]);

          gestionesInsertadas++;
        } catch (err) {
          console.error(`❌ Error insertando gestión - Cliente: ${cliente.id}, Paso: ${paso}`, err.message);
        }
      }
    }

    // 5. REPORTE FINAL
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║              REPORTE DE IMPORTACIÓN                   ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📊 Registros del Excel procesados:      ${procesadas}`);
    console.log(`✅ Clientes encontrados en BD:          ${clientesEncontrados}`);
    console.log(`❌ Clientes NO encontrados en BD:       ${clientesNoEncontrados}`);
    console.log(`📝 Gestiones insertadas:                ${gestionesInsertadas}`);
    console.log('');
    
    if (tipificacionesNoMapeadas.size > 0) {
      console.log('⚠️  TIPIFICACIONES NO MAPEADAS:');
      tipificacionesNoMapeadas.forEach(tipi => {
        console.log(`   - "${tipi}"`);
      });
      console.log('');
      console.log('💡 Agrega estas tipificaciones al MAPEO_TIPIFICACIONES en el script');
      console.log('');
    }

    // Verificar datos insertados
    const [count] = await connection.query('SELECT COUNT(*) as total FROM historial_gestiones');
    console.log(`🎯 Total registros en historial_gestiones: ${count[0].total}`);
    console.log('');
    console.log('✅ Importación completada exitosamente');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR FATAL:', error.message);
    console.error('');
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('');
      console.log('🔌 Conexión cerrada');
    }
  }
}

// ========================================
// EJECUTAR
// ========================================

importarHistorial()
  .then(() => {
    console.log('');
    console.log('👋 Proceso finalizado');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Error inesperado:', err);
    process.exit(1);
  });
