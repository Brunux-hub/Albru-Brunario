-- Migración: crear tabla cliente_locks para locks duraderos de clientes
-- Ejecutar una vez. No modifica la tabla `clientes`.

CREATE TABLE IF NOT EXISTS cliente_locks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cliente_id BIGINT NOT NULL,
  locked_by INT NULL,
  locked_at DATETIME NULL,
  lock_expires_at DATETIME NULL,
  lock_token VARCHAR(128) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cliente_lock (cliente_id),
  INDEX idx_cliente_locked_by (locked_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
