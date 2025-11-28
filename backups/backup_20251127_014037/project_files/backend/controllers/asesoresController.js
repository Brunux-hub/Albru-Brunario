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

    // Obtener estadísticas del día actual para cada asesor (hora Perú UTC-5)
    const [stats] = await pool.query(`
      SELECT 
        asesor_id,
        clientes_atendidos,
        clientes_reasignados
      FROM asesor_stats_daily
      WHERE fecha = DATE(CONVERT_TZ(NOW(), '+00:00', '-05:00'))
    `);

    // Obtener gestiones totales del día (contando duplicados)
    // 🔧 FIX: Usar fecha_wizard_completado y wizard_completado=1 para consistencia con reportes
    const [gestionesTotales] = await pool.query(`
      SELECT 
        c.asesor_asignado as asesor_id,
        COUNT(DISTINCT c.id) as clientes_unicos,
        COALESCE(SUM(c.cantidad_duplicados), COUNT(c.id)) as gestiones_totales
      FROM clientes c
      WHERE c.asesor_asignado IS NOT NULL
        AND c.wizard_completado = 1
        AND DATE(c.fecha_wizard_completado) = CURDATE()
        AND (c.es_duplicado = FALSE OR c.es_duplicado IS NULL)
      GROUP BY c.asesor_asignado
    `);

    // Mapear estadísticas por asesor_id
    const statsMap = {};
    stats.forEach(stat => {
      statsMap[stat.asesor_id] = {
        atendidos: stat.clientes_atendidos || 0,
        reasignados: stat.clientes_reasignados || 0
      };
    });

    // Mapear gestiones totales
    const gestionesMap = {};
    gestionesTotales.forEach(g => {
      gestionesMap[g.asesor_id] = {
        clientes_unicos: g.clientes_unicos || 0,
        gestiones_totales: g.gestiones_totales || 0
      };
    });

    // 🔍 DEBUG: Log detallado de gestiones por asesor
    console.log('📊 [GTR PANEL] Gestiones por Asesor HOY:');
    gestionesTotales.forEach(g => {
      console.log(`  • Asesor ID ${g.asesor_id}: ${g.gestiones_totales} gestiones, ${g.clientes_unicos} clientes únicos`);
    });

    // Agregar estadísticas a cada asesor
    const asesoresWithStats = rows.map(asesor => {
      const gestiones = gestionesMap[asesor.asesor_id]?.gestiones_totales || 0;
      const uniqueClientes = gestionesMap[asesor.asesor_id]?.clientes_unicos || 0;
      
      // Log si hay discrepancia
      if (gestiones === 0 && asesor.clientes_asignados > 0) {
        console.log(`⚠️ [GTR PANEL] Asesor ${asesor.nombre} (ID: ${asesor.asesor_id}) tiene ${asesor.clientes_asignados} clientes asignados pero 0 gestiones HOY`);
      }
      
      return {
        ...asesor,
        clientes_atendidos_hoy: statsMap[asesor.asesor_id]?.atendidos || 0,
        clientes_reasignados_hoy: statsMap[asesor.asesor_id]?.reasignados || 0,
        clientes_unicos_hoy: uniqueClientes,
        gestiones_totales_hoy: gestiones
      };
    });

    console.log(`👥 [GTR PANEL] Obteniendo lista de ${asesoresWithStats.length} asesores con estadísticas del día`);
    res.status(200).json({ 
      success: true,
      asesores: asesoresWithStats,
      total: asesoresWithStats.length
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

    // Construir SELECT dinámico seguro: verificar columnas existentes y usar NULL como fallback
    const desired = [
      { col: 'id', as: 'id' },
      { col: 'nombre', as: 'nombre' },
      { col: 'telefono', as: 'telefono' },
      { col: 'dni', as: 'dni' },
      { col: 'email', as: 'email' },
      { col: 'direccion', as: 'direccion' },
      { col: 'estado', as: 'estado' },
      { col: 'observaciones_asesor', as: 'gestion' },
      { col: 'fecha_primer_contacto', as: 'fecha' },
      { col: 'fecha_ultimo_contacto', as: 'seguimiento' },
      { col: 'es_duplicado', as: 'es_duplicado' },
      { col: 'cantidad_duplicados', as: 'cantidad_duplicados' },
      { col: 'telefono_principal_id', as: 'telefono_principal_id' },
      { col: 'estatus_comercial_categoria', as: 'categoria' },
      { col: 'estatus_comercial_subcategoria', as: 'subcategoria' },
      { col: 'campana', as: 'campana' }
    ];

    const dbName = process.env.DB_NAME || 'albru';
    const colNames = desired.map(d => d.col);
    const placeholders = colNames.map(() => '?').join(',');
    const [existingCols] = await pool.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clientes' AND COLUMN_NAME IN (${placeholders})`, [dbName, ...colNames]);
    const existingSet = new Set((existingCols || []).map(r => r.COLUMN_NAME));

    const selectParts = desired.map(d => existingSet.has(d.col) ? `${d.col} as ${d.as}` : `NULL as ${d.as}`);
    // SOLO mostrar registros principales (no duplicados)
    const selectSql = `SELECT ${selectParts.join(', ')} FROM clientes WHERE asesor_asignado = ? AND (es_duplicado = FALSE OR es_duplicado IS NULL) ORDER BY created_at DESC`;

    let [rows] = await pool.query(selectSql, [asesorId]);

    // Si no hay filas, intentar interpretar asesorId como usuario_id (buscar asesor.id)
    if ((!rows || rows.length === 0) && asesorId) {
      const [asesorMatch] = await pool.query('SELECT id FROM asesores WHERE usuario_id = ? LIMIT 1', [asesorId]);
      if (asesorMatch && asesorMatch.length > 0) {
        const asesorIdFound = asesorMatch[0].id;
        [rows] = await pool.query(selectSql, [asesorIdFound]);
      }
    }

    // Fallback: buscar assigned_asesor_id dentro de wizard_data_json
    if ((!rows || rows.length === 0) && asesorId) {
      try {
        const jsonSql = `SELECT ${selectParts.join(', ')} FROM clientes WHERE JSON_UNQUOTE(JSON_EXTRACT(COALESCE(wizard_data_json, JSON_OBJECT()), '$.assigned_asesor_id')) = ? ORDER BY created_at DESC`;
        const [jsonRows] = await pool.query(jsonSql, [asesorId]);
        rows = jsonRows;
      } catch (e) {
        console.warn('Fallback JSON a assigned_asesor_id falló:', e.message);
      }
    }

    console.log(`📋 Obteniendo ${rows.length} clientes para asesor ${asesorId}`);
    res.status(200).json({ success: true, clientes: rows });
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

const obtenerDuplicados = async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`📋 Obteniendo duplicados para cliente ID: ${id}`);
    
    // Primero obtener el cliente principal
    const [clientePrincipal] = await pool.query(`
      SELECT telefono, es_duplicado, telefono_principal_id
      FROM clientes
      WHERE id = ?
    `, [id]);
    
    if (clientePrincipal.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cliente no encontrado' 
      });
    }
    
    const cliente = clientePrincipal[0];
    const telefonoBase = cliente.telefono;
    
    // Si es un duplicado, usar el teléfono del principal
    let idPrincipal = id;
    if (cliente.es_duplicado && cliente.telefono_principal_id) {
      idPrincipal = cliente.telefono_principal_id;
    }
    
    // Obtener todos los registros con el mismo teléfono
    const [duplicados] = await pool.query(`
      SELECT 
        c.*,
        u.nombre as asesor_nombre,
        CASE 
          WHEN c.id = ? THEN TRUE
          ELSE FALSE
        END as es_principal
      FROM clientes c
      LEFT JOIN usuarios u ON c.asesor_asignado = u.id
      WHERE c.telefono = ?
      ORDER BY c.created_at ASC, c.id ASC
    `, [idPrincipal, telefonoBase]);
    
    console.log(`✅ Encontrados ${duplicados.length} registros con teléfono: ${telefonoBase}`);
    
    res.json({ 
      success: true, 
      duplicados,
      total: duplicados.length,
      telefono: telefonoBase
    });
    
  } catch (error) {
    console.error('❌ Error al obtener duplicados:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener duplicados' 
    });
  }
};

module.exports = {
  getAsesores,
  actualizarDatosCliente,
  obtenerDatosClientes,
  updateEstadoAsesor,
  buscarAsesor,
  obtenerDuplicados
};