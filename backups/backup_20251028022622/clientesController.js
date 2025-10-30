const pool = require('../config/database');
const crypto = require('crypto');
const webSocketService = require('../services/WebSocketService');

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
      `SELECT id, nombre, telefono, leads_original_telefono, tipo_base, campana, canal_adquisicion, sala_asignada, compania, estado
       FROM clientes
       WHERE nombre LIKE ? OR telefono LIKE ? OR leads_original_telefono LIKE ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [like, like, like, limit, offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM clientes WHERE nombre LIKE ? OR telefono LIKE ? OR leads_original_telefono LIKE ?`,
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
    const limit = Math.min(1000, Number(req.query.limit) || 100);

    // Filtros opcionales
    const { startDate, endDate, month, estado, no_contactado } = req.query;
    const whereClauses = [];
    const params = [];

    // Rango por fechas (created_at)
    if (startDate && endDate) {
      whereClauses.push('c.created_at BETWEEN ? AND ?');
      params.push(startDate + ' 00:00:00', endDate + ' 23:59:59');
    } else if (startDate) {
      whereClauses.push('c.created_at >= ?');
      params.push(startDate + ' 00:00:00');
    } else if (endDate) {
      whereClauses.push('c.created_at <= ?');
      params.push(endDate + ' 23:59:59');
    }

    // Mes (formato YYYY-MM)
    if (month) {
      // calcular primer y ultimo dia del mes
      const [y, m] = String(month).split('-');
      if (y && m) {
        const year = parseInt(y, 10);
        const mon = parseInt(m, 10);
        if (!isNaN(year) && !isNaN(mon)) {
          const first = `${year}-${String(mon).padStart(2, '0')}-01 00:00:00`;
          // último día del mes
          const lastDay = new Date(year, mon, 0).getDate();
          const last = `${year}-${String(mon).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`;
          whereClauses.push('c.created_at BETWEEN ? AND ?');
          params.push(first, last);
        }
      }
    }

    // Estado: solo usar si la columna existe en la base de datos para evitar SQL errors
    if (estado && estado !== 'Todos') {
      try {
        const [colCheck] = await pool.query("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'estado' LIMIT 1", [process.env.DB_NAME || 'albru']);
        if (colCheck && colCheck.length > 0) {
          whereClauses.push('c.estado = ?');
          params.push(estado);
        } else {
          console.warn('La columna `estado` no existe en clientes — omitiendo filtro estado');
        }
      } catch (e) {
        console.warn('No fue posible verificar existencia de columna estado, omitiendo filtro', e.message);
      }
    }

    // No contactado: registros sin ultima_fecha_gestion y sin fecha_ultimo_contacto
    if (no_contactado && (no_contactado === '1' || no_contactado === 'true')) {
      whereClauses.push('(c.ultima_fecha_gestion IS NULL OR c.ultima_fecha_gestion = "" ) AND (c.fecha_ultimo_contacto IS NULL OR c.fecha_ultimo_contacto = "")');
    }

    // Intentamos incluir información del asesor asignado (id y nombre) para que el frontend
    // pueda mostrar correctamente la reasignación inmediatamente después de un cambio.
    // Construimos la consulta en dos pasos para evitar errores si la columna no existe.
    const dbName = process.env.DB_NAME || 'albru';
    let sql = '';
    try {
      const [colAsesor] = await pool.query("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'asesor_asignado' LIMIT 1", [dbName]);
      if (colAsesor && colAsesor.length > 0) {
        // Si la columna existe, hacemos LEFT JOIN para traer el nombre del asesor (usuarios.nombre)
        sql = `
          SELECT c.id, c.nombre, c.telefono, c.leads_original_telefono, c.tipo_base, c.campana, c.canal_adquisicion, c.sala_asignada, c.compania,
                 c.back_office_info, c.tipificacion_back, c.datos_leads, c.comentarios_back, c.ultima_fecha_gestion, c.fecha_ultimo_contacto, c.created_at,
                 c.asesor_asignado as asesor_id, u.nombre as asesor_nombre
          FROM clientes c
          LEFT JOIN asesores a ON c.asesor_asignado = a.id
          LEFT JOIN usuarios u ON a.usuario_id = u.id
        `;
      } else {
        // Fallback: extraer assigned_asesor_id desde wizard_data_json si existe
        sql = `
          SELECT c.id, c.nombre, c.telefono, c.leads_original_telefono, c.tipo_base, c.campana, c.canal_adquisicion, c.sala_asignada, c.compania,
                 c.back_office_info, c.tipificacion_back, c.datos_leads, c.comentarios_back, c.ultima_fecha_gestion, c.fecha_ultimo_contacto, c.created_at,
                 JSON_UNQUOTE(JSON_EXTRACT(COALESCE(c.wizard_data_json, JSON_OBJECT()), '$.assigned_asesor_id')) as asesor_id,
                 NULL as asesor_nombre
          FROM clientes c
        `;
      }
    } catch (e) {
      // En caso de error al comprobar columnas, caer a una SELECT básica
      console.warn('No se pudo comprobar la existencia de columna asesor_asignado, usando SELECT básico:', e.message);
      sql = `
        SELECT c.id, c.nombre, c.telefono, c.leads_original_telefono, c.tipo_base, c.campana, c.canal_adquisicion, c.sala_asignada, c.compania,
               c.back_office_info, c.tipificacion_back, c.datos_leads, c.comentarios_back, c.ultima_fecha_gestion, c.fecha_ultimo_contacto, c.created_at,
               NULL as asesor_id, NULL as asesor_nombre
        FROM clientes c
      `;
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

  sql += ' ORDER BY c.created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(sql, params);

    console.log(`📋 Obteniendo ${rows.length} clientes desde la base de datos con filtros`, { startDate, endDate, month, estado, no_contactado });
    return res.json({ success: true, clientes: rows, total: rows.length });
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
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ success:false, message: 'Cliente no encontrado' });
    return res.json({ success:true, cliente: rows[0] });
  } catch (err) {
    console.error('Error getClienteById', err);
    return res.status(500).json({ success:false, message: 'Error interno' });
  }
};

// POST /api/clientes (crear nuevo cliente)
const createCliente = async (req, res) => {
  const { 
    // Campos básicos del CRM
    nombre, apellidos, telefono, leads_original_telefono, tipo_base, campana, canal_adquisicion, sala_asignada, compania, back_office_info, tipificacion_back, datos_leads, comentarios_back, ultima_fecha_gestion, dni, email, direccion, ciudad,
    edad, genero, estado_civil, ocupacion, ingresos_mensuales,
    asesor_asignado, observaciones_asesor,
    
    // Campos específicos del wizard
    tipo_cliente_wizard, lead_score, telefono_registro, fecha_nacimiento,
    dni_nombre_titular, parentesco_titular, telefono_referencia_wizard, telefono_grabacion_wizard,
    direccion_completa, numero_piso_wizard, tipo_plan, servicio_contratado, velocidad_contratada,
    precio_plan, dispositivos_adicionales_wizard, plataforma_digital_wizard,
    pago_adelanto_instalacion_wizard, wizard_completado, wizard_data_json
  } = req.body;

  // Validación básica: teléfono es obligatorio
  // Aceptamos que el frontend envíe `leads_original_telefono`; si `telefono` no está, lo usamos
  const finalTelefono = telefono || leads_original_telefono;

  // Normalizar DNI: el wizard puede enviar el campo como `dni` o `dni_nombre_titular`
  const finalDni = dni || dni_nombre_titular || null;

  if (!finalTelefono) {
    return res.status(400).json({ 
      success: false, 
      message: 'Teléfono es obligatorio' 
    });
  }

  // Helper: normalizar teléfono (quitar no-dígitos y devolver +51XXXXXXXXX para 9 dígitos)
  const normalizePhone = (raw) => {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length === 9) return `+51${digits}`; // móvil peruano
    if (digits.length === 11 && digits.startsWith('51')) return `+${digits}`;
    // Fallback: devolver solo dígitos
    return digits;
  };

  const normalizedPhone = normalizePhone(finalTelefono);

  try {
    console.log('📋 Backend: Creando cliente con datos del wizard:', {
      nombre, apellidos, telefono: finalTelefono, tipo_base, leads_original_telefono, campana, canal_adquisicion, sala_asignada, compania, tipificacion_back, comentarios_back,
      tipo_cliente_wizard, lead_score, wizard_completado
    });

    // Asegurar que 'nombre' no sea NULL si la columna tiene restricción NOT NULL en la BD
  const safeNombre = nombre || finalTelefono || '';

    // Verificar duplicados solo si los campos tienen valor (usar finalDni)
    if (finalDni) {
      const [existingByDni] = await pool.query('SELECT id FROM clientes WHERE dni = ? LIMIT 1', [finalDni]);
      if (existingByDni.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'Ya existe un cliente con este DNI' 
        });
      }
    }

    // Buscar duplicados comparando solo dígitos
    const digitsOnly = finalTelefono.replace(/\D/g, '');
    const [existingByPhone] = await pool.query(
      "SELECT id FROM clientes WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(telefono,' ',''),'+',''),'-',''), '(', ''), ')','') = ? LIMIT 1",
      [digitsOnly]
    );
    if (existingByPhone.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ya existe un cliente con este teléfono' 
      });
    }
    // Insertar el nuevo cliente con las columnas actuales de la tabla
    const insertSql = `
      INSERT INTO clientes (
        nombre, dni, telefono, leads_original_telefono, tipo_base, campana, canal_adquisicion, sala_asignada, compania,
        back_office_info, tipificacion_back, datos_leads, comentarios_back, ultima_fecha_gestion,
        tipo_cliente_wizard, lead_score, telefono_registro, fecha_nacimiento, direccion_completa, numero_piso_wizard,
        tipo_plan, servicio_contratado, velocidad_contratada, precio_plan, dispositivos_adicionales_wizard, plataforma_digital_wizard,
        pago_adelanto_instalacion_wizard, wizard_completado, fecha_wizard_completado, wizard_data_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      safeNombre,
      finalDni,
      normalizedPhone,
      leads_original_telefono || null,
      tipo_base || null,
      campana || null,
      canal_adquisicion || null,
      sala_asignada || null,
      compania || null,
      back_office_info || null,
      tipificacion_back || null,
      datos_leads ? JSON.stringify(datos_leads) : null,
      comentarios_back || null,
      ultima_fecha_gestion || null,
      // Campos del wizard
      tipo_cliente_wizard || null,
      lead_score || null,
      telefono_registro || null,
      fecha_nacimiento || null,
      direccion_completa || null,
      numero_piso_wizard || null,
      tipo_plan || null,
      servicio_contratado || null,
      velocidad_contratada || null,
      precio_plan || null,
      dispositivos_adicionales_wizard || null,
      plataforma_digital_wizard || null,
      pago_adelanto_instalacion_wizard || null,
      wizard_completado ? 1 : 0,
      wizard_completado ? new Date() : null,
      wizard_data_json ? JSON.stringify(wizard_data_json) : null
    ];

    console.log('📋 SQL Insert: placeholders count approx:', (insertSql.match(/\?/g) || []).length, 'params length:', insertParams.length);
    const [result] = await pool.query(insertSql, insertParams);

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
    nombre, apellidos, telefono, leads_original_telefono, tipo_base, campana, canal_adquisicion, sala_asignada, compania, back_office_info, tipificacion_back, datos_leads, comentarios_back, ultima_fecha_gestion, dni, email, direccion, ciudad,
    edad, genero, estado_civil, ocupacion, ingresos_mensuales,
    asesor_asignado, observaciones_asesor,
    
    // Campos específicos del wizard
    tipo_cliente_wizard, lead_score, telefono_registro, fecha_nacimiento,
    dni_nombre_titular, parentesco_titular, telefono_referencia_wizard, telefono_grabacion_wizard,
    direccion_completa, numero_piso_wizard, tipo_plan, servicio_contratado, velocidad_contratada,
    precio_plan, dispositivos_adicionales_wizard, plataforma_digital_wizard,
    pago_adelanto_instalacion_wizard, wizard_completado, wizard_data_json
  } = req.body;

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID de cliente es obligatorio' 
    });
  }

  try {
    console.log('📋 Backend: Actualizando cliente ID:', id, 'con datos del wizard:', {
      nombre, apellidos, telefono, tipo_cliente_wizard, lead_score, wizard_completado
    });

  // Obtener los datos actuales del cliente
  const [currentClient] = await pool.query('SELECT * FROM clientes WHERE id = ? LIMIT 1', [id]);
    if (currentClient.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }

  const clienteActual = currentClient[0];

    // Normalizar/leer el DNI que el wizard puede enviar como `dni` o `dni_nombre_titular`
    const finalDni = dni || dni_nombre_titular || null;

    // Verificar duplicados de DNI si se está actualizando
    if (finalDni && finalDni !== clienteActual.dni) {
      const [existingByDni] = await pool.query('SELECT id FROM clientes WHERE dni = ? AND id != ? LIMIT 1', [finalDni, id]);
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
        nombre: nombre !== undefined ? nombre : (clienteActual.nombre || clienteActual.telefono || ''),
      dni: dni !== undefined ? dni : (clienteActual.dni || null),
        // Manejar leads_original_telefono/mapeo
        telefono: (telefono !== undefined ? telefono : (leads_original_telefono !== undefined ? leads_original_telefono : clienteActual.telefono)),
        leads_original_telefono: leads_original_telefono !== undefined ? leads_original_telefono : clienteActual.leads_original_telefono,
        tipo_base: tipo_base !== undefined ? tipo_base : clienteActual.tipo_base,
        campana: campana !== undefined ? campana : clienteActual.campana,
        canal_adquisicion: canal_adquisicion !== undefined ? canal_adquisicion : clienteActual.canal_adquisicion,
        sala_asignada: sala_asignada !== undefined ? sala_asignada : clienteActual.sala_asignada,
        compania: compania !== undefined ? compania : clienteActual.compania,
        back_office_info: back_office_info !== undefined ? back_office_info : clienteActual.back_office_info,
        tipificacion_back: tipificacion_back !== undefined ? tipificacion_back : clienteActual.tipificacion_back,
        datos_leads: datos_leads !== undefined ? (datos_leads ? JSON.stringify(datos_leads) : null) : (clienteActual.datos_leads ? (typeof clienteActual.datos_leads === 'string' ? clienteActual.datos_leads : JSON.stringify(clienteActual.datos_leads)) : null),
        comentarios_back: comentarios_back !== undefined ? comentarios_back : clienteActual.comentarios_back,
        ultima_fecha_gestion: ultima_fecha_gestion !== undefined ? ultima_fecha_gestion : clienteActual.ultima_fecha_gestion,
    // Campos del wizard
    tipo_cliente_wizard: tipo_cliente_wizard !== undefined ? tipo_cliente_wizard : clienteActual.tipo_cliente_wizard,
        lead_score: lead_score !== undefined ? lead_score : clienteActual.lead_score,
        telefono_registro: telefono_registro !== undefined ? telefono_registro : clienteActual.telefono_registro,
        fecha_nacimiento: fecha_nacimiento !== undefined ? fecha_nacimiento : clienteActual.fecha_nacimiento,
        dni_nombre_titular: dni_nombre_titular !== undefined ? dni_nombre_titular : clienteActual.dni_nombre_titular,
        parentesco_titular: parentesco_titular !== undefined ? parentesco_titular : clienteActual.parentesco_titular,
        telefono_referencia_wizard: telefono_referencia_wizard !== undefined ? telefono_referencia_wizard : clienteActual.telefono_referencia_wizard,
        telefono_grabacion_wizard: telefono_grabacion_wizard !== undefined ? telefono_grabacion_wizard : clienteActual.telefono_grabacion_wizard,
        direccion_completa: direccion_completa !== undefined ? direccion_completa : clienteActual.direccion_completa,
        numero_piso_wizard: numero_piso_wizard !== undefined ? numero_piso_wizard : clienteActual.numero_piso_wizard,
        tipo_plan: tipo_plan !== undefined ? tipo_plan : clienteActual.tipo_plan,
        servicio_contratado: servicio_contratado !== undefined ? servicio_contratado : clienteActual.servicio_contratado,
        velocidad_contratada: velocidad_contratada !== undefined ? velocidad_contratada : clienteActual.velocidad_contratada,
        precio_plan: precio_plan !== undefined ? precio_plan : clienteActual.precio_plan,
        dispositivos_adicionales_wizard: dispositivos_adicionales_wizard !== undefined ? dispositivos_adicionales_wizard : clienteActual.dispositivos_adicionales_wizard,
        plataforma_digital_wizard: plataforma_digital_wizard !== undefined ? plataforma_digital_wizard : clienteActual.plataforma_digital_wizard,
        pago_adelanto_instalacion_wizard: pago_adelanto_instalacion_wizard !== undefined ? pago_adelanto_instalacion_wizard : clienteActual.pago_adelanto_instalacion_wizard,
        wizard_completado: wizard_completado !== undefined ? (wizard_completado ? 1 : 0) : clienteActual.wizard_completado,
        wizard_data_json: wizard_data_json !== undefined ? (wizard_data_json ? JSON.stringify(wizard_data_json) : null) : (clienteActual.wizard_data_json ? (typeof clienteActual.wizard_data_json === 'string' ? clienteActual.wizard_data_json : JSON.stringify(clienteActual.wizard_data_json)) : null)
      };

      // Actualizar el cliente con datos combinados (columnas presentes en la tabla)
      await pool.query(`
        UPDATE clientes SET
          nombre = ?, dni = ?, telefono = ?, leads_original_telefono = ?, tipo_base = ?, campana = ?, canal_adquisicion = ?, sala_asignada = ?, compania = ?, back_office_info = ?, tipificacion_back = ?, datos_leads = ?, comentarios_back = ?, ultima_fecha_gestion = ?,
          tipo_cliente_wizard = ?, lead_score = ?, telefono_registro = ?, fecha_nacimiento = ?,
          dni_nombre_titular = ?, parentesco_titular = ?, telefono_referencia_wizard = ?, telefono_grabacion_wizard = ?,
          direccion_completa = ?, numero_piso_wizard = ?, tipo_plan = ?, servicio_contratado = ?, velocidad_contratada = ?,
          precio_plan = ?, dispositivos_adicionales_wizard = ?, plataforma_digital_wizard = ?,
          pago_adelanto_instalacion_wizard = ?, wizard_completado = ?, 
          fecha_wizard_completado = CASE WHEN ? = 1 AND wizard_completado = 0 THEN NOW() ELSE fecha_wizard_completado END,
          wizard_data_json = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        datosActualizados.nombre, datosActualizados.dni, datosActualizados.telefono, datosActualizados.leads_original_telefono, datosActualizados.tipo_base, datosActualizados.campana, datosActualizados.canal_adquisicion, datosActualizados.sala_asignada, datosActualizados.compania, datosActualizados.back_office_info, datosActualizados.tipificacion_back, datosActualizados.datos_leads, datosActualizados.comentarios_back, datosActualizados.ultima_fecha_gestion,
        // Campos del wizard
        datosActualizados.tipo_cliente_wizard, datosActualizados.lead_score, datosActualizados.telefono_registro,
        datosActualizados.fecha_nacimiento, datosActualizados.dni_nombre_titular,
        datosActualizados.parentesco_titular, datosActualizados.telefono_referencia_wizard, datosActualizados.telefono_grabacion_wizard,
        datosActualizados.direccion_completa, datosActualizados.numero_piso_wizard, datosActualizados.tipo_plan,
        datosActualizados.servicio_contratado, datosActualizados.velocidad_contratada, datosActualizados.precio_plan,
        datosActualizados.dispositivos_adicionales_wizard, datosActualizados.plataforma_digital_wizard,
        datosActualizados.pago_adelanto_instalacion_wizard, datosActualizados.wizard_completado,
        datosActualizados.wizard_completado, // Para la condición CASE WHEN
        datosActualizados.wizard_data_json,
        id
      ]);

    // Obtener el cliente actualizado
    const [updatedClient] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
    
    console.log(`✅ Cliente actualizado con ID: ${id}`);
    // Notificar a clientes conectados que el cliente fue actualizado
    try {
      webSocketService.notifyAll('CLIENT_UPDATED', { cliente: updatedClient[0] });
    } catch (e) {
      console.warn('WS notify CLIENT_UPDATED failed', e.message);
    }

    // Registrar en historial si el frontend solicitó registrar la gestión
    try {
      const registrar = req.body && (req.body.registrar_historial === true || req.body.registrar_historial === '1' || req.body.registrar_historial === 1);
      if (registrar) {
        const usuarioId = req.body.usuario_id || req.body.usuarioId || req.body.userId || null;
        const descripcion = req.body.descripcion_hist || observaciones_asesor || req.body.observaciones_asesor || 'Gestión realizada por asesor';
        const accion = wizard_completado ? 'gestion_wizard' : 'gestion';
        const estadoNuevo = datosActualizados && datosActualizados.estado ? datosActualizados.estado : null;

        try {
          await pool.query('INSERT INTO historial_cliente (cliente_id, usuario_id, accion, descripcion, estado_nuevo) VALUES (?, ?, ?, ?, ?)', [id, usuarioId || null, accion, descripcion, estadoNuevo]);
          // Notificar a clientes interesados que hay un nuevo historial (página de reportes puede suscribirse)
          try { webSocketService.notifyAll('HISTORIAL_UPDATED', { clienteId: id, usuario_id: usuarioId, accion, descripcion, fecha: new Date() }); } catch (e) { console.warn('WS notify HISTORIAL_UPDATED failed', e.message); }
        } catch (e) {
          console.warn('No se pudo insertar en historial_cliente al actualizar (posible ausencia de tabla):', e.message);
        }
      }
    } catch (e) {
      console.warn('Error comprobando registrar_historial:', e.message);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Cliente actualizado exitosamente',
      cliente: updatedClient[0]
    });

  } catch (err) {
    console.error('Error updateCliente', err);
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
      return res.status(404).json({ 
        success: false, 
        message: 'Asesor no encontrado' 
      });
    }
    
    const asesorNombre = asesorInfo[0].asesor_nombre;
    
    // Obtener todos los clientes asignados a este asesor específico (usando usuario_id)
    // Construir SELECT dinámico y seguro para evitar referencias a columnas inexistentes
    let clientes = [];
    try {
      const desired = [
        { col: 'id', as: 'id' },
        { col: 'nombre', as: 'nombre' },
        { col: 'telefono', as: 'telefono' },
        { col: 'leads_original_telefono', as: 'leads_original_telefono' },
        { col: 'dni', as: 'dni' },
        { col: 'email', as: 'email' },
        { col: 'direccion', as: 'direccion' },
        { col: 'campana', as: 'campana' },
        { col: 'compania', as: 'compania' },
        { col: 'sala_asignada', as: 'sala_asignada' },
        { col: 'estado', as: 'estado' },
        { col: 'observaciones_asesor', as: 'observaciones_asesor' },
        { col: 'created_at', as: 'fecha' },
        { col: 'fecha_ultimo_contacto', as: 'seguimiento' },
        { col: 'servicio_contratado', as: 'servicio' }
      ];

      const dbName = process.env.DB_NAME || 'albru';
      const colNames = desired.map(d => d.col);
      const placeholders = colNames.map(() => '?').join(',');
      const [existingCols] = await pool.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes' AND COLUMN_NAME IN (${placeholders})`, [dbName, ...colNames]);
      const existingSet = new Set((existingCols || []).map(r => r.COLUMN_NAME));

      const selectParts = desired.map(d => existingSet.has(d.col) ? `${d.col} as ${d.as}` : `NULL as ${d.as}`);

      let rows = [];

      // Si la columna 'asesor_asignado' existe, la usamos en el WHERE
      if (existingSet.has('asesor_asignado')) {
        const selectSql = `SELECT ${selectParts.join(', ')} FROM clientes c WHERE c.asesor_asignado = ? ORDER BY c.created_at DESC`;
        [rows] = await pool.query(selectSql, [asesorId]);

        // Si no hay filas, intentar interpretar asesorId como usuario_id y mapear a asesor.id
        if ((!rows || rows.length === 0) && asesorId) {
          const [asesorMatch] = await pool.query('SELECT id FROM asesores WHERE usuario_id = ? LIMIT 1', [asesorId]);
          if (asesorMatch && asesorMatch.length > 0) {
            const asesorIdFound = asesorMatch[0].id;
            [rows] = await pool.query(selectSql, [asesorIdFound]);
          }
        }
      } else {
        // Si no existe la columna, intentar fallback usando wizard_data_json
        try {
          // Si el asesorId corresponde a un usuario_id, mapearlo a asesor.id
          let asesorIdToMatch = asesorId;
          const [asesorMatch] = await pool.query('SELECT id FROM asesores WHERE usuario_id = ? LIMIT 1', [asesorId]);
          if (asesorMatch && asesorMatch.length > 0) {
            asesorIdToMatch = asesorMatch[0].id;
          }

          // Intentar comparar assigned_asesor_id contra ambos posibles formatos:
          // - el id de la tabla `asesores` (asesor.id)
          // - el id del usuario (usuario.id) que a veces se usa
          const jsonSql = `SELECT ${selectParts.join(', ')} FROM clientes c WHERE JSON_UNQUOTE(JSON_EXTRACT(COALESCE(c.wizard_data_json, JSON_OBJECT()), '$.assigned_asesor_id')) IN (?, ?) ORDER BY c.created_at DESC`;
          const [jsonRows] = await pool.query(jsonSql, [String(asesorIdToMatch), String(asesorId)]);
          rows = jsonRows;
        } catch (e) {
          console.warn('Fallback JSON a assigned_asesor_id falló:', e.message);
        }
      }

      clientes = rows;
    } catch (err) {
      console.warn('Error comprobando columnas o extrayendo datos de clientes, error:', err.message);
      // Como último recurso intentar una consulta simple sin columnas específicas
  const [rows] = await pool.query(`SELECT id, nombre, telefono, created_at as fecha FROM clientes WHERE asesor_asignado = ? ORDER BY created_at DESC`, [asesorId]);
      clientes = rows;
    }
    
    console.log(`✅ Encontrados ${clientes.length} clientes para asesor ${asesorNombre} (ID: ${asesorId})`);
    
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

module.exports = {
  getClienteByTelefono,
  getClienteByDni,
  searchClientes,
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  getClientesByAsesor
};

// -----------------------------
// Durable lock endpoints
// -----------------------------

// POST /api/clientes/:id/lock
const lockCliente = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ success: false, message: 'id inválido' });

  // advisor id puede venir como advisorId o asesorId; en producción usar claims del token
  const advisorId = req.body.advisorId || req.body.asesorId || null;
  const duration = Number(req.body.durationSeconds) || 300; // segundos

  if (!advisorId) return res.status(400).json({ success: false, message: 'advisorId requerido' });

  const token = crypto.randomBytes(16).toString('hex');

  try {
    // Usar tabla separada `cliente_locks` para no tocar la estructura de `clientes`.
    // Proceso: seleccionar FOR UPDATE, insertar o actualizar según corresponda.
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query('SELECT locked_by, lock_expires_at FROM cliente_locks WHERE cliente_id = ? FOR UPDATE', [id]);

      if (!rows || rows.length === 0) {
        // No existe lock: insertarlo
        await conn.query('INSERT INTO cliente_locks (cliente_id, locked_by, locked_at, lock_expires_at, lock_token) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? SECOND), ?)', [id, advisorId, duration, token]);
      } else {
        const lockInfo = rows[0];
        const expiresAt = lockInfo.lock_expires_at;
        const now = new Date();
        if (!expiresAt || new Date(expiresAt) < now || lockInfo.locked_by == advisorId) {
          // Reasignar o refrescar lock
          await conn.query('UPDATE cliente_locks SET locked_by = ?, locked_at = NOW(), lock_expires_at = DATE_ADD(NOW(), INTERVAL ? SECOND), lock_token = ? WHERE cliente_id = ?', [advisorId, duration, token, id]);
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

    // Recuperar info del lock recién creado/actualizado
    const [newRows] = await pool.query('SELECT locked_by, locked_at, lock_expires_at FROM cliente_locks WHERE cliente_id = ? LIMIT 1', [id]);
    const newLock = newRows[0] || null;
    try { webSocketService.notifyAll('CLIENT_LOCKED', { clienteId: id, locked_by: newLock && newLock.locked_by ? newLock.locked_by : advisorId, lock_expires_at: newLock && newLock.lock_expires_at ? newLock.lock_expires_at : null }); } catch (e) { console.warn('WS notify CLIENT_LOCKED failed', e.message); }
    return res.json({ success: true, locked: true, lockToken: token, expiresAt: newLock && newLock.lock_expires_at ? newLock.lock_expires_at : null });
  } catch (e) {
    console.error('Error lockCliente:', e);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

// POST /api/clientes/:id/unlock
const unlockCliente = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ success: false, message: 'id inválido' });

  const advisorId = req.body.advisorId || req.body.asesorId || null;
  const lockToken = req.body.lockToken || null;

  if (!advisorId && !lockToken) return res.status(400).json({ success: false, message: 'advisorId o lockToken requerido' });

  try {
    const [result] = await pool.query(
      `DELETE FROM cliente_locks WHERE cliente_id = ? AND (lock_token = ? OR locked_by = ?)`,
      [id, lockToken || '', advisorId || null]
    );

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

// POST /api/clientes/:id/heartbeat
const heartbeatCliente = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ success: false, message: 'id inválido' });

  const advisorId = req.body.advisorId || req.body.asesorId || null;
  const lockToken = req.body.lockToken || null;
  const extendSeconds = Number(req.body.extendSeconds) || 300;

  if (!advisorId && !lockToken) return res.status(400).json({ success: false, message: 'advisorId o lockToken requerido' });

  try {
    const [result] = await pool.query(
      `UPDATE cliente_locks SET lock_expires_at = DATE_ADD(NOW(), INTERVAL ? SECOND) WHERE cliente_id = ? AND (lock_token = ? OR locked_by = ?)`,
      [extendSeconds, id, lockToken || '', advisorId || null]
    );

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

// GET /api/clientes/:id/lock
const getLockStatus = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ success: false, message: 'id inválido' });

  try {
    const [rows] = await pool.query('SELECT locked_by, locked_at, lock_expires_at FROM cliente_locks WHERE cliente_id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.json({ success: true, lock: null });
    return res.json({ success: true, lock: rows[0] });
  } catch (e) {
    console.error('Error getLockStatus:', e);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};

// Añadir nuevas funciones a exports
// (Los endpoints de lock fueron removidos para restaurar el estado anterior del archivo.)

module.exports = {
  getClienteByTelefono,
  getClienteByDni,
  searchClientes,
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  getClientesByAsesor
};
