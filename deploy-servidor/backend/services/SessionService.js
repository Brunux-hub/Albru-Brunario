/**
 * ALBRU CRM - SERVICIO DE SESIONES
 * Gestiona el ciclo de vida completo de sesiones de clientes
 * @module services/SessionService
 */

const pool = require('../config/database');
const redisService = require('./RedisService');
const config = require('../config/environment');

class SessionService {
  /**
   * Inicia una sesión cuando el asesor abre el wizard
   */
  async startSession(clienteId, asesorId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Actualizar estado en MySQL
      await connection.query(
        `UPDATE clientes 
         SET seguimiento_status = 'en_gestion',
             opened_at = NOW(),
             last_activity = NOW(),
             asesor_asignado = ?
         WHERE id = ?`,
        [asesorId, clienteId]
      );

      // 2. Registrar en historial
      await connection.query(
        `INSERT INTO historial_estados 
         (cliente_id, estado_anterior, estado_nuevo, usuario_id, razon)
         VALUES (?, 'derivado', 'en_gestion', ?, 'Wizard abierto')`,
        [clienteId, asesorId]
      );

      // 3. Crear sesión en Redis con TTL
      const sessionData = {
        clienteId,
        asesorId,
        status: 'en_gestion',
        startedAt: new Date().toISOString(),
      };

      await redisService.setSession(clienteId, sessionData, config.session.timeout);

      await connection.commit();

      console.log(`✅ Sesión iniciada: Cliente ${clienteId} - Asesor ${asesorId}`);

      return {
        success: true,
        session: sessionData,
        ttl: config.session.timeout,
      };
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error al iniciar sesión:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualiza la actividad de una sesión (heartbeat)
   */
  async updateActivity(clienteId, asesorId) {
    try {
      // 1. Actualizar last_activity en MySQL
      await pool.query(
        'UPDATE clientes SET last_activity = NOW() WHERE id = ? AND asesor_asignado = ?',
        [clienteId, asesorId]
      );

      // 2. Refrescar TTL en Redis
      const refreshed = await redisService.refreshSession(clienteId, config.session.timeout);

      if (!refreshed) {
        console.warn(`⚠️  No se pudo refrescar sesión: Cliente ${clienteId}`);
        return { success: false, message: 'Sesión no encontrada' };
      }

      return { success: true, ttl: config.session.timeout };
    } catch (error) {
      console.error('❌ Error al actualizar actividad:', error);
      throw error;
    }
  }

  /**
   * Finaliza una sesión cuando el asesor completa el wizard
   */
  async endSession(clienteId, asesorId, resultado = 'gestionado') {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Actualizar estado en MySQL
      await connection.query(
        `UPDATE clientes 
         SET seguimiento_status = ?,
             wizard_completado = 1,
             closed_at = NOW(),
             last_activity = NOW()
         WHERE id = ? AND asesor_asignado = ?`,
        [resultado, clienteId, asesorId]
      );

      // 2. Liberar lock si existe
      await connection.query(
        'DELETE FROM cliente_locks WHERE cliente_id = ?',
        [clienteId]
      );

      // 3. Registrar en historial
      await connection.query(
        `INSERT INTO historial_estados 
         (cliente_id, estado_anterior, estado_nuevo, usuario_id, razon)
         VALUES (?, 'en_gestion', ?, ?, 'Wizard completado')`,
        [clienteId, resultado, asesorId]
      );

      // 4. Eliminar sesión de Redis
      await redisService.deleteSession(clienteId);

      await connection.commit();

      console.log(`✅ Sesión finalizada: Cliente ${clienteId} - Resultado: ${resultado}`);

      return { success: true, resultado };
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error al finalizar sesión:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtiene el estado actual de una sesión
   */
  async getSessionStatus(clienteId) {
    try {
      // 1. Buscar en Redis (más rápido)
      const redisSession = await redisService.getSession(clienteId);
      
      if (redisSession) {
        const ttl = await redisService.getSessionTTL(clienteId);
        return {
          source: 'redis',
          active: true,
          ttl,
          ...redisSession,
        };
      }

      // 2. Buscar en MySQL como fallback
      const [rows] = await pool.query(
        `SELECT id, seguimiento_status, asesor_asignado, opened_at, last_activity
         FROM clientes
         WHERE id = ?`,
        [clienteId]
      );

      if (rows.length === 0) {
        return { active: false, message: 'Cliente no encontrado' };
      }

      return {
        source: 'mysql',
        active: rows[0].seguimiento_status === 'en_gestion',
        ...rows[0],
      };
    } catch (error) {
      console.error('❌ Error al obtener estado de sesión:', error);
      throw error;
    }
  }

  /**
   * Restaura sesión desde MySQL a Redis (para reconexiones)
   */
  async restoreSession(clienteId) {
    try {
      const [rows] = await pool.query(
        `SELECT id, seguimiento_status, asesor_asignado, opened_at, last_activity
         FROM clientes
         WHERE id = ? AND seguimiento_status = 'en_gestion'`,
        [clienteId]
      );

      if (rows.length === 0) {
        return { success: false, message: 'No hay sesión activa en BD' };
      }

      const cliente = rows[0];
      
      // Calcular TTL restante basado en last_activity
      const lastActivity = new Date(cliente.last_activity);
      const now = new Date();
      const elapsedSeconds = Math.floor((now - lastActivity) / 1000);
      const remainingTTL = Math.max(config.session.timeout - elapsedSeconds, 60);

      // Recrear sesión en Redis
      const sessionData = {
        clienteId: cliente.id,
        asesorId: cliente.asesor_asignado,
        status: 'en_gestion',
        startedAt: cliente.opened_at,
        restored: true,
      };

      await redisService.setSession(clienteId, sessionData, remainingTTL);

      console.log(`🔄 Sesión restaurada: Cliente ${clienteId} (TTL: ${remainingTTL}s)`);

      return {
        success: true,
        session: sessionData,
        ttl: remainingTTL,
      };
    } catch (error) {
      console.error('❌ Error al restaurar sesión:', error);
      throw error;
    }
  }

  /**
   * Maneja timeout de sesión (llamado por worker)
   */
  async handleTimeout(clienteId, reason = 'Inactividad') {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // 1. Obtener datos actuales
      const [rows] = await connection.query(
        'SELECT asesor_asignado FROM clientes WHERE id = ?',
        [clienteId]
      );

      if (rows.length === 0) {
        throw new Error('Cliente no encontrado');
      }

      const asesorId = rows[0].asesor_asignado;

      // 2. Actualizar estado a no_gestionado
      await connection.query(
        `UPDATE clientes 
         SET seguimiento_status = 'no_gestionado',
             asesor_asignado = NULL,
             returned_at = NOW()
         WHERE id = ?`,
        [clienteId]
      );

      // 3. Liberar lock
      await connection.query(
        'DELETE FROM cliente_locks WHERE cliente_id = ?',
        [clienteId]
      );

      // 4. Registrar en historial
      await connection.query(
        `INSERT INTO historial_estados 
         (cliente_id, estado_anterior, estado_nuevo, usuario_id, comentarios)
         VALUES (?, 'en_gestion', 'no_gestionado', ?, ?)`,
        [clienteId, asesorId, reason]
      );

      // 5. Eliminar sesión de Redis
      await redisService.deleteSession(clienteId);

      await connection.commit();

      console.log(`⏱️  Timeout manejado: Cliente ${clienteId} - Razón: ${reason}`);

      return { success: true, clienteId, reason };
    } catch (error) {
      await connection.rollback();
      console.error('❌ Error al manejar timeout:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtiene todas las sesiones activas
   */
  async getAllActiveSessions() {
    try {
      const redisSessions = await redisService.getAllSessions();
      return redisSessions.map(session => ({
        clienteId: session.clienteId,
        ttl: session.ttl,
        data: session.data,
      }));
    } catch (error) {
      console.error('❌ Error al obtener sesiones activas:', error);
      throw error;
    }
  }

  /**
   * Sincroniza Redis con MySQL (para recuperación de crashes)
   */
  async syncSessions() {
    try {
      console.log('🔄 Sincronizando sesiones MySQL -> Redis...');

      const [activeClientes] = await pool.query(
        `SELECT id, asesor_asignado, opened_at, last_activity
         FROM clientes
         WHERE seguimiento_status = 'en_gestion'`
      );

      let restored = 0;

      for (const cliente of activeClientes) {
        const exists = await redisService.sessionExists(cliente.id);
        
        if (!exists) {
          await this.restoreSession(cliente.id);
          restored++;
        }
      }

      console.log(`✅ Sincronización completa: ${restored} sesiones restauradas`);

      return { success: true, restored };
    } catch (error) {
      console.error('❌ Error al sincronizar sesiones:', error);
      throw error;
    }
  }
}

module.exports = new SessionService();
