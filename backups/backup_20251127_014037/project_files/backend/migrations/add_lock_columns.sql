-- Agregar columnas para locks duraderos en la tabla clientes
USE albru;

ALTER TABLE clientes
  ADD COLUMN locked_by INT NULL,
  ADD COLUMN locked_at DATETIME NULL,
  ADD COLUMN lock_expires_at DATETIME NULL,
  ADD COLUMN lock_token VARCHAR(64) NULL,
  ADD COLUMN lock_reason VARCHAR(255) NULL,
  ADD INDEX idx_lock_expires_at (lock_expires_at),
  ADD INDEX idx_locked_by (locked_by);

-- Verificar
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'albru' AND TABLE_NAME = 'clientes' AND COLUMN_NAME IN ('locked_by','locked_at','lock_expires_at','lock_token','lock_reason');
