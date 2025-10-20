const pool = require('../config/database');

// Controlador para manejar la lógica de asesores

const getAsesores = async (req, res) => {
  try {
    // Obtener solo los asesores reales usando la nueva estructura con JOIN
    const [rows] = await pool.query(`
      SELECT 
        a.id as asesor_id,
        u.id as usuario_id,
        u.nombre,
        u.email,
        u.telefono,
        u.estado,
        a.clientes_asignados,
        a.meta_mensual,
        a.ventas_realizadas,
        a.comision_porcentaje,
        g.nombre as gtr_nombre
      FROM asesores a
      JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN gtr gt ON a.gtr_asignado = gt.id
      LEFT JOIN usuarios g ON gt.usuario_id = g.id
      WHERE u.estado = 'activo' AND u.tipo = 'asesor'
    `);
    console.log('👥 Obteniendo lista de asesores (solo tipo asesor) desde la nueva estructura');
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
    // Lista blanca de columnas permitidas para actualizar desde la API (nueva estructura)
    const allowed = new Set([
      // Información básica
      'nombre','apellidos','telefono','email','dni',
      // Campos del wizard del asesor
      'edad','genero','estado_civil','ocupacion','ingresos_mensuales','dependientes_economicos',
      // Información de contacto adicional
      'direccion','ciudad','departamento','codigo_postal','telefono_alternativo',
      // Información del seguro
      'tipo_seguro_interes','monto_asegurado_deseado','tiene_seguros_actuales','seguros_actuales',
      // Información financiera
      'banco_principal','tipo_cuenta','ingresos_adicionales','gastos_mensuales',
      // Preferencias de contacto
      'horario_preferido_contacto','medio_contacto_preferido',
      // Estados y asignaciones
      'asesor_asignado','estado','prioridad',
      // Fechas importantes
      'fecha_primer_contacto','fecha_ultimo_contacto','fecha_cierre_estimada',
      // Notas y observaciones
      'notas','observaciones_asesor',
      // CAMPOS ESPECÍFICOS DEL WIZARD
      'tipo_cliente_wizard','lead_score','telefono_registro','fecha_nacimiento','lugar_nacimiento',
      'dni_nombre_titular','parentesco_titular','telefono_referencia_wizard','telefono_grabacion_wizard',
      'direccion_completa','numero_piso_wizard','tipo_plan','servicio_contratado','velocidad_contratada',
      'precio_plan','dispositivos_adicionales_wizard','plataforma_digital_wizard',
      'pago_adelanto_instalacion_wizard','wizard_completado','fecha_wizard_completado','wizard_data_json'
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
    const [rows] = await pool.query('SELECT id, nombre, telefono, dni, email, direccion, estado, observaciones_asesor as gestion, fecha_primer_contacto as fecha, fecha_ultimo_contacto as seguimiento FROM clientes WHERE asesor_asignado = ? ORDER BY created_at DESC', [asesorId]);
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
    // Actualizar el estado del asesor en la tabla usuarios (nueva estructura)
    const [result] = await pool.query(`
      UPDATE usuarios u 
      JOIN asesores a ON u.id = a.usuario_id 
      SET u.estado = ? 
      WHERE a.id = ?
    `, [estado, id]);
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
    const [rows] = await pool.query(`
      SELECT 
        a.id as asesor_id,
        u.id as usuario_id,
        u.nombre,
        u.email,
        u.telefono,
        u.estado,
        a.clientes_asignados,
        a.meta_mensual,
        a.ventas_realizadas,
        a.comision_porcentaje
      FROM asesores a
      JOIN usuarios u ON a.usuario_id = u.id
      WHERE u.nombre LIKE ? AND u.tipo = 'asesor'
    `, [`%${nombre}%`]);
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