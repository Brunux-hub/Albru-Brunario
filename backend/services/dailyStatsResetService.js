const pool = require('../config/database');
const cron = require('node-cron');
const WebSocketService = require('./WebSocketService');

/**
 * Servicio para manejar el reset automático de estadísticas diarias
 * Se ejecuta todos los días a las 12:00 AM hora Perú (UTC-5)
 */

class DailyStatsResetService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Inicia el servicio de reset automático
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ [DAILY STATS] El servicio ya está en ejecución');
      return;
    }

    // Ejecutar a las 12:00 AM hora Perú (UTC-5)
    // En servidor UTC, esto sería 5:00 AM
    // Cron: minuto hora * * * (5 AM UTC = 12 AM Perú)
    this.cronJob = cron.schedule('0 5 * * *', async () => {
      console.log('🔄 [DAILY STATS] Ejecutando reset de estadísticas diarias...');
      await this.resetDailyStats();
    }, {
      timezone: 'UTC'
    });

    this.isRunning = true;
    console.log('✅ [DAILY STATS] Servicio iniciado - Reset automático a las 12:00 AM (Hora Perú)');
  }

  /**
   * Detiene el servicio
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('🛑 [DAILY STATS] Servicio detenido');
    }
  }

  /**
   * Elimina las estadísticas de días anteriores
   * Mantiene solo las del día actual
   */
  async resetDailyStats() {
    try {
      const fechaHoy = this.getFechaPeruActual();
      
      // Eliminar estadísticas de días anteriores
      const [result] = await pool.query(
        'DELETE FROM asesor_stats_daily WHERE fecha < ?',
        [fechaHoy]
      );

      console.log(`✅ [DAILY STATS] Reset completado - Eliminados ${result.affectedRows} registros antiguos`);
      console.log(`📅 [DAILY STATS] Fecha actual (Perú): ${fechaHoy}`);

      // Notificar a todos los clientes conectados vía WebSocket
      try {
        WebSocketService.notifyAll('STATS_RESET', {
          fecha: fechaHoy,
          timestamp: new Date().toISOString(),
          message: 'Estadísticas del día reiniciadas'
        });
        console.log('🔔 [DAILY STATS] Notificación enviada por WebSocket');
      } catch (wsError) {
        console.warn('⚠️ [DAILY STATS] No se pudo enviar notificación WebSocket:', wsError.message);
      }

      return { success: true, deleted: result.affectedRows };
    } catch (error) {
      console.error('❌ [DAILY STATS] Error al resetear estadísticas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene la fecha actual en hora de Perú (UTC-5)
   * @returns {string} Fecha en formato YYYY-MM-DD
   */
  getFechaPeruActual() {
    const now = new Date();
    // Restar 5 horas para obtener hora Perú
    const peruTime = new Date(now.getTime() - (5 * 60 * 60 * 1000));
    return peruTime.toISOString().split('T')[0];
  }

  /**
   * Obtiene las estadísticas actuales de todos los asesores
   */
  async getCurrentStats() {
    try {
      const fechaHoy = this.getFechaPeruActual();
      const [stats] = await pool.query(
        `SELECT 
          asesor_id,
          clientes_atendidos,
          clientes_reasignados,
          fecha
        FROM asesor_stats_daily
        WHERE fecha = ?`,
        [fechaHoy]
      );

      return { success: true, stats, fecha: fechaHoy };
    } catch (error) {
      console.error('❌ [DAILY STATS] Error al obtener estadísticas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fuerza un reset manual (para testing)
   */
  async forceReset() {
    console.log('🔨 [DAILY STATS] Ejecutando reset manual...');
    return await this.resetDailyStats();
  }
}

// Singleton
const instance = new DailyStatsResetService();

module.exports = instance;
