/**
 * ALBRU CRM - SERVICIO DE REDIS
 * Maneja todas las operaciones de Redis con reconexión automática
 * @module services/RedisService
 */

const Redis = require('ioredis');
const config = require('../config/environment');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Conecta al servidor Redis
   */
  async connect() {
    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        retryStrategy: config.redis.retryStrategy,
        lazyConnect: false,
        maxRetriesPerRequest: 3,
      });

      this.client.on('connect', () => {
        console.log('✅ Redis conectado correctamente');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('❌ Error en Redis:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('🔌 Conexión Redis cerrada');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Reconectando a Redis...');
      });

      await this.client.ping();
      return true;
    } catch (error) {
      console.error('❌ Error al conectar Redis:', error.message);
      console.warn('⚠️  Sistema funcionará sin Redis (fallback a MySQL)');
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Guarda sesión de cliente con TTL
   */
  async setSession(clienteId, sessionData, ttlSeconds = config.session.timeout) {
    if (!this.isConnected || !this.client) {
      console.warn('⚠️  Redis no disponible, sesión solo en MySQL');
      return false;
    }

    const key = `session:cliente:${clienteId}`;
    const data = JSON.stringify({
      ...sessionData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    });

    await this.client.setex(key, ttlSeconds, data);
    console.log(`📝 Sesión guardada en Redis: ${key} (TTL: ${ttlSeconds}s)`);
    return true;
  }

  /**
   * Obtiene sesión de cliente
   */
  async getSession(clienteId) {
    if (!this.isConnected || !this.client) return null;

    const key = `session:cliente:${clienteId}`;
    const data = await this.client.get(key);
    
    if (!data) return null;
    
    return JSON.parse(data);
  }

  /**
   * Elimina sesión de cliente
   */
  async deleteSession(clienteId) {
    if (!this.isConnected || !this.client) return false;

    const key = `session:cliente:${clienteId}`;
    await this.client.del(key);
    console.log(`🗑️  Sesión eliminada de Redis: ${key}`);
    return true;
  }

  /**
   * Actualiza TTL de sesión (refresh por actividad)
   */
  async refreshSession(clienteId, ttlSeconds = config.session.timeout) {
    if (!this.isConnected || !this.client) return false;

    const key = `session:cliente:${clienteId}`;
    const exists = await this.client.exists(key);
    
    if (!exists) return false;
    
    await this.client.expire(key, ttlSeconds);
    console.log(`🔄 TTL actualizado en Redis: ${key} (${ttlSeconds}s)`);
    return true;
  }

  /**
   * Obtiene todas las sesiones activas
   */
  async getAllSessions() {
    if (!this.isConnected || !this.client) return [];

    const keys = await this.client.keys('session:cliente:*');
    const sessions = [];

    for (const key of keys) {
      const data = await this.client.get(key);
      const ttl = await this.client.ttl(key);
      
      if (data) {
        sessions.push({
          key,
          clienteId: key.split(':')[2],
          ttl,
          data: JSON.parse(data),
        });
      }
    }

    return sessions;
  }

  /**
   * Obtiene TTL restante de una sesión
   */
  async getSessionTTL(clienteId) {
    if (!this.isConnected || !this.client) return -1;

    const key = `session:cliente:${clienteId}`;
    return await this.client.ttl(key);
  }

  /**
   * Verifica si existe una sesión activa
   */
  async sessionExists(clienteId) {
    if (!this.isConnected || !this.client) return false;

    const key = `session:cliente:${clienteId}`;
    return (await this.client.exists(key)) === 1;
  }

  /**
   * Guarda estado temporal (para sincronización)
   */
  async setState(key, value, ttl = 3600) {
    if (!this.isConnected || !this.client) return false;

    await this.client.setex(`state:${key}`, ttl, JSON.stringify(value));
    return true;
  }

  /**
   * Obtiene estado temporal
   */
  async getState(key) {
    if (!this.isConnected || !this.client) return null;

    const data = await this.client.get(`state:${key}`);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Cierra conexión
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      console.log('👋 Redis desconectado');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.isConnected || !this.client) {
      return { status: 'disconnected', connected: false };
    }

    try {
      await this.client.ping();
      return { status: 'ok', connected: this.isConnected };
    } catch (error) {
      return { status: 'error', message: error.message, connected: false };
    }
  }
}

// Singleton
const redisService = new RedisService();

module.exports = redisService;
