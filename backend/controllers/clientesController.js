const pool = require('../config/database');
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
    const limit = Math.min(1000, Number(req.query.limit) || 100);
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

    // Construir cláusula WHERE para excluir clientes ya gestionados
    let whereClause = '';
    if (colSet.has('estado')) {
      whereClause = "WHERE (c.estado IS NULL OR c.estado != 'gestionado')";
    } else if (colSet.has('wizard_data_json')) {
      // Usar flag JSON fallback
      whereClause = `WHERE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(COALESCE(c.wizard_data_json, JSON_OBJECT()), '$.moved_to_gtr')), 'false') != 'true'`;
    }

    const sql = `
      SELECT
        c.*,
        COALESCE(u_direct.nombre, u_from_asesor.nombre) AS asesor_nombre
      FROM clientes c
      LEFT JOIN usuarios u_direct ON c.asesor_asignado = u_direct.id AND u_direct.tipo = 'asesor'
      LEFT JOIN asesores a ON c.asesor_asignado = a.id
      LEFT JOIN usuarios u_from_asesor ON a.usuario_id = u_from_asesor.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ?
    `;

    const [rows] = await pool.query(sql, [limit]);
    
    console.log(`📋 Obteniendo ${rows.length} clientes desde la base de datos`);
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
    // Intentamos devolver también el nombre del asesor si la columna existe y está poblada
    const [rows] = await pool.query(`
      SELECT c.*, COALESCE(u_direct.nombre, u_from_asesor.nombre) AS asesor_nombre
      FROM clientes c
      LEFT JOIN usuarios u_direct ON c.asesor_asignado = u_direct.id AND u_direct.tipo = 'asesor'
      LEFT JOIN asesores a ON c.asesor_asignado = a.id
      LEFT JOIN usuarios u_from_asesor ON a.usuario_id = u_from_asesor.id
      WHERE c.id = ?
      LIMIT 1
    `, [id]);
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
    nombre, apellidos, telefono, dni, email, direccion, ciudad,
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
      fecha_nacimiento: fecha_nacimiento || null,
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
      wizard_data_json: wizard_data_json ? JSON.stringify(wizard_data_json) : null
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
    pushIfExists('telefono_registro', datosActualizados.telefono_registro);
    pushIfExists('fecha_nacimiento', datosActualizados.fecha_nacimiento);
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

    // Siempre actualizar updated_at si la columna existe
    if (colSet.has('updated_at')) {
      toUpdate.push('updated_at = NOW()');
    }

    if (toUpdate.length > 0) {
      const updateSql = `UPDATE clientes SET ${toUpdate.join(', ')} WHERE id = ?`;
      values.push(id);
      await pool.query(updateSql, values);
    }

    // Si la gestión indica que el cliente debe moverse a GTR (por ejemplo
    // wizard_completado = true) entonces limpiar el asesor asignado y marcar
    // el estado como 'gestionado' para que desaparezca del panel de asesor y
    // quede disponible en el panel de gestiones (GTR). Aceptamos también
    // un flag explícito req.body.moveToGtr.
    const moveToGtrFlag = (datosActualizados.wizard_completado && Number(datosActualizados.wizard_completado) === 1) || (req.body && (req.body.moveToGtr === true || req.body.moveToGtr === 'true'));

    // Si se requiere mover a GTR, aplicar una actualización explícita y atómica
    // para limpiar asesor_asignado y marcar estado, evitando problemas con
    // la construcción dinámica previa.
    if (moveToGtrFlag) {
      try {
        const updates = [];
        const params = [];
        if (colSet.has('asesor_asignado')) {
          updates.push('asesor_asignado = NULL');
        }
        if (colSet.has('estado')) {
          updates.push("estado = 'gestionado'");
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
      const usuarioId = req.body && req.body.usuario_id ? req.body.usuario_id : null;
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
          webSocketService.notifyAll('CLIENT_MOVED_TO_GTR', {
            clienteId: id,
            dni: clienteMin.dni,
            informe: descripcion,
            fecha: new Date().toISOString(),
            usuarioId: usuarioId,
            usuarioNombre: usuarioNombre,
            accion: accion
          });
        } catch (e) { console.warn('WS notify CLIENT_MOVED_TO_GTR failed', e.message); }
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
      return res.status(404).json({
        success: false,
        message: 'Asesor no encontrado'
      });
    }

    const asesorNombre = asesorInfo[0].asesor_nombre;

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
      leads_original_telefono: 'c.leads_original_telefono'
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

    const selectClause = selectParts.join(',\n        ');

  // Buscar clientes donde 'asesor_asignado' sea el id de usuario del asesor
  // O donde 'asesor_asignado' sea el id de la tabla `asesores` que referencia a este usuario.
      // Excluir clientes gestionados (si existe columna 'estado' o flag JSON)
      let excludeClause = '';
      if (colSet.has('estado')) {
        excludeClause = "AND (c.estado IS NULL OR c.estado != 'gestionado')";
      } else if (colSet.has('wizard_data_json')) {
        excludeClause = `AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(COALESCE(c.wizard_data_json, JSON_OBJECT()), '$.moved_to_gtr')), 'false') != 'true'`;
      }

      const sql = `SELECT\n        ${selectClause}\n      FROM clientes c\n      WHERE (c.asesor_asignado = ? OR c.asesor_asignado IN (SELECT id FROM asesores WHERE usuario_id = ?)) ${excludeClause}\n      ORDER BY c.created_at DESC`;

  const [clientes] = await pool.query(sql, [asesorId, asesorId]);

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
  getClientesByAsesor
};