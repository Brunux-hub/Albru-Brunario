const pool = require('../config/database');

/**
 * Middleware para actualizar last_activity del cliente cuando el asesor realiza acciones
 * Esto mantiene al cliente "activo" y previene el timeout automático
 */
const activityTracker = async (req, res, next) => {
  // Identificar si la petición involucra un cliente específico
  const clienteId = req.params.id || req.body.clienteId || req.query.clienteId;
  
  // Solo trackear actividad si:
  // 1. Hay un clienteId
  // 2. Es una petición que modifica datos (POST, PATCH, PUT)
  // 3. O es un heartbeat (mantener vivo)
  if (!clienteId) {
    return next();
  }

  const isModifying = ['POST', 'PATCH', 'PUT'].includes(req.method);
  const isHeartbeat = req.path.includes('/heartbeat');
  
  if (!isModifying && !isHeartbeat) {
    return next();
  }

  try {
    // Actualizar last_activity del cliente si está en seguimiento activo
    await pool.query(
      `UPDATE clientes 
       SET last_activity = NOW() 
       WHERE id = ? AND seguimiento_status IN ('derivado', 'en_gestion')`,
      [clienteId]
    );
    
    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔄 Activity tracked for cliente ${clienteId} - ${req.method} ${req.path}`);
    }
  } catch (error) {
    // No fallar la request si el tracking falla
    console.error(`⚠️  Error tracking activity for cliente ${clienteId}:`, error.message);
  }

  next();
};

/**
 * Función helper para actualizar manualmente last_activity
 * Útil para casos específicos fuera del middleware
 */
const updateActivity = async (clienteId) => {
  if (!clienteId) return;
  
  try {
    await pool.query(
      `UPDATE clientes 
       SET last_activity = NOW() 
       WHERE id = ? AND seguimiento_status IN ('derivado', 'en_gestion')`,
      [clienteId]
    );
  } catch (error) {
    console.error(`Error updating activity for cliente ${clienteId}:`, error.message);
  }
};

module.exports = {
  activityTracker,
  updateActivity
};
