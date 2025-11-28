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

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const logFile = path.join(logsDir, `importacion_final_${new Date().toISOString().replace(/:/g, '-').slice(0, 19)}.log`);

function log(mensaje) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const linea = `[${timestamp}] ${mensaje}`;
  console.log(linea);
  fs.appendFileSync(logFile, linea + '\n');
}

function convertirFecha(valor) {
  if (!valor) return null;
  try {
    if (typeof valor === 'number') {
      const fecha = XLSX.SSF.parse_date_code(valor);
      return `${fecha.y}-${String(fecha.m).padStart(2, '0')}-${String(fecha.d).padStart(2, '0')} ${String(fecha.H || 0).padStart(2, '0')}:${String(fecha.M || 0).padStart(2, '0')}:${String(fecha.S || 0).padStart(2, '0')}`;
    }
    if (typeof valor === 'string') {
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

function val(valor, tipo = 'string') {
  if (valor === null || valor === undefined || valor === '') return null;
  if (tipo === 'fecha') return convertirFecha(valor);
  if (tipo === 'numero') return parseFloat(valor) || null;
  if (tipo === 'entero') return parseInt(valor) || null;
  if (tipo === 'boolean') return valor ? 1 : 0;
  return String(valor);
}

async function ejecutarImportacion() {
  let connection;
  
  try {
    log('🚀 INICIANDO IMPORTACIÓN COMPLETA DE BD');
    log(`⏰ Fecha: ${new Date().toLocaleString()}\n`);
    
    connection = await mysql.createConnection(DB_CONFIG);
    log('✅ Conectado a MySQL');
    
    // ==================== IMPORTAR CLIENTES ====================
    log('\n' + '='.repeat(80));
    log('PASO 1: IMPORTACIÓN DE CLIENTES');
    log('='.repeat(80));
    
    const workbookClientes = XLSX.readFile('C:/Users/USER/Desktop/ARCHIVOS/clientes (updated) 2.xlsx');
    const dataClientes = XLSX.utils.sheet_to_json(workbookClientes.Sheets[workbookClientes.SheetNames[0]]);
    log(`📖 Excel clientes leído: ${dataClientes.length.toLocaleString()} filas`);
    
    // Backup clientes
    const backupClientes = `clientes_backup_${Date.now()}`;
    await connection.query(`CREATE TABLE ${backupClientes} LIKE clientes`);
    await connection.query(`INSERT INTO ${backupClientes} SELECT * FROM clientes`);
    const [countBackup] = await connection.query(`SELECT COUNT(*) as total FROM ${backupClientes}`);
    log(`📦 Backup creado: ${backupClientes} (${countBackup[0].total.toLocaleString()} registros)`);
    
    // Vaciar clientes
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE clientes');
    log('🗑️ Tabla clientes vaciada');
    
    // Insertar clientes en lotes
    log('📝 Insertando clientes...');
    let insertadosClientes = 0;
    const batchSize = 500;
    
    for (let i = 0; i < dataClientes.length; i += batchSize) {
      const batch = dataClientes.slice(i, i + batchSize);
      const valores = batch.map(r => [
        val(r.id, 'entero'),
        val(r.nombre) || 'SIN NOMBRE',
        val(r.tipo_base),
        val(r.leads_original_telefono),
        val(r.campana),
        val(r.canal_adquisicion),
        val(r.sala_asignada),
        val(r.compania),
        val(r.back_office_info),
        val(r.tipificacion_back),
        r.datos_leads ? JSON.stringify(r.datos_leads) : null,
        val(r.comentarios_back),
        convertirFecha(r.ultima_fecha_gestion),
        val(r.telefono) || val(r.leads_original_telefono) || 'SIN_TELEFONO',
        convertirFecha(r.fecha_ultimo_contacto),
        val(r.notas),
        convertirFecha(r.created_at),
        convertirFecha(r.updated_at),
        (val(r.tipo_cliente_wizard) === 'nuevo' || val(r.tipo_cliente_wizard) === 'antiguo') ? val(r.tipo_cliente_wizard) : null,
        val(r.lead_score),
        val(r.telefono_registro),
        convertirFecha(r.fecha_nacimiento),
        val(r.dni_nombre_titular),
        val(r.parentesco_titular),
        val(r.telefono_referencia_wizard),
        val(r.telefono_grabacion_wizard),
        val(r.direccion_completa),
        val(r.numero_piso_wizard),
        val(r.tipo_plan),
        val(r.servicio_contratado),
        val(r.velocidad_contratada),
        val(r.precio_plan, 'numero'),
        val(r.dispositivos_adicionales_wizard),
        val(r.plataforma_digital_wizard),
        (val(r.pago_adelanto_instalacion_wizard) === 'SI' || val(r.pago_adelanto_instalacion_wizard) === 'NO') ? val(r.pago_adelanto_instalacion_wizard) : null,
        val(r.wizard_completado, 'entero') || 0,
        convertirFecha(r.fecha_wizard_completado),
        r.wizard_data_json ? JSON.stringify(r.wizard_data_json) : null,
        val(r.dni),
        val(r.asesor_asignado, 'entero'),
        val(r.validador_asignado, 'entero'),
        convertirFecha(r.fecha_asignacion_validador),
        val(r.estatus_wizard),
        val(r.seguimiento_status),
        convertirFecha(r.derivado_at),
        convertirFecha(r.opened_at),
        convertirFecha(r.last_activity),
        val(r.estatus_comercial_categoria),
        val(r.estatus_comercial_subcategoria),
        val(r.quality_status),
        convertirFecha(r.returned_at),
        val(r.es_duplicado, 'entero') || 0,
        val(r.telefono_principal_id, 'entero'),
        val(r.cantidad_duplicados, 'entero') || 1,
        val(r.tipificacion_original)
      ]);
      
      await connection.query(`
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
      `, [valores]);
      
      insertadosClientes += batch.length;
      if (insertadosClientes % 2000 === 0) {
        log(`   ⏳ Insertados: ${insertadosClientes.toLocaleString()}/${dataClientes.length.toLocaleString()}`);
      }
    }
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    log(`✅ Clientes insertados: ${insertadosClientes.toLocaleString()}`);
    
    // ==================== REPARAR FOREIGN KEYS ====================
    log('\n' + '='.repeat(80));
    log('PASO 2: REPARAR FOREIGN KEYS');
    log('='.repeat(80));
    
    const [fks] = await connection.query(`
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'historial_cliente' 
      AND COLUMN_NAME = 'cliente_id'
      AND CONSTRAINT_NAME != 'PRIMARY'
    `);
    
    if (fks.length > 0 && fks[0].REFERENCED_TABLE_NAME !== 'clientes') {
      log(`⚠️ FK incorrecta apunta a: ${fks[0].REFERENCED_TABLE_NAME}`);
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query(`ALTER TABLE historial_cliente DROP FOREIGN KEY ${fks[0].CONSTRAINT_NAME}`);
      await connection.query(`
        ALTER TABLE historial_cliente 
        ADD CONSTRAINT historial_cliente_ibfk_1 
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
      `);
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      log('✅ FK reparada: historial_cliente -> clientes');
    } else {
      log('✅ FK correcta');
    }
    
    // ==================== IMPORTAR HISTORIAL ====================
    log('\n' + '='.repeat(80));
    log('PASO 3: IMPORTACIÓN DE HISTORIAL');
    log('='.repeat(80));
    
    const workbookHistorial = XLSX.readFile('C:/Users/USER/Desktop/ARCHIVOS/aña2.xlsx');
    const dataHistorial = XLSX.utils.sheet_to_json(workbookHistorial.Sheets[workbookHistorial.SheetNames[0]]);
    log(`📖 Excel historial leído: ${dataHistorial.length.toLocaleString()} filas`);
    
    // Backup historial
    const backupHistorial = `historial_backup_${Date.now()}`;
    await connection.query(`CREATE TABLE ${backupHistorial} LIKE historial_cliente`);
    await connection.query(`INSERT INTO ${backupHistorial} SELECT * FROM historial_cliente`);
    const [countBackupH] = await connection.query(`SELECT COUNT(*) as total FROM ${backupHistorial}`);
    log(`📦 Backup creado: ${backupHistorial} (${countBackupH[0].total.toLocaleString()} registros)`);
    
    // Vaciar historial
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE historial_cliente');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    log('🗑️ Tabla historial_cliente vaciada');
    
    // Obtener un usuario válido por defecto
    const [usuarios] = await connection.query('SELECT id FROM usuarios LIMIT 1');
    const usuarioDefault = usuarios.length > 0 ? usuarios[0].id : 1;
    log(`👤 Usuario por defecto: ID ${usuarioDefault}`);
    
    // Insertar historial
    log('📝 Procesando registros de historial...');
    let insertadosHistorial = 0;
    let sinCliente = 0;
    let errores = 0;
    
    for (let i = 0; i < dataHistorial.length; i++) {
      const row = dataHistorial[i];
      
      try {
        // Buscar cliente_id
        let clienteId = null;
        
        if (row.DNI) {
          const [rows] = await connection.query(
            'SELECT id FROM clientes WHERE dni = ? LIMIT 1',
            [String(row.DNI).trim()]
          );
          if (rows.length > 0) clienteId = rows[0].id;
        }
        
        if (!clienteId && row.LEADS) {
          const telefono = String(row.LEADS).trim();
          const [rows] = await connection.query(
            'SELECT id FROM clientes WHERE telefono = ? OR telefono LIKE ? LIMIT 1',
            [telefono, `%${telefono}%`]
          );
          if (rows.length > 0) clienteId = rows[0].id;
        }
        
        if (!clienteId) {
          sinCliente++;
          continue;
        }
        
        // Usuario ID
        let usuarioId = usuarioDefault;
        if (row['AS.FINAL']) {
          const [rows] = await connection.query(
            'SELECT id FROM usuarios WHERE nombre LIKE ? LIMIT 1',
            [`%${String(row['AS.FINAL']).trim()}%`]
          );
          if (rows.length > 0) usuarioId = rows[0].id;
        }
        
        // Acción y descripción
        const accion = row['TIPIFICACION FINAL'] || row['TIPI FIN'] || 'Gestión importada';
        
        const descripcionPartes = [];
        if (row['COMENTARIO ASESOR']) descripcionPartes.push(`Comentario: ${row['COMENTARIO ASESOR']}`);
        if (row['TIPIFICACION BACK']) descripcionPartes.push(`Back: ${row['TIPIFICACION BACK']}`);
        if (row['CAMPAÑA']) descripcionPartes.push(`Campaña: ${row['CAMPAÑA']}`);
        if (row['COMENTARIO GESTIÓN 2']) descripcionPartes.push(`Gestión 2: ${row['COMENTARIO GESTIÓN 2']}`);
        if (row['2DA TIPIFICACION FINAL']) descripcionPartes.push(`2da Tipif: ${row['2DA TIPIFICACION FINAL']}`);
        
        const descripcion = descripcionPartes.length > 0 ? descripcionPartes.join(' | ') : 'Gestión importada desde Excel';
        const estadoAnterior = row['TIPIFICACION BACK'] || 'Importado';
        const estadoNuevo = accion;
        
        await connection.query(
          `INSERT INTO historial_cliente 
          (cliente_id, usuario_id, accion, descripcion, estado_anterior, estado_nuevo)
          VALUES (?, ?, ?, ?, ?, ?)`,
          [clienteId, usuarioId, accion, descripcion, estadoAnterior, estadoNuevo]
        );
        
        insertadosHistorial++;
        
        if (insertadosHistorial % 1000 === 0) {
          log(`   ⏳ Insertados: ${insertadosHistorial.toLocaleString()}/${dataHistorial.length.toLocaleString()}`);
        }
        
      } catch (error) {
        errores++;
        if (errores <= 10) {
          log(`   ⚠️ Error fila ${i}: ${error.message}`);
        }
      }
    }
    
    log(`✅ Historial insertado: ${insertadosHistorial.toLocaleString()}`);
    log(`⚠️ Sin cliente_id: ${sinCliente.toLocaleString()}`);
    log(`❌ Errores: ${errores}`);
    
    // ==================== VERIFICACIÓN FINAL ====================
    log('\n' + '='.repeat(80));
    log('VERIFICACIÓN FINAL');
    log('='.repeat(80));
    
    const [totalClientes] = await connection.query('SELECT COUNT(*) as total FROM clientes');
    const [totalHistorial] = await connection.query('SELECT COUNT(*) as total FROM historial_cliente');
    
    log(`\n📊 Total clientes: ${totalClientes[0].total.toLocaleString()}`);
    log(`📊 Total historial: ${totalHistorial[0].total.toLocaleString()}`);
    
    const [ultimos] = await connection.query('SELECT id, nombre, telefono FROM clientes ORDER BY id DESC LIMIT 5');
    log('\n👥 Últimos 5 clientes:');
    ultimos.forEach(c => log(`   ID ${c.id}: ${c.nombre} | ${c.telefono}`));
    
    log('\n' + '='.repeat(80));
    log('✅ IMPORTACIÓN COMPLETADA EXITOSAMENTE');
    log('='.repeat(80));
    log(`📄 Log guardado en: ${logFile}`);
    
  } catch (error) {
    log(`\n❌ ERROR CRÍTICO: ${error.message}`);
    log(error.stack);
  } finally {
    if (connection) {
      await connection.end();
      log('\n🔌 Conexión cerrada');
    }
  }
}

ejecutarImportacion().catch(console.error);
