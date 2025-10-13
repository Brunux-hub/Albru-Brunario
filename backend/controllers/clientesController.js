const pool = require('../config/database');

// GET /api/clientes/lead/:leadId
const getClienteByLead = async (req, res) => {
  const { leadId } = req.params;
  if (!leadId) return res.status(400).json({ success:false, message: 'leadId requerido' });

  try {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE lead_id = ? LIMIT 1', [leadId]);
    if (!rows || rows.length === 0) return res.status(404).json({ success:false, message: 'Cliente no encontrado' });
    return res.json({ success: true, cliente: rows[0] });
  } catch (err) {
    console.error('Error getClienteByLead', err);
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
      `SELECT id, nombre, telefono, dni, correo_electronico, lead_id, estado_cliente, plan_seleccionado
       FROM clientes
       WHERE nombre LIKE ? OR dni LIKE ? OR lead_id LIKE ? OR correo_electronico LIKE ?
       ORDER BY fecha_asignacion DESC
       LIMIT ? OFFSET ?`,
      [like, like, like, like, limit, offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM clientes WHERE nombre LIKE ? OR dni LIKE ? OR lead_id LIKE ? OR correo_electronico LIKE ?`,
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
      SELECT c.id, c.nombre, c.telefono, c.dni, c.correo_electronico, 
             c.direccion, c.distrito, c.plan_seleccionado, c.precio_final,
             c.estado_cliente, c.observaciones_asesor, c.fecha_asignacion as created_at,
             c.lead_id, a.nombre as asesor_nombre
      FROM clientes c 
      LEFT JOIN asesores a ON c.asesor_asignado = a.id 
      ORDER BY c.fecha_asignacion DESC 
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

// POST /api/clientes (crear nuevo cliente/lead)
const createCliente = async (req, res) => {
  const { 
    lead_id, nombre, telefono, dni, correo_electronico, direccion, distrito, 
    plan_seleccionado, precio_final, estado_cliente, asesor_asignado,
    observaciones_asesor, coordenadas, campania, canal, comentarios_iniciales
  } = req.body;

  // Validación básica: solo lead_id es obligatorio
  if (!lead_id) {
    return res.status(400).json({ 
      success: false, 
      message: 'Lead ID es obligatorio' 
    });
  }

  try {
    // Verificar si ya existe un cliente con el mismo lead_id
    const [existingByLead] = await pool.query('SELECT id FROM clientes WHERE lead_id = ? LIMIT 1', [lead_id]);
    if (existingByLead.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ya existe un cliente con este Lead ID' 
      });
    }

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

    if (telefono) {
      const [existingByPhone] = await pool.query('SELECT id FROM clientes WHERE telefono = ? LIMIT 1', [telefono]);
      if (existingByPhone.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'Ya existe un cliente con este teléfono' 
        });
      }
    }

    // Insertar el nuevo cliente/lead
    const [result] = await pool.query(`
      INSERT INTO clientes (
        lead_id, nombre, telefono, dni, correo_electronico, direccion, distrito,
        plan_seleccionado, precio_final, estado_cliente, asesor_asignado, observaciones_asesor,
        coordenadas, campania, canal, comentarios_iniciales
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      lead_id,
      nombre || null,
      telefono || null,
      dni || null,
      correo_electronico || null,
      direccion || null,
      distrito || null,
      plan_seleccionado || null,
      precio_final || null,
      estado_cliente || 'nuevo',
      asesor_asignado || null,
      observaciones_asesor || null,
      coordenadas || null,
      campania || null,
      canal || null,
      comentarios_iniciales || null
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

module.exports = {
  getClienteByLead,
  getClienteByDni,
  searchClientes,
  getAllClientes,
  getClienteById,
  createCliente
};