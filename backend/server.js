const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();

// Configuración de la base de datos MySQL
const dbConfig = {
  host: 'localhost',
  user: 'root', // Usuario por defecto de MySQL
  password: '', // Contraseña de tu MySQL (puedes cambiarla)
  database: 'albru',
  port: 3306
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// API PARA REASIGNACIÓN DE CLIENTES GTR → ASESOR
// ============================================================

// Reasignar cliente desde GTR a Asesor
app.post('/api/clientes/reasignar', async (req, res) => {
  try {
    const { cliente_id, nuevo_asesor_id, gtr_id, comentario } = req.body;
    
    console.log('🔄 Reasignando cliente:', { cliente_id, nuevo_asesor_id });

    // Iniciar transacción
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 1. Actualizar cliente con nuevo asesor
      const [updateResult] = await connection.execute(`
        UPDATE clientes 
        SET asesor_asignado = ?,
            estado_cliente = 'asignado',
            fecha_asignacion = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [nuevo_asesor_id, cliente_id]);

      if (updateResult.affectedRows === 0) {
        throw new Error('Cliente no encontrado');
      }

      // Obtener datos del cliente actualizado
      const [clienteResult] = await connection.execute(`
        SELECT * FROM clientes WHERE id = ?
      `, [cliente_id]);
      
      const cliente = clienteResult[0];

      // 2. Registrar en historial
      await connection.execute(`
        INSERT INTO historial_cliente (cliente_id, usuario_id, accion, estado_nuevo, comentarios)
        VALUES (?, ?, 'reasignado_asesor', 'asignado', ?)
      `, [cliente_id, gtr_id, comentario || `Reasignado desde GTR a asesor ${nuevo_asesor_id}`]);

      // 3. Actualizar contador de clientes asignados
      await connection.execute(`
        UPDATE asesores 
        SET clientes_asignados = clientes_asignados + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [nuevo_asesor_id]);

      // 4. Obtener datos del asesor para la respuesta
      const [asesorResult] = await connection.execute(`
        SELECT nombre FROM asesores WHERE id = ?
      `, [nuevo_asesor_id]);

      await connection.commit();
      
      // 5. Respuesta con datos completos
      res.json({
        success: true,
        message: 'Cliente reasignado exitosamente',
        data: {
          cliente: {
            id: cliente.id,
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            dni: cliente.dni,
            lead_id: cliente.lead_id,
            estado: cliente.estado_cliente
          },
          asesor: {
            id: nuevo_asesor_id,
            nombre: asesorResult[0]?.nombre
          },
          fecha_reasignacion: new Date()
        }
      });

      console.log('✅ Reasignación exitosa para cliente:', cliente_id);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Error en reasignación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reasignar cliente',
      error: error.message
    });
  }
});

// Obtener clientes asignados a un asesor específico
app.get('/api/clientes/asesor/:asesorId', async (req, res) => {
  try {
    const { asesorId } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT 
        c.id,
        c.nombre,
        c.telefono,
        c.dni,
        c.correo_electronico,
        c.direccion,
        c.distrito,
        c.plan_seleccionado,
        c.precio_final,
        c.estado_cliente as estado,
        c.observaciones_asesor as gestion,
        c.fecha_asignacion as fecha,
        c.fecha_cita as seguimiento,
        'Internet' as servicio
      FROM clientes c
      WHERE c.asesor_asignado = ?
      ORDER BY c.fecha_asignacion DESC
    `, [asesorId]);

    res.json({
      success: true,
      clientes: rows
    });

  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes',
      error: error.message
    });
  }
});

// Obtener ID del asesor por nombre
app.get('/api/asesores/buscar/:nombre', async (req, res) => {
  try {
    const { nombre } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT id, nombre, email, tipo 
      FROM asesores 
      WHERE UPPER(nombre) = UPPER(?) AND estado = 'activo'
    `, [nombre]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asesor no encontrado'
      });
    }

    res.json({
      success: true,
      asesor: rows[0]
    });

  } catch (error) {
    console.error('Error buscando asesor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar asesor',
      error: error.message
    });
  }
});

// Obtener todos los asesores activos
app.get('/api/asesores', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, nombre, email, tipo, clientes_asignados
      FROM asesores 
      WHERE estado = 'activo' AND tipo = 'asesor'
      ORDER BY nombre
    `);

    res.json({
      success: true,
      asesores: rows
    });

  } catch (error) {
    console.error('Error obteniendo asesores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener asesores'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}`);
});

module.exports = app;