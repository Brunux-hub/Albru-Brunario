/**
 * ALBRU CRM - WORKER DE SEGUIMIENTO MEJORADO
 * Sincroniza MySQL <-> Redis y maneja timeouts
 * @module services/seguimientoWorker
 */

const pool = require('../config/database');
const config = require('../config/environment');
const sessionService = require('./SessionService');
const socketService = require('./SocketService');
const redisService = require('./RedisService');

let intervalHandle = null;
const TIMEOUT_SECONDS = config.session.timeout;

/**
 * Sincroniza sesiones de Redis con MySQL (crash recovery)
 */
async function syncRedisSessions() {
  try {
    const redisSessions = await redisService.getAllSessions();
    
    for (const session of redisSessions) {
      const clienteId = session.clienteId;
      
      // Verificar si sigue activo en MySQL
      const [rows] = await pool.query(
        'SELECT seguimiento_status FROM clientes WHERE id = ?',
        [clienteId]
      );
      
      if (rows.length === 0 || rows[0].seguimiento_status !== 'en_gestion') {
        // Cliente ya no está en gestión, eliminar de Redis
        await redisService.deleteSession(clienteId);
        console.log(`🗑️  Sesión Redis limpiada: Cliente ${clienteId} (no en gestión)`);
      }
    }
  } catch (error) {
    console.error('❌ Error sincronizando sesiones Redis:', error);
  }
}

/**
 * Procesa timeouts de clientes inactivos
 */
async function processTimeouts() {
  try {
    console.log('⏱️ [SeguimientoWorker] Revisando timeouts...');
    
    // 1. Sincronizar sesiones Redis/MySQL
    await syncRedisSessions();
    
    // 2. Buscar clientes en seguimiento activo sin actividad reciente
    const sql = `
      SELECT 
        id, 
        asesor_asignado, 
        derivado_at, 
        opened_at, 
        last_activity,
        seguimiento_status,
        COALESCE(last_activity, opened_at, derivado_at) as reference_time,
        TIMESTAMPDIFF(SECOND, COALESCE(last_activity, opened_at, derivado_at), NOW()) as inactive_seconds
      FROM clientes 
      WHERE seguimiento_status IN ('derivado', 'en_gestion')
        AND COALESCE(last_activity, opened_at, derivado_at) <= DATE_SUB(NOW(), INTERVAL ? SECOND)`;
    
    const [rows] = await pool.query(sql, [TIMEOUT_SECONDS]);
    
    if (!rows || rows.length === 0) {
      console.log('✅ [SeguimientoWorker] No hay clientes con timeout');
      return;
    }

    console.log(`⚠️  [SeguimientoWorker] Encontrados ${rows.length} clientes con timeout`);

    // 3. Procesar cada timeout usando SessionService
    for (const r of rows) {
      try {
        console.log(`🔄 [SeguimientoWorker] Procesando timeout para cliente ${r.id} (${r.seguimiento_status}, inactivo por ${r.inactive_seconds}s)`);
        
        const clienteId = r.id;

        // Usar SessionService para manejar timeout (consistencia)
        await sessionService.handleTimeout(clienteId, `Inactividad (${r.inactive_seconds}s)`);

        // Obtener datos actualizados para notificar
        const [updated] = await pool.query('SELECT * FROM clientes WHERE id = ?', [clienteId]);
        
        if (updated.length > 0) {
          // Notificar via Socket.io
          socketService.clientReturnedToGTR({
            id: clienteId,
            asesor_asignado: r.asesor_asignado,
            seguimiento_status: 'no_gestionado',
            inactive_seconds: r.inactive_seconds,
          });
        }

        console.log(`✅ [SeguimientoWorker] Cliente ${clienteId} retornado a GTR por timeout`);
      } catch (inner) {
        console.error(`❌ Error procesando timeout de cliente ${r.id}:`, inner);
      }
    }
  } catch (err) {
    console.error('Error en seguimientoWorker.processTimeouts:', err);
  }
}

/**
 * Inicia el worker
 */
function start(intervalMs = config.session.workerInterval) {
  if (intervalHandle) {
    console.warn('⚠️  Worker ya está ejecutándose');
    return;
  }
  
  console.log(`🕵️‍♂️ Iniciando seguimientoWorker (intervalo: ${intervalMs}ms, timeout: ${TIMEOUT_SECONDS}s)`);
  
  intervalHandle = setInterval(processTimeouts, intervalMs);
  
  // Ejecutar inmediatamente
  processTimeouts().catch(e => console.error('❌ Error en ejecución inicial del worker:', e));
}

/**
 * Detiene el worker
 */
function stop() {
  if (!intervalHandle) {
    console.warn('⚠️  Worker no está ejecutándose');
    return;
  }
  
  clearInterval(intervalHandle);
  intervalHandle = null;
  console.log('🛑 Worker detenido');
}

/**
 * Verifica si el worker está activo
 */
function isRunning() {
  return intervalHandle !== null;
}

module.exports = { 
  start, 
  stop, 
  isRunning,
  processTimeouts, // Exportar para testing
};
