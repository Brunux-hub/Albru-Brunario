const pool = require('../config/database');

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
      `SELECT id, nombre, telefono, dni, email, estado, ocupacion
       FROM clientes
       WHERE nombre LIKE ? OR dni LIKE ? OR telefono LIKE ? OR email LIKE ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [like, like, like, like, limit, offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM clientes WHERE nombre LIKE ? OR dni LIKE ? OR telefono LIKE ? OR email LIKE ?`,
      [like, like, like, like]
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
    const [rows] = await pool.query(`
      SELECT c.id, c.nombre, c.telefono, c.dni, c.email, 
             c.direccion, c.ciudad,
             c.estado, c.prioridad, c.observaciones_asesor, c.created_at,
             a.id as asesor_id, u.nombre as asesor_nombre
      FROM clientes c 
      LEFT JOIN asesores a ON c.asesor_asignado = a.id 
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      ORDER BY c.created_at DESC 
      LIMIT ?
    `, [limit]);
    
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

    // Insertar el nuevo cliente con todos los campos del wizard
    const [result] = await pool.query(`
      INSERT INTO clientes (
        nombre, apellidos, telefono, dni, email, direccion, ciudad,
        edad, genero, estado_civil, ocupacion, ingresos_mensuales,
        asesor_asignado, observaciones_asesor, estado,
        tipo_cliente_wizard, lead_score, telefono_registro, fecha_nacimiento,
        dni_nombre_titular, parentesco_titular, telefono_referencia_wizard, telefono_grabacion_wizard,
        direccion_completa, numero_piso_wizard, tipo_plan, servicio_contratado, velocidad_contratada,
        precio_plan, dispositivos_adicionales_wizard, plataforma_digital_wizard,
        pago_adelanto_instalacion_wizard, wizard_completado, fecha_wizard_completado, wizard_data_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      safeNombre,
      apellidos || null,
      telefono,
      dni || null,
      email || null,
      direccion || null,
      ciudad || null,
      edad || null,
      genero || null,
      estado_civil || null,
      ocupacion || null,
      ingresos_mensuales || null,
      asesor_asignado || null,
      observaciones_asesor || null,
      'nuevo',
      // Campos del wizard
      tipo_cliente_wizard || null,
      lead_score || null,
      telefono_registro || null,
      fecha_nacimiento || null,
      dni_nombre_titular || null,
      parentesco_titular || null,
      telefono_referencia_wizard || null,
      telefono_grabacion_wizard || null,
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
    ]);

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

    // Actualizar el cliente con datos combinados
    await pool.query(`
      UPDATE clientes SET
        nombre = ?, apellidos = ?, telefono = ?, dni = ?, email = ?, direccion = ?, ciudad = ?,
        edad = ?, genero = ?, estado_civil = ?, ocupacion = ?, ingresos_mensuales = ?,
        asesor_asignado = ?, observaciones_asesor = ?,
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
      datosActualizados.nombre, datosActualizados.apellidos, datosActualizados.telefono, datosActualizados.dni,
      datosActualizados.email, datosActualizados.direccion, datosActualizados.ciudad,
      datosActualizados.edad, datosActualizados.genero, datosActualizados.estado_civil, datosActualizados.ocupacion,
      datosActualizados.ingresos_mensuales, datosActualizados.asesor_asignado,
      datosActualizados.observaciones_asesor,
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
    const [clientes] = await pool.query(`
      SELECT 
        c.id, c.nombre, c.telefono, c.dni, c.email, 
        c.direccion, c.estado, c.observaciones_asesor,
        c.created_at as fecha, c.fecha_ultimo_contacto as seguimiento,
        c.servicio_contratado as servicio
      FROM clientes c 
      WHERE c.asesor_asignado = ?
      ORDER BY c.created_at DESC
    `, [asesorId]);
    
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