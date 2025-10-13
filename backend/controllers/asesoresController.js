const pool = require('../config/database');

// Controlador para manejar la lógica de asesores

const getAsesores = async (req, res) => {
  try {
    // Obtener la lista de asesores desde la base de datos
    const [rows] = await pool.query('SELECT * FROM asesores');
    console.log('👥 Obteniendo lista de asesores desde la base de datos');
    res.status(200).json({ 
      success: true,
      asesores: rows,
      total: rows.length
    });
  } catch (error) {
    console.error('Error al obtener datos de los asesores:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const actualizarDatosCliente = async (req, res) => {
  try {
    const { clienteId, datos } = req.body;

    console.log(`✏️ Actualizando datos del cliente. Request body:`, req.body);
    console.log(`✏️ Cliente ID: ${clienteId}, Datos:`, datos);

    if (!clienteId) {
      return res.status(400).json({ success: false, message: 'clienteId es requerido' });
    }

    if (!datos || typeof datos !== 'object') {
      return res.status(400).json({ success: false, message: 'datos debe ser un objeto válido' });
    }
    // Lista blanca de columnas permitidas para actualizar desde la API
    const allowed = new Set([
      // Campos básicos
      'nombre','telefono','dni','correo_electronico','direccion','distrito',
      'plan_seleccionado','precio_final','observaciones_asesor','comentario_validacion',
      'fecha_cita','hora_cita','estado_cliente','asesor_asignado','validador_asignado',
      'numero_referencia','numero_registro','numero_grabacion',
      'tipo_documento','fecha_nacimiento','lugar_nacimiento','titular_linea',
      'numero_piso','interior','tipo_cliente','dispositivos_adicionales',
      'pago_adelanto_instalacion','plataforma_digital','fecha_programacion',
      'fecha_instalacion','fecha_lead','score','coordenadas','campania',
      'canal','comentarios_iniciales','servicio','seguimiento','gestion',
      // Campos nuevos del wizard
      'lead_score','tipo_cliente_wizard','telefono_registro','dni_nombre_titular',
      'parentesco_titular','telefono_referencia_wizard','telefono_grabacion_wizard',
      'departamento','direccion_completa','numero_piso_wizard','tipo_plan',
      'servicio_contratado','velocidad_contratada','precio_plan',
      'dispositivos_adicionales_wizard','plataforma_digital_wizard',
      'pago_adelanto_instalacion_wizard','wizard_completado',
      'fecha_wizard_completado','wizard_data_json'
    ]);

    // Construir SET dinámico solo con campos permitidos
    const keys = Object.keys(datos || {}).filter(k => allowed.has(k));
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay datos permitidos para actualizar' });
    }

    // Construir SET con placeholders '?' para mysql2
    const setClauses = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => datos[k]);
    values.push(clienteId);

    const sql = `UPDATE clientes SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const [result] = await pool.query(sql, values);
    // result.affectedRows puede usarse para validar
    if (result && result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    res.status(200).json({ 
      success: true,
      message: 'Datos actualizados correctamente', 
      clienteId,
      datos 
    });
  } catch (error) {
    console.error('Error al actualizar datos del cliente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const obtenerDatosClientes = async (req, res) => {
  try {
    // Determinar el id del asesor: middleware (req.asesorId), query o params
    const asesorId = req.asesorId || req.query.asesorId || req.params.asesorId;
    if (!asesorId) {
      return res.status(400).json({ success: false, message: 'asesorId requerido (middleware, query o params)'});
    }

    // Obtener datos de clientes desde la base de datos (campo real: asesor_asignado)
    const [rows] = await pool.query('SELECT id, nombre, telefono, dni, correo_electronico, direccion, distrito, plan_seleccionado, precio_final, estado_cliente as estado, observaciones_asesor as gestion, fecha_asignacion as fecha, fecha_cita as seguimiento FROM clientes WHERE asesor_asignado = ? ORDER BY fecha_asignacion DESC', [asesorId]);
    console.log(`📋 Obteniendo datos de clientes para asesor ${asesorId} desde la base de datos`);
    res.status(200).json({ 
      success: true,
      clientes: rows
    });
  } catch (error) {
    console.error('Error al obtener datos de los clientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const updateEstadoAsesor = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  
  console.log(`🔄 Cambiando estado del asesor ${id} a: ${estado}`);
  
  try {
    // Actualizar el estado del asesor en la base de datos
    const [result] = await pool.query('UPDATE asesores SET estado = ? WHERE id = ?', [estado, id]);
    if (result && result.affectedRows > 0) {
      res.status(200).json({
        success: true,
        message: 'Estado del asesor actualizado'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Asesor no encontrado'
      });
    }
  } catch (error) {
    console.error('Error al actualizar estado del asesor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const buscarAsesor = async (req, res) => {
  const { nombre } = req.params;
  console.log(`🔍 Buscando asesor con nombre: ${nombre}`);

  try {
    const [rows] = await pool.query('SELECT * FROM asesores WHERE nombre = ?', [nombre]);
    if (rows.length > 0) {
      res.status(200).json({
        success: true,
        asesor: rows[0]
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Asesor "${nombre}" no encontrado`
      });
    }
  } catch (error) {
    console.error('Error al buscar asesor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getAsesores,
  actualizarDatosCliente,
  obtenerDatosClientes,
  updateEstadoAsesor,
  buscarAsesor
};