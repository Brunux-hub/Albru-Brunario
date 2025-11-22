const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: 'localhost',
  port: 3308,
  user: 'root',
  password: 'root_password_here',
  database: 'albru'
};

// Crear carpeta de logs
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logFile = path.join(logsDir, `reemplazo_${new Date().toISOString().replace(/:/g, '-')}.log`);

function log(mensaje) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const linea = `[${timestamp}] ${mensaje}`;
  console.log(linea);
  fs.appendFileSync(logFile, linea + '\n');
}

function convertirFecha(valor) {
  if (!valor) return null;
  
  try {
    // Si es un número de Excel (serial date)
    if (typeof valor === 'number') {
      const fecha = XLSX.SSF.parse_date_code(valor);
      return `${fecha.y}-${String(fecha.m).padStart(2, '0')}-${String(fecha.d).padStart(2, '0')} ${String(fecha.H || 0).padStart(2, '0')}:${String(fecha.M || 0).padStart(2, '0')}:${String(fecha.S || 0).padStart(2, '0')}`;
    }
    
    // Si es una cadena, intentar parsear
    if (typeof valor === 'string') {
      // Formato YYYY/MM/DD o similar
      valor = valor.replace(/\//g, '-');
      const date = new Date(valor);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 19).replace('T', ' ');
      }
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

function convertirValor(valor, tipo = 'string') {
  if (valor === null || valor === undefined || valor === '') return null;
  
  if (tipo === 'fecha') return convertirFecha(valor);
  if (tipo === 'numero') return parseFloat(valor) || null;
  if (tipo === 'entero') return parseInt(valor) || null;
  if (tipo === 'boolean') return valor ? 1 : 0;
  
  return String(valor);
}

async function hacerBackup(connection, tabla) {
  const backupNombre = `${tabla}_backup_${Date.now()}`;
  log(`\n📦 Creando backup: ${backupNombre}`);
  
  try {
    await connection.query(`CREATE TABLE ${backupNombre} LIKE ${tabla}`);
    await connection.query(`INSERT INTO ${backupNombre} SELECT * FROM ${tabla}`);
    
    const [rows] = await connection.query(`SELECT COUNT(*) as total FROM ${backupNombre}`);
    log(`✅ Backup creado: ${backupNombre} (${rows[0].total.toLocaleString()} registros)`);
    return backupNombre;
  } catch (error) {
    log(`❌ Error creando backup: ${error.message}`);
    throw error;
  }
}

async function vaciarTabla(connection, tabla) {
  log(`\n🗑️ Vaciando tabla ${tabla}...`);
  try {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query(`TRUNCATE TABLE ${tabla}`);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    log(`✅ Tabla ${tabla} vaciada`);
  } catch (error) {
    log(`❌ Error vaciando tabla: ${error.message}`);
    throw error;
  }
}

async function repararForeignKeys(connection) {
  log(`\n🔧 Reparando foreign keys de historial_cliente...`);
  try {
    // Verificar FK actual
    const [fks] = await connection.query(`
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'historial_cliente' 
      AND COLUMN_NAME = 'cliente_id'
      AND CONSTRAINT_NAME != 'PRIMARY'
    `);
    
    if (fks.length > 0) {
      const fkActual = fks[0];
      log(`   FK actual: ${fkActual.CONSTRAINT_NAME} -> ${fkActual.REFERENCED_TABLE_NAME}`);
      
      // Si no apunta a 'clientes', corregir
      if (fkActual.REFERENCED_TABLE_NAME !== 'clientes') {
        log(`   ⚠️ FK incorrecta, eliminando...`);
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query(`ALTER TABLE historial_cliente DROP FOREIGN KEY ${fkActual.CONSTRAINT_NAME}`);
        
        log(`   ✅ Creando FK correcta hacia 'clientes'...`);
        await connection.query(`
          ALTER TABLE historial_cliente 
          ADD CONSTRAINT historial_cliente_ibfk_1 
          FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
        `);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        log(`   ✅ FK reparada exitosamente`);
      } else {
        log(`   ✅ FK correcta`);
      }
    }
  } catch (error) {
    log(`   ⚠️ Error reparando FK: ${error.message}`);
    // Continuar de todos modos
  }
}

async function importarClientes(connection, archivoExcel) {
  log(`\n${'='.repeat(80)}`);
  log(`IMPORTANDO CLIENTES DESDE: ${archivoExcel}`);
  log('='.repeat(80));
  
  // Leer Excel
  log('📖 Leyendo archivo Excel...');
  const workbook = XLSX.readFile(archivoExcel);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  log(`✅ Archivo leído: ${data.length.toLocaleString()} filas`);
  log(`Columnas: ${Object.keys(data[0] || {}).join(', ')}`);
  
  // Backup
  const backup = await hacerBackup(connection, 'clientes');
  
  // Vaciar tabla
  await vaciarTabla(connection, 'clientes');
  
  // Importar datos
  log(`\n📝 Insertando ${data.length.toLocaleString()} clientes...`);
  
  let insertados = 0;
  let errores = 0;
  const batchSize = 500;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    try {
      // Preparar valores para inserción masiva
      const valores = batch.map(row => [
        convertirValor(row.id, 'entero'),
        convertirValor(row.nombre) || 'SIN NOMBRE',
        convertirValor(row.tipo_base),
        convertirValor(row.leads_original_telefono),
        convertirValor(row.campana),
        convertirValor(row.canal_adquisicion),
        convertirValor(row.sala_asignada),
        convertirValor(row.compania),
        convertirValor(row.back_office_info),
        convertirValor(row.tipificacion_back),
        row.datos_leads ? JSON.stringify(row.datos_leads) : null,
        convertirValor(row.comentarios_back),
        convertirFecha(row.ultima_fecha_gestion),
        convertirValor(row.telefono) || convertirValor(row.leads_original_telefono) || 'SIN TELEFONO',
        convertirFecha(row.fecha_ultimo_contacto),
        convertirValor(row.notas),
        convertirFecha(row.created_at),
        convertirFecha(row.updated_at),
        convertirValor(row.tipo_cliente_wizard),
        convertirValor(row.lead_score),
        convertirValor(row.telefono_registro),
        convertirFecha(row.fecha_nacimiento),
        convertirValor(row.dni_nombre_titular),
        convertirValor(row.parentesco_titular),
        convertirValor(row.telefono_referencia_wizard),
        convertirValor(row.telefono_grabacion_wizard),
        convertirValor(row.direccion_completa),
        convertirValor(row.numero_piso_wizard),
        convertirValor(row.tipo_plan),
        convertirValor(row.servicio_contratado),
        convertirValor(row.velocidad_contratada),
        convertirValor(row.precio_plan, 'numero'),
        convertirValor(row.dispositivos_adicionales_wizard),
        convertirValor(row.plataforma_digital_wizard),
        convertirValor(row.pago_adelanto_instalacion_wizard),
        convertirValor(row.wizard_completado, 'entero') || 0,
        convertirFecha(row.fecha_wizard_completado),
        row.wizard_data_json ? JSON.stringify(row.wizard_data_json) : null,
        convertirValor(row.dni),
        convertirValor(row.asesor_asignado, 'entero'),
        convertirValor(row.validador_asignado, 'entero'),
        convertirFecha(row.fecha_asignacion_validador),
        convertirValor(row.estatus_wizard),
        convertirValor(row.seguimiento_status),
        convertirFecha(row.derivado_at),
        convertirFecha(row.opened_at),
        convertirFecha(row.last_activity),
        convertirValor(row.estatus_comercial_categoria),
        convertirValor(row.estatus_comercial_subcategoria),
        convertirValor(row.quality_status),
        convertirFecha(row.returned_at),
        convertirValor(row.es_duplicado, 'entero') || 0,
        convertirValor(row.telefono_principal_id, 'entero'),
        convertirValor(row.cantidad_duplicados, 'entero') || 1,
        convertirValor(row.tipificacion_original)
      ]);
      
      const query = `
        INSERT INTO clientes (
          id, nombre, tipo_base, leads_original_telefono, campana, canal_adquisicion,
          sala_asignada, compania, back_office_info, tipificacion_back, datos_leads,
          comentarios_back, ultima_fecha_gestion, telefono, fecha_ultimo_contacto, notas,
          created_at, updated_at, tipo_cliente_wizard, lead_score, telefono_registro,
          fecha_nacimiento, dni_nombre_titular, parentesco_titular, telefono_referencia_wizard,
          telefono_grabacion_wizard, direccion_completa, numero_piso_wizard, tipo_plan,
          servicio_contratado, velocidad_contratada, precio_plan, dispositivos_adicionales_wizard,
          plataforma_digital_wizard, pago_adelanto_instalacion_wizard, wizard_completado,
          fecha_wizard_completado, wizard_data_json, dni, asesor_asignado, validador_asignado,
          fecha_asignacion_validador, estatus_wizard, seguimiento_status, derivado_at,
          opened_at, last_activity, estatus_comercial_categoria, estatus_comercial_subcategoria,
          quality_status, returned_at, es_duplicado, telefono_principal_id, cantidad_duplicados,
          tipificacion_original
        ) VALUES ?
      `;
      
      await connection.query(query, [valores]);
      insertados += batch.length;
      
      if (insertados % 2000 === 0) {
        log(`   ⏳ Insertados: ${insertados.toLocaleString()}/${data.length.toLocaleString()}`);
      }
      
    } catch (error) {
      log(`   ⚠️ Error en batch ${i}: ${error.message}`);
      errores += batch.length;
    }
  }
  
  log(`\n✅ IMPORTACIÓN CLIENTES COMPLETADA:`);
  log(`   Total insertados: ${insertados.toLocaleString()}`);
  log(`   Errores: ${errores}`);
  log(`   Backup: ${backup}`);
  
  return { insertados, errores, backup };
}

async function importarHistorial(connection, archivoExcel) {
  log(`\n${'='.repeat(80)}`);
  log(`IMPORTANDO HISTORIAL DESDE: ${archivoExcel}`);
  log('='.repeat(80));
  
  // Leer Excel
  log('📖 Leyendo archivo Excel...');
  const workbook = XLSX.readFile(archivoExcel);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  log(`✅ Archivo leído: ${data.length.toLocaleString()} filas`);
  
  // Backup
  const backup = await hacerBackup(connection, 'historial_cliente');
  
  // Vaciar tabla
  await vaciarTabla(connection, 'historial_cliente');
  
  // Importar datos
  log(`\n📝 Procesando ${data.length.toLocaleString()} registros de historial...`);
  
  let insertados = 0;
  let sinClienteId = 0;
  let errores = 0;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    try {
      // Buscar cliente_id
      let clienteId = null;
      
      // Buscar por DNI
      if (row.DNI) {
        const [rows] = await connection.query(
          'SELECT id FROM clientes WHERE dni = ? LIMIT 1',
          [String(row.DNI).trim()]
        );
        if (rows.length > 0) clienteId = rows[0].id;
      }
      
      // Buscar por teléfono si no encontró por DNI
      if (!clienteId && row.LEADS) {
        const telefono = String(row.LEADS).trim();
        const [rows] = await connection.query(
          'SELECT id FROM clientes WHERE telefono = ? OR telefono LIKE ? LIMIT 1',
          [telefono, `%${telefono}%`]
        );
        if (rows.length > 0) clienteId = rows[0].id;
      }
      
      if (!clienteId) {
        sinClienteId++;
        continue;
      }
      
      // Buscar usuario_id - siempre verificar que exista
      let usuarioId = null;
      
      // Primero intentar buscar el asesor si existe en el Excel
      if (row['AS.FINAL']) {
        const asesorNombre = String(row['AS.FINAL']).trim();
        const [rows] = await connection.query(
          'SELECT id FROM usuarios WHERE nombre LIKE ? LIMIT 1',
          [`%${asesorNombre}%`]
        );
        if (rows.length > 0) usuarioId = rows[0].id;
      }
      
      // Si no encontró asesor, buscar cualquier usuario admin activo
      if (!usuarioId) {
        const [rows] = await connection.query(
          'SELECT id FROM usuarios WHERE rol = ? AND estado = ? LIMIT 1',
          ['admin', 'activo']
        );
        if (rows.length > 0) {
          usuarioId = rows[0].id;
        }
      }
      
      // Si aún no hay usuario, buscar el primer usuario disponible
      if (!usuarioId) {
        const [rows] = await connection.query('SELECT id FROM usuarios LIMIT 1');
        if (rows.length > 0) {
          usuarioId = rows[0].id;
        }
      }
      
      // Si definitivamente no hay usuarios, saltar este registro
      if (!usuarioId) {
        errores++;
        continue;
      }
      
      // Preparar datos
      const accion = row['TIPIFICACION FINAL'] || 'Gestión importada';
      
      const descripcionPartes = [];
      if (row['COMENTARIO ASESOR']) descripcionPartes.push(`Comentario: ${row['COMENTARIO ASESOR']}`);
      if (row['TIPIFICACION BACK']) descripcionPartes.push(`Tipificación Back: ${row['TIPIFICACION BACK']}`);
      if (row['CAMPAÑA']) descripcionPartes.push(`Campaña: ${row['CAMPAÑA']}`);
      if (row['COMENTARIO GESTIÓN 2']) descripcionPartes.push(`Gestión 2: ${row['COMENTARIO GESTIÓN 2']}`);
      
      const descripcion = descripcionPartes.length > 0 ? descripcionPartes.join(' | ') : 'Gestión importada';
      const estadoAnterior = row['TIPIFICACION BACK'] || 'Importado';
      const estadoNuevo = accion;
      
      // Insertar
      await connection.query(
        `INSERT INTO historial_cliente 
        (cliente_id, usuario_id, accion, descripcion, estado_anterior, estado_nuevo)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [clienteId, usuarioId, accion, descripcion, estadoAnterior, estadoNuevo]
      );
      
      insertados++;
      
      if (insertados % 1000 === 0) {
        log(`   ⏳ Insertados: ${insertados.toLocaleString()}/${data.length.toLocaleString()}`);
      }
      
    } catch (error) {
      log(`   ⚠️ Error en fila ${i}: ${error.message}`);
      errores++;
    }
  }
  
  log(`\n✅ IMPORTACIÓN HISTORIAL COMPLETADA:`);
  log(`   Total insertados: ${insertados.toLocaleString()}`);
  log(`   Sin cliente_id: ${sinClienteId.toLocaleString()}`);
  log(`   Errores: ${errores}`);
  log(`   Backup: ${backup}`);
  
  return { insertados, sinClienteId, errores, backup };
}

async function verificarImportacion(connection) {
  log(`\n${'='.repeat(80)}`);
  log('VERIFICACIÓN FINAL');
  log('='.repeat(80));
  
  // Contar clientes
  const [clientes] = await connection.query('SELECT COUNT(*) as total FROM clientes');
  log(`\n📊 Total clientes en BD: ${clientes[0].total.toLocaleString()}`);
  
  // Contar historial
  const [historial] = await connection.query('SELECT COUNT(*) as total FROM historial_cliente');
  log(`📊 Total registros historial: ${historial[0].total.toLocaleString()}`);
  
  // Últimos 5 clientes
  const [ultimos] = await connection.query(`
    SELECT id, nombre, telefono, dni 
    FROM clientes 
    ORDER BY id DESC 
    LIMIT 5
  `);
  
  log('\n👥 Últimos 5 clientes:');
  ultimos.forEach(c => {
    log(`   ID ${c.id}: ${c.nombre} | Tel: ${c.telefono} | DNI: ${c.dni || 'N/A'}`);
  });
  
  // Últimas 5 gestiones
  const [gestiones] = await connection.query(`
    SELECT h.id, h.cliente_id, c.nombre, h.accion, h.created_at
    FROM historial_cliente h
    JOIN clientes c ON h.cliente_id = c.id
    ORDER BY h.id DESC
    LIMIT 5
  `);
  
  log('\n📝 Últimas 5 gestiones:');
  gestiones.forEach(g => {
    log(`   ID ${g.id}: Cliente ${g.cliente_id} (${g.nombre}) - ${g.accion} - ${g.created_at}`);
  });
}

async function ejecutar() {
  let connection;
  
  try {
    log('🚀 INICIANDO REEMPLAZO COMPLETO DE TABLAS');
    log(`⏰ Fecha: ${new Date().toLocaleString()}\n`);
    
    // Conectar
    log('Conectando a base de datos...');
    connection = await mysql.createConnection(DB_CONFIG);
    log('✅ Conexión exitosa');
    
    // Importar clientes
    const resultClientes = await importarClientes(
      connection,
      'C:/Users/USER/Desktop/ARCHIVOS/clientes (updated) 2.xlsx'
    );
    
    // Reparar foreign keys antes de importar historial
    await repararForeignKeys(connection);
    
    // Importar historial
    const resultHistorial = await importarHistorial(
      connection,
      'C:/Users/USER/Desktop/ARCHIVOS/aña2.xlsx'
    );
    
    // Verificar
    await verificarImportacion(connection);
    
    log(`\n${'='.repeat(80)}`);
    log('✅ PROCESO COMPLETADO EXITOSAMENTE');
    log('='.repeat(80));
    log(`📄 Log guardado en: ${logFile}`);
    
  } catch (error) {
    log(`\n❌ ERROR CRÍTICO: ${error.message}`);
    log(error.stack);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
ejecutar().catch(console.error);
