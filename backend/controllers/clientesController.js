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

module.exports = {
  getClienteByLead,
  getClienteByDni,
  searchClientes,
  getClienteById
};