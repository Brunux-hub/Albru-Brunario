const pool = require('../config/database');
const webSocketService = require('../services/WebSocketService');

// Helper: convertir fecha ISO/DATETIME a DATE (YYYY-MM-DD)
const convertToDateOnly = (isoDate) => {
  if (!isoDate) return null;
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch (e) {
    console.warn('convertToDateOnly failed for', isoDate, e && e.message);
    return null;
  }
};

// GET /api/clientes/telefono/:telefono
const getClienteByTelefono = async (req, res) => {
  const { telefono } = req.params;
  if (!telefono) return res.status(400).json({ success:false, message: 'telefono requerido' });

  try {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE telefono = ? LIMIT 1', [telefono]);
    if (!rows || rows.length === 0) return res.status(404).json({ success:false, message: 'Cliente no encontrado' });
    return res.json({ success: true, cliente: rows[0] });
  } catch (err) {
    console.error('Error getClienteByTelefono', err);
    return res.status(500).json({ success:false, message: 'Error interno' });
  }
};

// GET /api/clientes/dni/:dni
const getClienteByDni = async (req, res) => {
  const { dni } = req.params;
  if (!dni) return res.status(400).json({ success:false, message: 'DNI requerido' });

  try {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE dni = ? LIMIT 1', [dni]);
    if (!rows || rows.length === 0) return res.status(404).json({ success:false, message: 'Cliente no encontrado' });
    return res.json({ success: true, cliente: rows[0] });
  } catch (err) {
    console.error('Error getClienteByDni', err);
    return res.status(500).json({ success:false, message: 'Error interno' });
  }
};

// GET /api/clientes/search?term=..&page=1&limit=20
const searchClientes = async (req, res) => {
  const term = (req.query.term || '').trim();
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  if (!term) return res.status(400).json({ success:false, message: 'term requerido' });

  const offset = (page - 1) * limit;
  const like = `%${term}%`;
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, telefono, dni, estado, ocupacion
       FROM clientes
       WHERE nombre LIKE ? OR dni LIKE ? OR telefono LIKE ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [like, like, like, limit, offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM clientes WHERE nombre LIKE ? OR dni LIKE ? OR telefono LIKE ?`,
      [like, like, like]
    );
    const total = countRows[0].total || 0;
    return res.json({ success:true, items: rows, page, limit, total });
  } catch (err) {
    console.error('Error searchClientes', err);
    return res.status(500).json({ success:false, message: 'Error interno' });
  }
};

// GET /api/clientes (obtener todos los clientes)
const getAllClientes = async (req, res) => {
  try {
    const limit = Math.min(50000, Number(req.query.limit) || 500);
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const orderBy = req.query.orderBy === 'asc' ? 'ASC' : 'DESC'; // Ordenar por fecha
    
    // Compatibilidad: en distintas partes del sistema el campo `asesor_asignado`
    // puede contener el id de la tabla `asesores` o directamente el id en `usuarios`.
    // Para evitar que el nombre del asesor no aparezca al recargar, intentamos
    // obtener el nombre desde ambos orígenes y usar el primero disponible.
    // Seleccionamos todos los campos de clientes y resolvemos el nombre del asesor
    // usando la columna `asesor_asignado` (puede apuntar a `usuarios.id` o a `asesores.id`).
    // Comprobar si la tabla clientes tiene la columna 'estado' o 'wizard_data_json'
    const dbName = process.env.DB_NAME || 'albru';
    const [cols] = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes'", [dbName]);
    const colSet = new Set(cols.map(c => c.COLUMN_NAME));

    // NO excluir clientes gestionados - GTR necesita ver el historial completo
    // Anteriormente se excluían clientes con estado='gestionado', pero ahora
    // el GTR debe poder ver todos los clientes incluyendo los ya gestionados
    const whereClause = ''; // Sin filtro - mostrar todos los clientes

    // Obtener total de clientes para paginación
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM clientes');

    const sql = `
      SELECT
        c.*,
        u.nombre AS asesor_nombre
      FROM clientes c
      LEFT JOIN usuarios u ON c.asesor_asignado = u.id AND u.tipo = 'asesor'
      ${whereClause}
      ORDER BY c.created_at ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(sql, [limit, offset]);
    
    console.log(`📋 Obteniendo ${rows.length} clientes (${offset + 1}-${offset + rows.length} de ${total})`);
    
    // Cargar historial para cada cliente (optimizado con una sola query)
    if (rows.length > 0) {
      const clienteIds = rows.map(r => r.id);
      
      try {
        const [historialRows] = await pool.query(`
          SELECT 
            h.cliente_id,
            h.id,
            h.created_at as fecha,
            h.tipo,
            h.estado_anterior as estadoAnterior,
            h.estado_nuevo as estadoNuevo,
            h.comentarios,
            u.nombre as asesor
          FROM historial_estados h
          LEFT JOIN usuarios u ON h.usuario_id = u.id
          WHERE h.cliente_id IN (?)
          ORDER BY h.created_at DESC
        `, [clienteIds]);
        
        // Agrupar historial por cliente_id
        const historialPorCliente = {};
        historialRows.forEach(h => {
          if (!historialPorCliente[h.cliente_id]) {
            historialPorCliente[h.cliente_id] = [];
          }
          historialPorCliente[h.cliente_id].push({
            fecha: new Date(h.fecha).toLocaleString('es-PE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            asesor: h.asesor || 'Sistema',
            accion: h.tipo === 'reasignacion' ? 'Reasignación' : 
                    h.tipo === 'asesor' ? 'Gestión de Asesor' :
                    h.tipo === 'estatus' ? 'Cambio de Estatus' :
                    h.tipo === 'wizard' ? 'Completó Wizard' :
                    h.comentarios || 'Cambio de Estado',
            estadoAnterior: h.estadoAnterior,
            estadoNuevo: h.estadoNuevo,
            comentarios: h.comentarios || ''
          });
        });
        
        // Asignar historial a cada cliente
        rows.forEach(cliente => {
          cliente.historial = historialPorCliente[cliente.id] || [];
        });
        
        console.log(`📋 Historial cargado para ${Object.keys(historialPorCliente).length} clientes`);
      } catch (histErr) {
        console.warn('⚠️ No se pudo cargar historial_estados:', histErr.message);
        // Si falla, dejar historial vacío
        rows.forEach(cliente => {
          cliente.historial = [];
        });
      }
    }
    
    // Deshabilitar caché para evitar que el navegador use datos antiguos (304)
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    return res.json({ success: true, clientes: rows, total: total, showing: rows.length });
  } catch (err) {
    console.error('Error getAllClientes', err);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

// GET /api/clientes/:id
const getClienteById = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ success:false, message: 'id inválido' });
  try {
    // Intentamos devolver también el nombre del asesor si la columna existe y está poblada
    const [rows] = await pool.query(`
      SELECT c.*, u.nombre AS asesor_nombre
      FROM clientes c
      LEFT JOIN usuarios u ON c.asesor_asignado = u.id AND u.tipo = 'asesor'
      WHERE c.id = ?
      LIMIT 1
    `, [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ success:false, message: 'Cliente no encontrado' });
    
    const cliente = rows[0];
    
    // Cargar historial desde historial_estados si existe
    try {
      const [historial] = await pool.query(`
        SELECT 
          h.id,
          h.created_at as fecha,
          h.tipo,
          h.estado_anterior as estadoAnterior,
          h.estado_nuevo as estadoNuevo,
          h.comentarios,
          u.nombre as asesor
        FROM historial_estados h
        LEFT JOIN usuarios u ON h.usuario_id = u.id
        WHERE h.cliente_id = ?
        ORDER BY h.created_at DESC
      `, [id]);
      
      // Formatear historial con acciones más descriptivas
      cliente.historial = historial.map(h => ({
        fecha: new Date(h.fecha).toLocaleString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        asesor: h.asesor || 'Sistema',
        accion: h.tipo === 'reasignacion' ? 'Reasignación' : 
                h.tipo === 'asesor' ? 'Gestión de Asesor' :
                h.tipo === 'estatus' ? 'Cambio de Estatus' :
                h.tipo === 'wizard' ? 'Completó Wizard' :
                h.comentarios || 'Cambio de Estado',
        estadoAnterior: h.estadoAnterior,
        estadoNuevo: h.estadoNuevo,
        comentarios: h.comentarios || ''
      }));
      
      console.log(`📋 Historial cargado para cliente ${id}: ${historial.length} eventos`);
    } catch (histErr) {
      console.warn('⚠️ No se pudo cargar historial_estados:', histErr.message);
      cliente.historial = [];
    }
    
    return res.json({ success:true, cliente });
  } catch (err) {
    console.error('Error getClienteById', err);
    return res.status(500).json({ success:false, message: 'Error interno' });
  }
};

// POST /api/clientes (crear nuevo cliente)
const createCliente = async (req, res) => {
  const { 
    // Campos básicos del CRM
    nombre, apellidos, telefono, dni, email, direccion, ciudad,
    edad, genero, estado_civil, ocupacion, ingresos_mensuales,
    asesor_asignado, observaciones_asesor,
    
    // Campos específicos del wizard
    tipo_cliente_wizard, lead_score, telefono_registro, fecha_nacimiento,
    dni_nombre_titular, parentesco_titular, telefono_referencia_wizard, telefono_grabacion_wizard,
    direccion_completa, numero_piso_wizard, tipo_plan, servicio_contratado, velocidad_contratada,
    precio_plan, dispositivos_adicionales_wizard, plataforma_digital_wizard,
    pago_adelanto_instalacion_wizard, wizard_completado, wizard_data_json,
    
    // Campos de leads/back office
    tipo_base, leads_original_telefono, campana, canal_adquisicion, sala_asignada, compania,
    back_office_info, tipificacion_back, datos_leads, comentarios_back, ultima_fecha_gestion,
    coordenadas, estatus_comercial_categoria, estatus_comercial_subcategoria
  } = req.body;

  // Validación básica: teléfono es obligatorio
  if (!telefono) {
    return res.status(400).json({ 
      success: false, 
      message: 'Teléfono es obligatorio' 
    });
  }

  try {
    console.log('📋 Backend: Creando cliente con datos del wizard:', {
      nombre, apellidos, telefono, tipo_cliente_wizard, lead_score, wizard_completado
    });
    // Asegurar que 'nombre' no sea NULL si la columna tiene restricción NOT NULL en la BD
    const safeNombre = nombre || telefono || '';

    // Verificar duplicados solo si los campos tienen valor
    if (dni) {
      const [existingByDni] = await pool.query('SELECT id FROM clientes WHERE dni = ? LIMIT 1', [dni]);
      if (existingByDni.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'Ya existe un cliente con este DNI' 
        });
      }
    }

    const [existingByPhone] = await pool.query('SELECT id FROM clientes WHERE telefono = ? LIMIT 1', [telefono]);
    if (existingByPhone.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ya existe un cliente con este teléfono' 
      });
    }

    // Construir INSERT dinámico según columnas realmente presentes en la tabla `clientes`
    const dbName = process.env.DB_NAME || 'albru';
    const [cols] = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes'", [dbName]);
    const colSet = new Set(cols.map(c => c.COLUMN_NAME));

    // Mapeo de posibles columnas a los valores que queremos insertar
    const candidateColumns = {
      nombre: safeNombre,
      apellidos: apellidos || null,
      telefono: telefono,
      dni: dni || null,
      email: email || null,
      direccion: direccion || null,
      ciudad: ciudad || null,
      edad: edad || null,
      genero: genero || null,
      estado_civil: estado_civil || null,
      ocupacion: ocupacion || null,
      ingresos_mensuales: ingresos_mensuales || null,
      asesor_asignado: asesor_asignado || null,
      observaciones_asesor: observaciones_asesor || null,
      estado: 'nuevo',
      tipo_cliente_wizard: tipo_cliente_wizard || null,
      lead_score: lead_score || null,
  telefono_registro: telefono_registro || null,
  // Convertir fecha de nacimiento a DATE si viene en ISO/DATETIME
  fecha_nacimiento: fecha_nacimiento ? convertToDateOnly(fecha_nacimiento) : null,
      dni_nombre_titular: dni_nombre_titular || null,
      parentesco_titular: parentesco_titular || null,
      telefono_referencia_wizard: telefono_referencia_wizard || null,
      telefono_grabacion_wizard: telefono_grabacion_wizard || null,
      direccion_completa: direccion_completa || null,
      numero_piso_wizard: numero_piso_wizard || null,
      tipo_plan: tipo_plan || null,
      servicio_contratado: servicio_contratado || null,
      velocidad_contratada: velocidad_contratada || null,
      precio_plan: precio_plan || null,
      dispositivos_adicionales_wizard: dispositivos_adicionales_wizard || null,
      plataforma_digital_wizard: plataforma_digital_wizard || null,
      pago_adelanto_instalacion_wizard: pago_adelanto_instalacion_wizard || null,
      wizard_completado: wizard_completado ? 1 : 0,
      fecha_wizard_completado: wizard_completado ? new Date() : null,
      wizard_data_json: wizard_data_json ? JSON.stringify(wizard_data_json) : null,
      estatus_wizard: req.body && req.body.estatus_wizard ? req.body.estatus_wizard : null,
      
      // Campos de leads/back office
      tipo_base: tipo_base || null,
      leads_original_telefono: leads_original_telefono || telefono || null,
      campana: campana || null,
      canal_adquisicion: canal_adquisicion || null,
      sala_asignada: sala_asignada || null,
      compania: compania || null,
      back_office_info: back_office_info || null,
      tipificacion_back: tipificacion_back || null,
      datos_leads: datos_leads || null,
      comentarios_back: comentarios_back || null,
      ultima_fecha_gestion: ultima_fecha_gestion || null,
      coordenadas: coordenadas || null,
      estatus_comercial_categoria: estatus_comercial_categoria || null,
      estatus_comercial_subcategoria: estatus_comercial_subcategoria || null
    };

    const insertCols = [];
    const insertPlaceholders = [];
    const insertValues = [];

    for (const [col, val] of Object.entries(candidateColumns)) {
      if (colSet.has(col)) {
        insertCols.push(col);
        insertPlaceholders.push('?');
        insertValues.push(val);
      }
    }

    if (insertCols.length === 0) {
      // Como fallback, al menos insertar telefono y nombre en columnas conocidas
      const [fallbackCols] = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes' AND COLUMN_NAME IN ('telefono','nombre')", [dbName]);
      const fallbackSet = new Set(fallbackCols.map(c => c.COLUMN_NAME));
      if (fallbackSet.has('telefono')) { insertCols.push('telefono'); insertPlaceholders.push('?'); insertValues.push(telefono); }
      if (fallbackSet.has('nombre')) { insertCols.push('nombre'); insertPlaceholders.push('?'); insertValues.push(safeNombre); }
    }

    const insertSql = `INSERT INTO clientes (${insertCols.join(', ')}) VALUES (${insertPlaceholders.join(', ')})`;
    const [result] = await pool.query(insertSql, insertValues);

    // Obtener el cliente recién creado
    const [newClient] = await pool.query('SELECT * FROM clientes WHERE id = ?', [result.insertId]);
    
    console.log(`✅ Cliente creado con ID: ${result.insertId}`);
    return res.status(201).json({ 
      success: true, 
      message: 'Cliente creado exitosamente',
      cliente: newClient[0]
    });

  } catch (err) {
    console.error('Error createCliente', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: err.message 
    });
  }
};

// PUT /api/clientes/:id (actualizar cliente existente)
const updateCliente = async (req, res) => {
  const { id } = req.params;
  const { 
    // Campos básicos del CRM
    nombre, apellidos, telefono, dni, email, direccion, ciudad,
    edad, genero, estado_civil, ocupacion, ingresos_mensuales,
    asesor_asignado, observaciones_asesor,
    
    // Campos específicos del wizard
    tipo_cliente_wizard, lead_score, coordenadas, tipo_documento, lugar_nacimiento,
    telefono_registro, fecha_nacimiento, departamento, distrito, correo_electronico,
    dni_nombre_titular, parentesco_titular, telefono_referencia_wizard, telefono_grabacion_wizard,
    direccion_completa, numero_piso_wizard, tipo_plan, servicio_contratado, velocidad_contratada,
    precio_plan, dispositivos_adicionales_wizard, plataforma_digital_wizard,
    pago_adelanto_instalacion_wizard, wizard_completado, wizard_data_json,
    
    // Nuevos campos: estatus comercial
    estatus_comercial_categoria, estatus_comercial_subcategoria
  } = req.body;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID de cliente es obligatorio' 
    });
  }

  try {
    console.log('📋 Backend: Actualizando cliente ID:', id, 'con datos del wizard:', {
      nombre, apellidos, telefono, tipo_cliente_wizard, lead_score, wizard_completado,
      estatus_comercial_categoria, estatus_comercial_subcategoria
    });

    // Usar helper global convertToDateOnly definido al inicio del archivo

    // Obtener los datos actuales del cliente
    const [currentClient] = await pool.query('SELECT * FROM clientes WHERE id = ? LIMIT 1', [id]);
    if (currentClient.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }

    const clienteActual = currentClient[0];

    // Verificar duplicados de DNI si se está actualizando
    if (dni && dni !== clienteActual.dni) {
      const [existingByDni] = await pool.query('SELECT id FROM clientes WHERE dni = ? AND id != ? LIMIT 1', [dni, id]);
      if (existingByDni.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'Ya existe otro cliente con este DNI' 
        });
      }
    }

    // Verificar duplicados de teléfono si se está actualizando
    if (telefono && telefono !== clienteActual.telefono) {
      const [existingByPhone] = await pool.query('SELECT id FROM clientes WHERE telefono = ? AND id != ? LIMIT 1', [telefono, id]);
      if (existingByPhone.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'Ya existe otro cliente con este teléfono' 
        });
      }
    }

    // Crear objeto con datos actualizados (mantener valores actuales si no se envían nuevos)
    const datosActualizados = {
      // Garantizar fallback: si no hay nombre nuevo ni nombre actual, usar teléfono o cadena vacía
      nombre: nombre !== undefined ? nombre : (clienteActual.nombre || clienteActual.telefono || ''),
      apellidos: apellidos !== undefined ? apellidos : clienteActual.apellidos,
      telefono: telefono !== undefined ? telefono : clienteActual.telefono,
      dni: dni !== undefined ? dni : clienteActual.dni,
      email: email !== undefined ? email : clienteActual.email,
      direccion: direccion !== undefined ? direccion : clienteActual.direccion,
      ciudad: ciudad !== undefined ? ciudad : clienteActual.ciudad,
      edad: edad !== undefined ? edad : clienteActual.edad,
      genero: genero !== undefined ? genero : clienteActual.genero,
      estado_civil: estado_civil !== undefined ? estado_civil : clienteActual.estado_civil,
      ocupacion: ocupacion !== undefined ? ocupacion : clienteActual.ocupacion,
      ingresos_mensuales: ingresos_mensuales !== undefined ? ingresos_mensuales : clienteActual.ingresos_mensuales,
      asesor_asignado: asesor_asignado !== undefined ? asesor_asignado : clienteActual.asesor_asignado,
      observaciones_asesor: observaciones_asesor !== undefined ? observaciones_asesor : clienteActual.observaciones_asesor,
      // Campos del wizard - Paso 1
      tipo_cliente_wizard: tipo_cliente_wizard !== undefined ? tipo_cliente_wizard : clienteActual.tipo_cliente_wizard,
      lead_score: lead_score !== undefined ? lead_score : clienteActual.lead_score,
      coordenadas: coordenadas !== undefined ? coordenadas : clienteActual.coordenadas,
      tipo_documento: tipo_documento !== undefined ? tipo_documento : clienteActual.tipo_documento,
      // Campos del wizard - Paso 2
      telefono_registro: telefono_registro !== undefined ? telefono_registro : clienteActual.telefono_registro,
      fecha_nacimiento: fecha_nacimiento !== undefined ? convertToDateOnly(fecha_nacimiento) : clienteActual.fecha_nacimiento,
      lugar_nacimiento: lugar_nacimiento !== undefined ? lugar_nacimiento : clienteActual.lugar_nacimiento,
      departamento: departamento !== undefined ? departamento : clienteActual.departamento,
      distrito: distrito !== undefined ? distrito : clienteActual.distrito,
      correo_electronico: correo_electronico !== undefined ? correo_electronico : clienteActual.correo_electronico,
      dni_nombre_titular: dni_nombre_titular !== undefined ? dni_nombre_titular : clienteActual.dni_nombre_titular,
      parentesco_titular: parentesco_titular !== undefined ? parentesco_titular : clienteActual.parentesco_titular,
      telefono_referencia_wizard: telefono_referencia_wizard !== undefined ? telefono_referencia_wizard : clienteActual.telefono_referencia_wizard,
      telefono_grabacion_wizard: telefono_grabacion_wizard !== undefined ? telefono_grabacion_wizard : clienteActual.telefono_grabacion_wizard,
      direccion_completa: direccion_completa !== undefined ? direccion_completa : clienteActual.direccion_completa,
      numero_piso_wizard: numero_piso_wizard !== undefined ? numero_piso_wizard : clienteActual.numero_piso_wizard,
      // Campos del wizard - Paso 3
      tipo_plan: tipo_plan !== undefined ? tipo_plan : clienteActual.tipo_plan,
      servicio_contratado: servicio_contratado !== undefined ? servicio_contratado : clienteActual.servicio_contratado,
      velocidad_contratada: velocidad_contratada !== undefined ? velocidad_contratada : clienteActual.velocidad_contratada,
      precio_plan: precio_plan !== undefined ? precio_plan : clienteActual.precio_plan,
      // Campos del wizard - Paso 4
      dispositivos_adicionales_wizard: dispositivos_adicionales_wizard !== undefined ? dispositivos_adicionales_wizard : clienteActual.dispositivos_adicionales_wizard,
      plataforma_digital_wizard: plataforma_digital_wizard !== undefined ? plataforma_digital_wizard : clienteActual.plataforma_digital_wizard,
      pago_adelanto_instalacion_wizard: pago_adelanto_instalacion_wizard !== undefined ? pago_adelanto_instalacion_wizard : clienteActual.pago_adelanto_instalacion_wizard,
      wizard_completado: wizard_completado !== undefined ? (wizard_completado ? 1 : 0) : clienteActual.wizard_completado,
      wizard_data_json: wizard_data_json !== undefined ? (wizard_data_json ? JSON.stringify(wizard_data_json) : null) : (clienteActual.wizard_data_json ? (typeof clienteActual.wizard_data_json === 'string' ? clienteActual.wizard_data_json : JSON.stringify(clienteActual.wizard_data_json)) : null),
      // Nuevos campos: estatus comercial
      estatus_comercial_categoria: estatus_comercial_categoria !== undefined ? estatus_comercial_categoria : clienteActual.estatus_comercial_categoria,
      estatus_comercial_subcategoria: estatus_comercial_subcategoria !== undefined ? estatus_comercial_subcategoria : clienteActual.estatus_comercial_subcategoria
    };

    // Actualizar el cliente con datos combinados (construir UPDATE dinámico según columnas existentes)
    const dbName = process.env.DB_NAME || 'albru';
    const [cols] = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes'", [dbName]);
    const colSet = new Set(cols.map(c => c.COLUMN_NAME));

    const toUpdate = [];
    const values = [];

    const pushIfExists = (colName, val) => {
      if (colSet.has(colName)) {
        toUpdate.push(`${colName} = ?`);
        values.push(val);
      }
    };

    pushIfExists('nombre', datosActualizados.nombre);
    pushIfExists('apellidos', datosActualizados.apellidos);
    pushIfExists('telefono', datosActualizados.telefono);
    pushIfExists('dni', datosActualizados.dni);
    pushIfExists('email', datosActualizados.email);
    pushIfExists('direccion', datosActualizados.direccion);
    pushIfExists('ciudad', datosActualizados.ciudad);
    pushIfExists('edad', datosActualizados.edad);
    pushIfExists('genero', datosActualizados.genero);
    pushIfExists('estado_civil', datosActualizados.estado_civil);
    pushIfExists('ocupacion', datosActualizados.ocupacion);
    pushIfExists('ingresos_mensuales', datosActualizados.ingresos_mensuales);
    pushIfExists('asesor_asignado', datosActualizados.asesor_asignado);
    pushIfExists('observaciones_asesor', datosActualizados.observaciones_asesor);

    // Campos wizard
    pushIfExists('tipo_cliente_wizard', datosActualizados.tipo_cliente_wizard);
    pushIfExists('lead_score', datosActualizados.lead_score);
    pushIfExists('coordenadas', datosActualizados.coordenadas);
    pushIfExists('tipo_documento', datosActualizados.tipo_documento);
    pushIfExists('telefono_registro', datosActualizados.telefono_registro);
    pushIfExists('fecha_nacimiento', datosActualizados.fecha_nacimiento);
    pushIfExists('lugar_nacimiento', datosActualizados.lugar_nacimiento);
    pushIfExists('departamento', datosActualizados.departamento);
    pushIfExists('distrito', datosActualizados.distrito);
    pushIfExists('correo_electronico', datosActualizados.correo_electronico);
    pushIfExists('dni_nombre_titular', datosActualizados.dni_nombre_titular);
    pushIfExists('parentesco_titular', datosActualizados.parentesco_titular);
    pushIfExists('telefono_referencia_wizard', datosActualizados.telefono_referencia_wizard);
    pushIfExists('telefono_grabacion_wizard', datosActualizados.telefono_grabacion_wizard);
    pushIfExists('direccion_completa', datosActualizados.direccion_completa);
    pushIfExists('numero_piso_wizard', datosActualizados.numero_piso_wizard);
    pushIfExists('tipo_plan', datosActualizados.tipo_plan);
    pushIfExists('servicio_contratado', datosActualizados.servicio_contratado);
    pushIfExists('velocidad_contratada', datosActualizados.velocidad_contratada);
    pushIfExists('precio_plan', datosActualizados.precio_plan);
    pushIfExists('dispositivos_adicionales_wizard', datosActualizados.dispositivos_adicionales_wizard);
    pushIfExists('plataforma_digital_wizard', datosActualizados.plataforma_digital_wizard);
    pushIfExists('pago_adelanto_instalacion_wizard', datosActualizados.pago_adelanto_instalacion_wizard);
    pushIfExists('wizard_completado', datosActualizados.wizard_completado);
    pushIfExists('wizard_data_json', datosActualizados.wizard_data_json);
    pushIfExists('estatus_wizard', datosActualizados.estatus_wizard);
    
    // Campos estatus comercial
    pushIfExists('estatus_comercial_categoria', datosActualizados.estatus_comercial_categoria);
    pushIfExists('estatus_comercial_subcategoria', datosActualizados.estatus_comercial_subcategoria);

    // Siempre actualizar updated_at si la columna existe
    if (colSet.has('updated_at')) {
      toUpdate.push('updated_at = NOW()');
    }

    if (toUpdate.length > 0) {
      const updateSql = `UPDATE clientes SET ${toUpdate.join(', ')} WHERE id = ?`;
      values.push(id);
      await pool.query(updateSql, values);
    }

    // 🔥 NOTIFICACIÓN TIEMPO REAL: Estatus comercial actualizado
    if (estatus_comercial_categoria !== undefined || estatus_comercial_subcategoria !== undefined) {
      try {
        // Obtener nombre del asesor actual para el evento WebSocket
        let asesorNombre = null;
        let asesorId = null;
        if (clienteActual.asesor_asignado) {
          try {
            const [asesorRows] = await pool.query(
              `SELECT u.id, u.nombre AS nombre
               FROM usuarios u
               WHERE u.id = ? AND u.tipo = 'asesor' LIMIT 1`,
              [clienteActual.asesor_asignado]
            );
            if (asesorRows && asesorRows.length > 0) {
              asesorId = asesorRows[0].id;
              asesorNombre = asesorRows[0].nombre;
            }
          } catch (e) {
            console.warn('No se pudo obtener nombre del asesor para notificación:', e.message);
          }
        }

        // 📝 REGISTRAR CAMBIO EN HISTORIAL si la categoría o subcategoría cambió
        const categoriaAnterior = clienteActual.estatus_comercial_categoria;
        const subcategoriaAnterior = clienteActual.estatus_comercial_subcategoria;
        const categoriaNueva = datosActualizados.estatus_comercial_categoria;
        const subcategoriaNueva = datosActualizados.estatus_comercial_subcategoria;

        const hubocambio = (
          (categoriaAnterior !== categoriaNueva && categoriaNueva !== undefined) ||
          (subcategoriaAnterior !== subcategoriaNueva && subcategoriaNueva !== undefined)
        );

        if (hubocambio && asesorId) {
          try {
            const descripcionAnterior = categoriaAnterior 
              ? `${categoriaAnterior}${subcategoriaAnterior ? ' → ' + subcategoriaAnterior : ''}`
              : 'Sin estatus';
            const descripcionNueva = categoriaNueva 
              ? `${categoriaNueva}${subcategoriaNueva ? ' → ' + subcategoriaNueva : ''}`
              : 'Sin estatus';

            await pool.query(
              'INSERT INTO historial_cliente (cliente_id, usuario_id, accion, descripcion, estado_nuevo) VALUES (?, ?, ?, ?, ?)',
              [
                id,
                asesorId,
                'cambio_estatus',
                `Cambio de estatus: ${descripcionAnterior} → ${descripcionNueva}`,
                categoriaNueva || null
              ]
            );
            console.log('✅ Historial: Cambio de estatus comercial registrado para cliente', id);
          } catch (histErr) {
            console.warn('⚠️ Error registrando cambio de estatus en historial:', histErr.message);
          }
        }

        // Emitir evento WebSocket a todos los clientes conectados (GTR + Asesores)
        webSocketService.notifyAll('CLIENT_STATUS_UPDATED', {
          clienteId: id,
          estatus_comercial_categoria: datosActualizados.estatus_comercial_categoria,
          estatus_comercial_subcategoria: datosActualizados.estatus_comercial_subcategoria,
          asesor: asesorNombre,
          timestamp: new Date().toISOString()
        });
        
        console.log('📡 WebSocket: CLIENT_STATUS_UPDATED emitido para cliente', id);
      } catch (wsError) {
        console.warn('⚠️ Error emitiendo evento WebSocket CLIENT_STATUS_UPDATED:', wsError.message);
      }
    }

    // Si la gestión indica que el cliente debe moverse a GTR (por ejemplo
    // wizard_completado = true) entonces limpiar el asesor asignado y marcar
    // el estado como 'gestionado' para que desaparezca del panel de asesor y
    // quede disponible en el panel de gestiones (GTR). Aceptamos también
    // un flag explícito req.body.moveToGtr.
    const moveToGtrFlag = (datosActualizados.wizard_completado && Number(datosActualizados.wizard_completado) === 1) || (req.body && (req.body.moveToGtr === true || req.body.moveToGtr === 'true'));

    // Si se requiere mover a GTR, aplicar una actualización explícita y atómica
    // para marcar estado como 'gestionado', evitando problemas con la construcción dinámica previa.
    // NOTA: NO limpiamos asesor_asignado para mantener el registro de quién gestionó al cliente
    if (moveToGtrFlag) {
      try {
        const updates = [];
        const params = [];
        // COMENTADO: No limpiar asesor_asignado para que aparezca en validaciones
        // if (colSet.has('asesor_asignado')) {
        //   updates.push('asesor_asignado = NULL');
        // }
        if (colSet.has('estado')) {
          updates.push("estado = 'gestionado'");
        }
        // Marcar seguimiento_status como 'gestionado' cuando se completa el wizard
        if (colSet.has('seguimiento_status')) {
          updates.push("seguimiento_status = 'gestionado'");
        }
        // ✨ NUEVO: Actualizar fecha_wizard_completado cuando se completa el wizard
        if (colSet.has('fecha_wizard_completado')) {
          updates.push('fecha_wizard_completado = NOW()');
        }
        if (colSet.has('updated_at')) {
          updates.push('updated_at = NOW()');
        }

        if (updates.length > 0) {
          const sqlMove = `UPDATE clientes SET ${updates.join(', ')} WHERE id = ?`;
          await pool.query(sqlMove, [id]);
        }
        // Si no existe columna 'estado' pero sí 'wizard_data_json', marcar flag JSON para indicar movimiento a GTR
        if (!colSet.has('estado') && colSet.has('wizard_data_json')) {
          try {
            const sqlJson = `UPDATE clientes SET wizard_data_json = JSON_SET(COALESCE(wizard_data_json, JSON_OBJECT()), '$.moved_to_gtr', true) WHERE id = ?`;
            await pool.query(sqlJson, [id]);
          } catch (e) {
            console.warn('Fallo al marcar moved_to_gtr en wizard_data_json:', e.message);
          }
        }
      } catch (e) {
        console.warn('Fallo al mover cliente a GTR (UPDATE explícito):', e.message);
      }
    }

    // Registrar en historial_cliente que se realizó una gestión (si la tabla existe)
    try {
      // Validar que el usuario proporcionado exista para evitar fallo por FK en historial_cliente
      let usuarioId = req.body && req.body.usuario_id ? req.body.usuario_id : null;
      if (usuarioId) {
        try {
          const [uCheck] = await pool.query('SELECT id FROM usuarios WHERE id = ? LIMIT 1', [usuarioId]);
          if (!uCheck || uCheck.length === 0) {
            // Usuario no existe, usar NULL para no violar FK
            usuarioId = null;
          }
        } catch (ux) {
          console.warn('Error comprobando usuario_id para historial (se ignorará):', ux.message);
          usuarioId = null;
        }
      }
      // Si usuarioId no existe o es null, intentar usar un usuario existente como fallback
      if (!usuarioId) {
        try {
          const [anyUser] = await pool.query('SELECT id FROM usuarios LIMIT 1');
          if (anyUser && anyUser.length > 0) {
            usuarioId = anyUser[0].id;
          }
        } catch (ux2) {
          console.warn('No se pudo obtener usuario fallback para historial:', ux2.message);
        }
      }
  // Evitar prefijos duplicados: si la observación ya contiene la palabra
  // 'Gestión' o 'Gestión:' no la volvemos a anteponer.
  let descripcion = datosActualizados.observaciones_asesor ? String(datosActualizados.observaciones_asesor) : null;
  if (!descripcion) descripcion = 'Gestión registrada desde interfaz de asesor';
      const estadoNuevo = datosActualizados.estado ? datosActualizados.estado : (moveToGtrFlag && colSet.has('estado') ? 'gestionado' : null);
      const accion = moveToGtrFlag ? 'moved_to_gtr' : 'gestion';
  await pool.query('INSERT INTO historial_cliente (cliente_id, usuario_id, accion, descripcion, estado_nuevo) VALUES (?, ?, ?, ?, ?)', [id, usuarioId, accion, descripcion, estadoNuevo]);


      // Obtener datos mínimos del cliente para notificar a GTR (evitar enviar todo el historial)
      let clienteMin = { dni: null, nombre: null };
      try {
        const [cliRows] = await pool.query('SELECT dni, nombre FROM clientes WHERE id = ? LIMIT 1', [id]);
        if (cliRows && cliRows.length > 0) {
          clienteMin.dni = cliRows[0].dni || null;
          clienteMin.nombre = cliRows[0].nombre || null;
        }
      } catch (e) {
        console.warn('No se pudo leer cliente para notificación mínima:', e.message);
      }

      // Para movimientos a GTR queremos notificar SOLO un resumen breve (dni + informe)
      if (moveToGtrFlag) {
        // Intentar obtener el nombre del usuario/asesor para mostrar en GTR
        let usuarioNombre = null;
        try {
          if (usuarioId) {
            const [uRows] = await pool.query('SELECT nombre FROM usuarios WHERE id = ? LIMIT 1', [usuarioId]);
            if (uRows && uRows.length > 0) usuarioNombre = uRows[0].nombre || null;
          }
        } catch (e) {
          console.warn('No se pudo obtener nombre de usuario para notificación:', e.message);
        }

        try {
          const payload = {
            clienteId: id,
            dni: clienteMin.dni,
            informe: descripcion,
            fecha: new Date().toISOString(),
            usuarioId: usuarioId,
            usuarioNombre: usuarioNombre,
            accion: accion
          };
          
          console.log('🚀 [WIZARD COMPLETADO] Enviando evento CLIENT_MOVED_TO_GTR vía WebSocket:', JSON.stringify(payload, null, 2));
          webSocketService.notifyAll('CLIENT_MOVED_TO_GTR', payload);
          console.log('✅ [WIZARD COMPLETADO] Evento CLIENT_MOVED_TO_GTR enviado correctamente');
        } catch (e) { 
          console.error('❌ [WIZARD COMPLETADO] Error enviando evento CLIENT_MOVED_TO_GTR:', e.message); 
        }
      } else {
        // Para otras gestiones notificamos el historial como antes
        try {
          webSocketService.notifyAll('HISTORIAL_UPDATED', { clienteId: id, usuarioId: usuarioId, accion });
        } catch (e) { console.warn('WS notify HISTORIAL_UPDATED failed', e.message); }
      }

    } catch (e) {
      console.warn('No se pudo insertar en historial_cliente (posible ausencia de tabla):', e.message);
    }

    // Obtener el cliente actualizado
    const [updatedClient] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
    
    console.log(`✅ Cliente actualizado con ID: ${id}`);
    return res.status(200).json({ 
      success: true, 
      message: 'Cliente actualizado exitosamente',
      cliente: updatedClient[0]
    });

  } catch (err) {
    console.error('Error updateCliente', err);
    // DEBUG: retornar stack completo en la respuesta para facilitar diagnóstico local
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: err.message
    });
  }
};

// GET /api/clientes/asesor/:asesorId - Obtener clientes específicos de un asesor
const getClientesByAsesor = async (req, res) => {
  const { asesorId } = req.params;

  if (!asesorId) {
    return res.status(400).json({
      success: false,
      message: 'ID de asesor es obligatorio'
    });
  }

  try {
    console.log(`👤 Obteniendo clientes para asesor ID: ${asesorId}`);

    // Verificar que el usuario existe y es un asesor
    const [asesorInfo] = await pool.query(`
      SELECT id, nombre as asesor_nombre
      FROM usuarios
      WHERE id = ? AND tipo = 'asesor'
    `, [asesorId]);

    if (asesorInfo.length === 0) {
      console.error(`❌ Asesor no encontrado con ID: ${asesorId}`);
      return res.status(404).json({
        success: false,
        message: 'Asesor no encontrado'
      });
    }

    const asesorNombre = asesorInfo[0].asesor_nombre;
    console.log(`✅ Asesor encontrado: ${asesorNombre} (ID: ${asesorId})`);

    // Construir SELECT dinámico según columnas realmente presentes en la tabla `clientes`
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes'
    `);
    const colSet = new Set(cols.map(c => c.COLUMN_NAME));

    const wanted = {
      id: 'c.id',
      nombre: 'c.nombre',
      telefono: 'c.telefono',
      dni: 'c.dni',
      estado: 'c.estado',
      observaciones_asesor: 'c.observaciones_asesor',
      created_at: 'c.created_at',
      fecha_ultimo_contacto: 'c.fecha_ultimo_contacto',
      servicio_contratado: 'c.servicio_contratado',
      leads_original_telefono: 'c.leads_original_telefono',
      seguimiento_status: 'c.seguimiento_status',
      derivado_at: 'c.derivado_at',
      opened_at: 'c.opened_at',
      asesor_asignado: 'c.asesor_asignado',
      estatus_comercial_categoria: 'c.estatus_comercial_categoria',
      estatus_comercial_subcategoria: 'c.estatus_comercial_subcategoria'
    };

    const selectParts = [];
    // Los aliases que espera el frontend
    if (colSet.has('id')) selectParts.push(`${wanted.id} AS id`);
    if (colSet.has('nombre')) selectParts.push(`${wanted.nombre} AS nombre`);
    if (colSet.has('telefono')) selectParts.push(`${wanted.telefono} AS telefono`);
    if (colSet.has('dni')) selectParts.push(`${wanted.dni} AS dni`);
    // Si no existe 'estado' devolvemos NULL con alias para evitar ER_BAD_FIELD_ERROR
    if (colSet.has('estado')) selectParts.push(`${wanted.estado} AS estado`);
    else selectParts.push(`NULL AS estado`);

    if (colSet.has('observaciones_asesor')) selectParts.push(`${wanted.observaciones_asesor} AS observaciones_asesor`);
    else selectParts.push(`NULL AS observaciones_asesor`);

    if (colSet.has('created_at')) selectParts.push(`${wanted.created_at} AS fecha`);
    else selectParts.push(`NULL AS fecha`);

    if (colSet.has('fecha_ultimo_contacto')) selectParts.push(`${wanted.fecha_ultimo_contacto} AS seguimiento`);
    else selectParts.push(`NULL AS seguimiento`);

    if (colSet.has('servicio_contratado')) selectParts.push(`${wanted.servicio_contratado} AS servicio`);
    else selectParts.push(`NULL AS servicio`);

    if (colSet.has('leads_original_telefono')) selectParts.push(`${wanted.leads_original_telefono} AS leads_original_telefono`);
    else selectParts.push(`NULL AS leads_original_telefono`);

    // CRÍTICO: Incluir seguimiento_status para que el frontend pueda mostrar el estado
    if (colSet.has('seguimiento_status')) selectParts.push(`${wanted.seguimiento_status} AS seguimiento_status`);
    else selectParts.push(`NULL AS seguimiento_status`);

    if (colSet.has('derivado_at')) selectParts.push(`${wanted.derivado_at} AS derivado_at`);
    else selectParts.push(`NULL AS derivado_at`);

    if (colSet.has('opened_at')) selectParts.push(`${wanted.opened_at} AS opened_at`);
    else selectParts.push(`NULL AS opened_at`);

    if (colSet.has('asesor_asignado')) selectParts.push(`${wanted.asesor_asignado} AS asesor_asignado`);
    else selectParts.push(`NULL AS asesor_asignado`);

    // Agregar categoría y subcategoría para mostrar en el panel del asesor
    if (colSet.has('estatus_comercial_categoria')) selectParts.push(`${wanted.estatus_comercial_categoria} AS estatus_comercial_categoria`);
    else selectParts.push(`NULL AS estatus_comercial_categoria`);

    if (colSet.has('estatus_comercial_subcategoria')) selectParts.push(`${wanted.estatus_comercial_subcategoria} AS estatus_comercial_subcategoria`);
    else selectParts.push(`NULL AS estatus_comercial_subcategoria`);

    const selectClause = selectParts.join(',\n        ');

    // FILTRAR: Mostrar solo clientes que NO han completado el wizard
    // Los clientes gestionados (wizard_completado = 1) van a "Gestiones del Día" o "Mi Historial"
    
    // asesor_asignado debe guardar siempre el usuario_id, no el asesor_id de tabla asesores
    const sql = `SELECT
        ${selectClause}
      FROM clientes c
      WHERE c.asesor_asignado = ?
        AND (c.wizard_completado IS NULL OR c.wizard_completado = 0)
      ORDER BY c.created_at DESC`;
    
    console.log(`🔍 [GET_CLIENTES_ASESOR] Ejecutando query con asesorId: ${asesorId}`);
    console.log(`📋 [GET_CLIENTES_ASESOR] SQL: ${sql}`);
    
    const [clientes] = await pool.query(sql, [asesorId]);

    console.log(`✅ [GET_CLIENTES_ASESOR] Encontrados ${clientes.length} clientes para asesor ${asesorId}`);
    if (clientes.length > 0) {
      console.log(`📝 [GET_CLIENTES_ASESOR] Primer cliente:`, JSON.stringify(clientes[0], null, 2));
    }

    return res.json({
      success: true,
      clientes: clientes,
      asesor: {
        id: asesorId,
        nombre: asesorNombre,
        total_clientes: clientes.length
      }
    });

  } catch (err) {
    console.error('Error getClientesByAsesor:', err);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err.message
    });
  }
};

// Obtener historial de clientes gestionados por el asesor (wizard completado)
const getHistorialByAsesor = async (req, res) => {
  const asesorId = Number(req.params.asesorId);
  
  if (!asesorId) {
    return res.status(400).json({
      success: false,
      message: 'asesorId es requerido'
    });
  }

  try {
    // Obtener solo las gestiones del MES ACTUAL del asesor
    const [rows] = await pool.query(
      `SELECT 
        id,
        telefono,
        campana,
        estatus_comercial_categoria,
        estatus_comercial_subcategoria,
        fecha_wizard_completado,
        DATE_FORMAT(fecha_wizard_completado, '%d/%m/%Y %H:%i') as fecha_cierre_formateada
       FROM clientes
       WHERE wizard_completado = 1
         AND asesor_asignado = ?
         AND YEAR(fecha_wizard_completado) = YEAR(CURDATE())
         AND MONTH(fecha_wizard_completado) = MONTH(CURDATE())
       ORDER BY fecha_wizard_completado DESC`,
      [asesorId]
    );

    console.log(`📋 [HISTORIAL ASESOR ${asesorId}] Encontradas ${rows.length} gestiones del mes`);

    return res.status(200).json({
      success: true,
      clientes: rows
    });
  } catch (err) {
    console.error('Error getHistorialByAsesor:', err);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err.message
    });
  }
};

// Obtener gestiones del día actual del asesor (wizard completado HOY)
const getGestionesDiaByAsesor = async (req, res) => {
  const asesorId = Number(req.params.asesorId);
  
  if (!asesorId) {
    return res.status(400).json({
      success: false,
      message: 'asesorId es requerido'
    });
  }

  try {
    const [rows] = await pool.query(
      `SELECT 
        id,
        nombre,
        telefono,
        dni,
        campana,
        estatus_comercial_categoria,
        estatus_comercial_subcategoria,
        fecha_wizard_completado,
        wizard_completado
       FROM clientes
       WHERE wizard_completado = 1
         AND DATE(fecha_wizard_completado) = CURDATE()
         AND asesor_asignado = ?
       ORDER BY fecha_wizard_completado DESC`,
      [asesorId]
    );

    console.log(`📋 [GESTIONES DIA ASESOR ${asesorId}] Encontrados ${rows.length} clientes gestionados hoy`);

    return res.status(200).json({
      success: true,
      clientes: rows
    });
  } catch (err) {
    console.error('Error getGestionesDiaByAsesor:', err);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err.message
    });
  }
};

// LOCK endpoints: durable locks stored in table `cliente_locks`
const lockCliente = async (req, res) => {
  const id = Number(req.params.id);
  const { asesorId, durationSeconds } = req.body || {};
  const duration = Number(durationSeconds) || 300; // default 5min

  if (!id || !asesorId) return res.status(400).json({ success: false, message: 'clienteId y asesorId requeridos' });

  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query('SELECT locked_by, lock_expires_at FROM cliente_locks WHERE cliente_id = ? FOR UPDATE', [id]);

      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);

      if (!rows || rows.length === 0) {
        await conn.query('INSERT INTO cliente_locks (cliente_id, locked_by, locked_at, lock_expires_at, lock_token) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? SECOND), ?)', [id, asesorId, duration, token]);
      } else {
        const lockInfo = rows[0];
        const expiresAt = lockInfo.lock_expires_at;
        const now = new Date();
        if (!expiresAt || new Date(expiresAt) < now || lockInfo.locked_by == asesorId) {
          await conn.query('UPDATE cliente_locks SET locked_by = ?, locked_at = NOW(), lock_expires_at = DATE_ADD(NOW(), INTERVAL ? SECOND), lock_token = ? WHERE cliente_id = ?', [asesorId, duration, token, id]);
        } else {
          await conn.rollback();
          return res.status(409).json({ success: false, message: 'Cliente ya bloqueado', owner: lockInfo });
        }
      }

      await conn.commit();
    } catch (e) {
      try { await conn.rollback(); } catch (_) {}
      throw e;
    } finally {
      try { conn.release(); } catch (_) {}
    }

    const [newRows] = await pool.query('SELECT locked_by, locked_at, lock_expires_at, lock_token FROM cliente_locks WHERE cliente_id = ? LIMIT 1', [id]);
    const newLock = newRows[0] || null;
    try { webSocketService.notifyAll('CLIENT_LOCKED', { clienteId: id, locked_by: newLock && newLock.locked_by ? newLock.locked_by : asesorId, lock_expires_at: newLock && newLock.lock_expires_at ? newLock.lock_expires_at : null }); } catch (e) { console.warn('WS notify CLIENT_LOCKED failed', e.message); }
    return res.json({ success: true, locked: true, lockToken: newLock ? newLock.lock_token : token, expiresAt: newLock && newLock.lock_expires_at ? newLock.lock_expires_at : null });
  } catch (e) {
    console.error('Error lockCliente:', e);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

const unlockCliente = async (req, res) => {
  const id = Number(req.params.id);
  const { asesorId, lockToken } = req.body || {};
  if (!id) return res.status(400).json({ success: false, message: 'clienteId requerido' });

  try {
    const [result] = await pool.query('DELETE FROM cliente_locks WHERE cliente_id = ? AND (lock_token = ? OR locked_by = ?)', [id, lockToken || '', asesorId || null]);
    if (result.affectedRows && result.affectedRows > 0) {
      try { webSocketService.notifyAll('CLIENT_UNLOCKED', { clienteId: id }); } catch (e) { console.warn('WS notify CLIENT_UNLOCKED failed', e.message); }
      return res.json({ success: true, unlocked: true });
    }
    return res.status(403).json({ success: false, message: 'No autorizado para desbloquear o lock no coincide' });
  } catch (e) {
    console.error('Error unlockCliente:', e);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

const heartbeatCliente = async (req, res) => {
  const id = Number(req.params.id);
  const { asesorId, lockToken, extendSeconds } = req.body || {};
  const extend = Number(extendSeconds) || 300;
  if (!id) return res.status(400).json({ success: false, message: 'clienteId requerido' });

  try {
    const [result] = await pool.query('UPDATE cliente_locks SET lock_expires_at = DATE_ADD(NOW(), INTERVAL ? SECOND) WHERE cliente_id = ? AND (lock_token = ? OR locked_by = ?)', [extend, id, lockToken || '', asesorId || null]);
    if (result.affectedRows && result.affectedRows > 0) {
      const [rows] = await pool.query('SELECT lock_expires_at FROM cliente_locks WHERE cliente_id = ? LIMIT 1', [id]);
      const expiresAt = rows[0] && rows[0].lock_expires_at ? rows[0].lock_expires_at : null;
      try { webSocketService.notifyAll('CLIENT_LOCK_HEARTBEAT', { clienteId: id, lock_expires_at: expiresAt }); } catch (e) { console.warn('WS notify heartbeat failed', e.message); }
      return res.json({ success: true, extended: true, expiresAt });
    }
    return res.status(409).json({ success: false, message: 'No se pudo refrescar el lock (no eres propietario o lock expiró)' });
  } catch (e) {
    console.error('Error heartbeatCliente:', e);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

const getLockStatus = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ success: false, message: 'clienteId requerido' });
  try {
    const [rows] = await pool.query('SELECT locked_by, locked_at, lock_expires_at FROM cliente_locks WHERE cliente_id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.json({ success: true, lock: null });
    return res.json({ success: true, lock: rows[0] });
  } catch (e) {
    console.error('Error getLockStatus:', e);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};
 

// POST /api/clientes/:id/open-wizard
const openWizard = async (req, res) => {
  const id = Number(req.params.id);
  const { asesorId, lockToken } = req.body || {};
  if (!id || !asesorId) return res.status(400).json({ success: false, message: 'clienteId y asesorId requeridos' });

  try {
    // Validar lock
    const [locks] = await pool.query('SELECT locked_by, lock_expires_at, lock_token FROM cliente_locks WHERE cliente_id = ? LIMIT 1', [id]);
    if (!locks || locks.length === 0) {
      return res.status(409).json({ success: false, message: 'No existe lock para este cliente. Obtén un lock antes de abrir el wizard.' });
    }
    const lock = locks[0];
    const now = new Date();
    if (lock.lock_expires_at && new Date(lock.lock_expires_at) < now) {
      return res.status(409).json({ success: false, message: 'Lock expirado' });
    }
    if (!(String(lock.lock_token) === String(lockToken) || Number(lock.locked_by) === Number(asesorId))) {
      return res.status(403).json({ success: false, message: 'Token inválido o no eres el propietario del lock' });
    }

    // Marcar opened_at, last_activity y seguimiento_status = 'en_gestion'
    await pool.query("UPDATE clientes SET seguimiento_status = 'en_gestion', opened_at = NOW(), last_activity = NOW(), updated_at = NOW() WHERE id = ?", [id]);

    // Insertar en historial_estados si existe
    try {
      await pool.query('INSERT INTO historial_estados (cliente_id, usuario_id, tipo, estado_anterior, estado_nuevo, comentarios) VALUES (?, ?, ?, ?, ?, ?)', [id, asesorId, 'asesor', 'derivado', 'en_gestion', 'Asesor abrió el wizard y pasó a En Gestión']);
    } catch (e) { console.warn('No se pudo insertar en historial_estados (openWizard):', e.message); }

    // Insertar en historial_cliente
    try {
      await pool.query('INSERT INTO historial_cliente (cliente_id, usuario_id, accion, descripcion, estado_nuevo) VALUES (?, ?, ?, ?, ?)', [id, asesorId, 'en_gestion', 'Asesor abrió el wizard (marcado En Gestión)', 'en_gestion']);
    } catch (e) { console.warn('No se pudo insertar en historial_cliente (openWizard):', e.message); }

    // Notificar por websocket
    try { webSocketService.notifyAll('CLIENT_IN_GESTION', { clienteId: id, asesorId, timestamp: new Date().toISOString() }); } catch (e) { console.warn('WS notify CLIENT_IN_GESTION failed', e.message); }

    const [updatedRows] = await pool.query('SELECT * FROM clientes WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true, cliente: updatedRows[0] });
  } catch (e) {
    console.error('Error openWizard:', e);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

// POST /api/clientes/:id/complete-wizard
// Marca el cliente como "terminado" cuando el asesor completa la gestión
const completeWizard = async (req, res) => {
  const id = Number(req.params.id);
  const { asesorId } = req.body || {};
  if (!id || !asesorId) return res.status(400).json({ success: false, message: 'clienteId y asesorId requeridos' });

  try {
    // Verificar que el cliente existe y está en gestión
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    const cliente = rows[0];
    
    // Solo permitir completar si está en gestión
    if (cliente.seguimiento_status !== 'en_gestion') {
      return res.status(400).json({ 
        success: false, 
        message: `No se puede completar. Estado actual: ${cliente.seguimiento_status}` 
      });
    }

    // 🔥 NUEVO: Verificar si es "Preventa incompleta" para devolver a GTR
    const categoria = cliente.estatus_comercial_categoria;
    const subcategoria = cliente.estatus_comercial_subcategoria;
    const esPreventaIncompleta = categoria === 'Preventa incompleta';

    if (esPreventaIncompleta) {
      // Cliente con Preventa incompleta regresa automáticamente a GTR
      console.log(`🔄 Cliente ${id} con Preventa incompleta - Devolviendo a GTR`);
      
      await pool.query(`
        UPDATE clientes 
        SET 
          seguimiento_status = 'sin_gestionar',
          asesor_asignado = NULL,
          last_activity = NULL,
          wizard_completado = 1,
          fecha_wizard_completado = NOW(),
          historial_asesores = JSON_ARRAY_APPEND(
            COALESCE(historial_asesores, '[]'), 
            '$', 
            ?
          ),
          updated_at = NOW()
        WHERE id = ?
      `, [asesorId.toString(), id]);

      // Insertar en historial_estados
      try {
        await pool.query(
          'INSERT INTO historial_estados (cliente_id, usuario_id, tipo, estado_anterior, estado_nuevo, comentarios) VALUES (?, ?, ?, ?, ?, ?)',
          [id, asesorId, 'preventa_incompleta', 'en_gestion', 'sin_gestionar', `Preventa incompleta - Cliente devuelto a GTR. Categoría: ${categoria}, Subcategoría: ${subcategoria}`]
        );
      } catch (e) { 
        console.warn('No se pudo insertar en historial_estados (preventa incompleta):', e.message); 
      }

      // Insertar en historial_cliente
      try {
        await pool.query(
          'INSERT INTO historial_cliente (cliente_id, usuario_id, accion, descripcion, estado_nuevo) VALUES (?, ?, ?, ?, ?)',
          [id, asesorId, 'devuelto_a_gtr', `Preventa incompleta - Devuelto a GTR. Categoría: ${categoria}, Subcategoría: ${subcategoria}`, 'sin_gestionar']
        );
      } catch (e) { 
        console.warn('No se pudo insertar en historial_cliente (preventa incompleta):', e.message); 
      }

      // Notificar por WebSocket que volvió a GTR
      try {
        const [updatedRows] = await pool.query('SELECT * FROM clientes WHERE id = ? LIMIT 1', [id]);
        const clienteActualizado = updatedRows[0];
        
        webSocketService.notifyAll('CLIENT_RETURNED_TO_GTR', { 
          clienteId: id, 
          asesorId,
          razon: 'Preventa incompleta',
          cliente: clienteActualizado,
          timestamp: new Date().toISOString() 
        });
        
        console.log(`📢 [WebSocket] CLIENT_RETURNED_TO_GTR enviado - Preventa incompleta`);
      } catch (e) { 
        console.warn('WS notify CLIENT_RETURNED_TO_GTR failed', e.message); 
      }

      const [finalRows] = await pool.query('SELECT * FROM clientes WHERE id = ? LIMIT 1', [id]);
      return res.json({ 
        success: true, 
        cliente: finalRows[0],
        message: 'Cliente con Preventa incompleta devuelto a GTR exitosamente'
      });
    }

    // Actualizar a estado "gestionado" (para que GTR lo vea)
    // Y agregar el asesor al historial_asesores JSON array
    await pool.query(`
      UPDATE clientes 
      SET 
        seguimiento_status = 'gestionado',
        asesor_asignado = NULL,
        last_activity = NULL,
        wizard_completado = 1,
        fecha_wizard_completado = NOW(),
        historial_asesores = JSON_ARRAY_APPEND(
          COALESCE(historial_asesores, '[]'), 
          '$', 
          ?
        ),
        updated_at = NOW()
      WHERE id = ?
    `, [asesorId.toString(), id]);

    // Insertar en historial_estados
    try {
      await pool.query(
        'INSERT INTO historial_estados (cliente_id, usuario_id, tipo, estado_anterior, estado_nuevo, comentarios) VALUES (?, ?, ?, ?, ?, ?)',
        [id, asesorId, 'asesor', 'en_gestion', 'gestionado', 'Asesor completó la gestión del wizard']
      );
    } catch (e) { 
      console.warn('No se pudo insertar en historial_estados (completeWizard):', e.message); 
    }

    // Insertar en historial_cliente
    try {
      await pool.query(
        'INSERT INTO historial_cliente (cliente_id, usuario_id, accion, descripcion, estado_nuevo) VALUES (?, ?, ?, ?, ?)',
        [id, asesorId, 'gestionado', 'Asesor completó la gestión (wizard finalizado)', 'gestionado']
      );
    } catch (e) { 
      console.warn('No se pudo insertar en historial_cliente (completeWizard):', e.message); 
    }

    // 🔥 NUEVO: Registrar si el cliente va a validaciones
    const vaAValidaciones = categoria === 'Preventa completa' && 
                           (subcategoria === 'Venta cerrada' || subcategoria === 'Preventa pendiente de score');
    
    if (vaAValidaciones) {
      try {
        await pool.query(
          'INSERT INTO historial_estados (cliente_id, usuario_id, tipo, estado_anterior, estado_nuevo, comentarios) VALUES (?, ?, ?, ?, ?, ?)',
          [id, asesorId, 'envio_validaciones', 'gestionado', 'en_validaciones', `Cliente enviado a validaciones. Categoría: ${categoria}, Subcategoría: ${subcategoria}`]
        );
        
        await pool.query(
          'INSERT INTO historial_cliente (cliente_id, usuario_id, accion, descripcion, estado_nuevo) VALUES (?, ?, ?, ?, ?)',
          [id, asesorId, 'enviado_a_validaciones', `Cliente enviado a validaciones. Categoría: ${categoria}, Subcategoría: ${subcategoria}`, 'en_validaciones']
        );
        
        console.log(`📊 Cliente ${id} registrado en historial como enviado a validaciones`);
      } catch (e) { 
        console.warn('No se pudo insertar en historial (envío a validaciones):', e.message); 
      }
    }

    // Notificar por WebSocket - Enviar datos completos del cliente para actualización en tiempo real
    try {
      const [updatedRows] = await pool.query('SELECT * FROM clientes WHERE id = ? LIMIT 1', [id]);
      const clienteActualizado = updatedRows[0];
      
      webSocketService.notifyAll('CLIENT_COMPLETED', { 
        clienteId: id, 
        asesorId,
        cliente: clienteActualizado, // 🔥 Enviar datos completos para actualizar UI
        timestamp: new Date().toISOString() 
      });
      
      console.log('📢 [WebSocket] CLIENT_COMPLETED enviado con datos actualizados:', {
        id: clienteActualizado.id,
        categoria: clienteActualizado.estatus_comercial_categoria,
        subcategoria: clienteActualizado.estatus_comercial_subcategoria,
        seguimiento_status: clienteActualizado.seguimiento_status
      });
    } catch (e) { 
      console.warn('WS notify CLIENT_COMPLETED failed', e.message); 
    }

    const [finalRows] = await pool.query('SELECT * FROM clientes WHERE id = ? LIMIT 1', [id]);
    return res.json({ success: true, cliente: finalRows[0] });
  } catch (e) {
    console.error('Error completeWizard:', e);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

// POST /api/clientes/reasignar
const reasignarCliente = async (req, res) => {
  const { clienteId, nuevoAsesorId, gtrId, comentario } = req.body || {};

  console.log('🎯 Backend: Reasignación solicitada. Payload recibido:', JSON.stringify(req.body, null, 2));

  // Validaciones
  if (!clienteId) {
    console.error('❌ Backend: clienteId faltante');
    return res.status(400).json({ 
      success: false, 
      message: 'clienteId es requerido',
      received: { clienteId, nuevoAsesorId, gtrId }
    });
  }

  if (!nuevoAsesorId) {
    console.error('❌ Backend: nuevoAsesorId faltante');
    return res.status(400).json({ 
      success: false, 
      message: 'nuevoAsesorId es requerido',
      received: { clienteId, nuevoAsesorId, gtrId }
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar qué columnas existen
    const dbName = process.env.DB_NAME || 'albru';
    const [colEstado] = await connection.query(
      "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'estado' LIMIT 1", 
      [dbName]
    );

    // Construir SELECT dinámico
    let selectCols = ['id', 'nombre', 'telefono', 'asesor_asignado'];
    if (colEstado && colEstado.length > 0) selectCols.push('estado');

    const selectSql = `SELECT ${selectCols.join(', ')} FROM clientes WHERE id = ?`;
    const [clienteRows] = await connection.query(selectSql, [clienteId]);
    
    if (!clienteRows || clienteRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    const cliente = clienteRows[0];
    const antiguoAsesorId = cliente.asesor_asignado;

    // Obtener usuario_id del nuevo asesor
    const [nuevoAsesorData] = await connection.query(
      'SELECT usuario_id FROM asesores WHERE id = ?', 
      [nuevoAsesorId]
    );
    
    if (!nuevoAsesorData || nuevoAsesorData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Asesor no encontrado' });
    }
    
    const nuevoUsuarioId = nuevoAsesorData[0].usuario_id;

    // Actualizar cliente
    await connection.query(
      'UPDATE clientes SET asesor_asignado = ?, seguimiento_status = ?, derivado_at = NOW(), updated_at = NOW() WHERE id = ?', 
      [nuevoUsuarioId, 'derivado', clienteId]
    );

    // Registrar en historial
    try {
      const descripcionHist = comentario ? `${comentario} | nuevo_asesor_id:${nuevoAsesorId}` : `Reasignado a asesor ${nuevoAsesorId}`;
      const estadoNuevo = cliente.estado || null;
      await connection.query(
        'INSERT INTO historial_cliente (cliente_id, usuario_id, accion, descripcion, estado_nuevo) VALUES (?, ?, ?, ?, ?)', 
        [clienteId, gtrId || null, 'reasignado_asesor', descripcionHist, estadoNuevo]
      );
    } catch (e) {
      console.warn('No se pudo insertar en historial_cliente:', e.message);
    }

    // Actualizar contadores
    if (antiguoAsesorId) {
      await connection.query(
        'UPDATE asesores SET clientes_asignados = GREATEST(IFNULL(clientes_asignados,0) - 1,0), updated_at = CURRENT_TIMESTAMP WHERE usuario_id = ?', 
        [antiguoAsesorId]
      );
    }
    await connection.query(
      'UPDATE asesores SET clientes_asignados = IFNULL(clientes_asignados,0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [nuevoAsesorId]
    );

    // Obtener datos del nuevo asesor
    const [asesorRows] = await connection.query(
      'SELECT a.id, u.nombre, u.id as usuario_id FROM asesores a JOIN usuarios u ON a.usuario_id = u.id WHERE a.id = ?', 
      [nuevoAsesorId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Cliente reasignado exitosamente',
      data: {
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          estado: cliente.estado || null
        },
        asesor: asesorRows[0] || { id: nuevoAsesorId },
        fecha_reasignacion: new Date()
      }
    });

    // Notificar por WebSocket
    try {
      const payload = {
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          estado: cliente.estado || null,
          seguimiento_status: 'derivado'
        },
        nuevoAsesor: asesorRows[0] || { id: nuevoAsesorId },
        antiguoAsesor: { id: antiguoAsesorId },
        fecha_reasignacion: new Date(),
        clienteId: clienteId,
        nuevoAsesorId: nuevoAsesorId
      };
      
      console.log('🚀 [REASIGNAR] Enviando evento CLIENT_REASSIGNED vía WebSocket:', JSON.stringify(payload, null, 2));
      webSocketService.notifyAll('CLIENT_REASSIGNED', payload);
      console.log('✅ [REASIGNAR] Evento CLIENT_REASSIGNED enviado correctamente');
    } catch (e) {
      console.error('❌ [REASIGNAR] Error enviando evento CLIENT_REASSIGNED:', e.message);
    }

  } catch (error) {
    await connection.rollback();
    console.error('Error en reasignación:', error);
    return res.status(500).json({ success: false, message: 'Error al reasignar cliente' });
  } finally {
    connection.release();
  }
};

// GET /api/clientes/gestionados-hoy - Obtener clientes gestionados del DÍA con categoría y subcategoría
const getClientesGestionadosHoy = async (req, res) => {
  try {
    // Obtener clientes gestionados del DÍA ACTUAL (wizard completado)
    const sql = `
      SELECT 
        c.id,
        c.nombre,
        c.telefono,
        c.leads_original_telefono,
        c.dni,
        c.campana,
        c.canal_adquisicion AS canal,
        c.sala_asignada,
        c.compania,
        c.estatus_comercial_categoria,
        c.estatus_comercial_subcategoria,
        c.fecha_wizard_completado,
        c.seguimiento_status,
        c.asesor_asignado,
        c.created_at AS fecha_registro,
        u.nombre AS asesor_nombre
      FROM clientes c
      LEFT JOIN usuarios u ON c.asesor_asignado = u.id AND u.tipo = 'asesor'
      WHERE c.wizard_completado = 1
        AND (
          DATE(c.fecha_wizard_completado) = CURDATE()
          OR (c.fecha_wizard_completado IS NULL AND DATE(c.updated_at) = CURDATE())
        )
      ORDER BY c.fecha_wizard_completado DESC, c.updated_at DESC
    `;

    const [rows] = await pool.query(sql);
    
    console.log(`📋 [GESTIONADOS HOY] Encontrados ${rows.length} clientes gestionados del día`);
    if (rows.length > 0) {
      console.log(`📋 [GESTIONADOS HOY] Primer cliente:`, {
        id: rows[0].id,
        categoria: rows[0].estatus_comercial_categoria,
        subcategoria: rows[0].estatus_comercial_subcategoria,
        fecha_wizard: rows[0].fecha_wizard_completado
      });
    }
    
    return res.json({ 
      success: true, 
      clientes: rows, 
      total: rows.length 
    });
  } catch (err) {
    console.error('Error getClientesGestionadosHoy', err);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

// GET /api/clientes/campana-stats-hoy - Estadísticas por campaña (ingresados hoy vs validaciones/preventa)
const getCampanaStatsHoy = async (req, res) => {
  try {
    const sql = `
      SELECT
        IFNULL(c.campana, 'Sin campaña') as campana,
        SUM(CASE WHEN DATE(c.created_at) = CURDATE() THEN 1 ELSE 0 END) as total_ingresados_hoy,
        SUM(CASE WHEN DATE(c.created_at) = CURDATE() AND (
          c.estatus_comercial_categoria IN ('Preventa', 'Preventa completa')
        ) THEN 1 ELSE 0 END) as total_validaciones_hoy
      FROM clientes c
      GROUP BY campana
      ORDER BY total_ingresados_hoy DESC;
    `;

    const [rows] = await pool.query(sql);

    // Añadir porcentaje calculado
    const result = rows.map(r => ({
      campana: r.campana,
      total_ingresados_hoy: Number(r.total_ingresados_hoy) || 0,
      total_validaciones_hoy: Number(r.total_validaciones_hoy) || 0,
      porcentaje: r.total_ingresados_hoy ? Number(((r.total_validaciones_hoy / r.total_ingresados_hoy) * 100).toFixed(2)) : 0
    }));

    return res.json({ success: true, stats: result });
  } catch (err) {
    console.error('Error getCampanaStatsHoy', err);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

// GET /api/clientes/gestionados-mes - Obtener clientes gestionados del MES ACTUAL con categoría y subcategoría
const getClientesGestionadosMes = async (req, res) => {
  try {
    // Obtener clientes gestionados del MES ACTUAL (wizard completado)
    const sql = `
      SELECT 
        c.id,
        c.nombre,
        c.telefono,
        c.leads_original_telefono,
        c.dni,
        c.campana,
        c.canal_adquisicion AS canal,
        c.sala_asignada,
        c.compania,
        c.estatus_comercial_categoria,
        c.estatus_comercial_subcategoria,
        c.fecha_wizard_completado,
        c.seguimiento_status,
        c.asesor_asignado,
        c.created_at AS fecha_registro,
        u.nombre AS asesor_nombre
      FROM clientes c
      LEFT JOIN usuarios u ON c.asesor_asignado = u.id AND u.tipo = 'asesor'
      WHERE c.wizard_completado = 1
        AND (
          (MONTH(c.fecha_wizard_completado) = MONTH(CURDATE()) AND YEAR(c.fecha_wizard_completado) = YEAR(CURDATE()))
          OR (c.fecha_wizard_completado IS NULL AND MONTH(c.updated_at) = MONTH(CURDATE()) AND YEAR(c.updated_at) = YEAR(CURDATE()))
        )
      ORDER BY c.fecha_wizard_completado DESC, c.updated_at DESC
      LIMIT 1000
    `;

    const [rows] = await pool.query(sql);
    
    console.log(`📊 [GESTIONADOS MENSUALES] Encontrados ${rows.length} clientes gestionados del mes`);
    if (rows.length > 0) {
      console.log(`📊 [GESTIONADOS MENSUALES] Primer cliente:`, {
        id: rows[0].id,
        categoria: rows[0].estatus_comercial_categoria,
        subcategoria: rows[0].estatus_comercial_subcategoria,
        fecha_wizard: rows[0].fecha_wizard_completado
      });
    }
    
    return res.json({ 
      success: true, 
      clientes: rows, 
      total: rows.length 
    });
  } catch (err) {
    console.error('Error getClientesGestionadosMes', err);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

// GET /api/clientes/preventa-cerrada - Clientes con categoría "Preventa completa" o "Preventa" para validaciones
const getClientesPreventaCerrada = async (req, res) => {
  try {
    const limit = Math.min(1000, Number(req.query.limit) || 100);
    
    const query = `
      SELECT 
        c.*,
        u.nombre AS asesor_nombre
      FROM clientes c
      LEFT JOIN usuarios u ON c.asesor_asignado = u.id
      WHERE c.estatus_comercial_categoria = 'Preventa completa'
        AND c.estatus_comercial_subcategoria IN ('Venta cerrada', 'Preventa pendiente de score')
        AND c.wizard_completado = 1
      ORDER BY c.fecha_wizard_completado DESC, c.id DESC
      LIMIT ?
    `;
    
    const [clientes] = await pool.query(query, [limit]);
    
    console.log(`📊 Clientes con Preventa completa (Venta cerrada o Preventa pendiente de score) y wizard completado: ${clientes.length}`);
    
    return res.json({
      success: true,
      clientes,
      total: clientes.length
    });
  } catch (err) {
    console.error('Error getClientesPreventaCerrada', err);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

// POST /api/clientes/notify-ocupado - Notifica en tiempo real que un cliente está siendo gestionado
const notifyClienteOcupado = async (req, res) => {
  const { clienteId, asesorId, ocupado } = req.body || {};

  if (!clienteId) {
    return res.status(400).json({ 
      success: false, 
      message: 'clienteId es requerido' 
    });
  }

  try {
    // Emitir evento WebSocket a la sala GTR
    webSocketService.notifyRoom('gtr-room', 'CLIENT_OCUPADO', {
      clienteId,
      asesorId,
      ocupado: ocupado === true,
      timestamp: new Date().toISOString()
    });

    console.log(`📢 Notificado a GTR: Cliente ${clienteId} ${ocupado ? 'ocupado' : 'liberado'} por asesor ${asesorId || 'desconocido'}`);

    return res.json({ 
      success: true, 
      message: 'Notificación enviada al GTR' 
    });
  } catch (error) {
    console.error('❌ Error en notify-ocupado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al enviar notificación' 
    });
  }
};

  module.exports = {
    getClienteByTelefono,
    getClienteByDni,
    searchClientes,
    getAllClientes,
    getClienteById,
    createCliente,
    updateCliente,
    lockCliente,
    unlockCliente,
    heartbeatCliente,
    getLockStatus,
    getClientesByAsesor,
    getHistorialByAsesor,
    getGestionesDiaByAsesor,
    getClientesGestionadosHoy,
    getCampanaStatsHoy,
    getClientesGestionadosMes,
    getClientesPreventaCerrada,
    openWizard,
    completeWizard,
    reasignarCliente,
    notifyClienteOcupado
  };