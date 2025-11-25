-- Agregar campo observaciones_asesor a la tabla clientes si no existe
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'observaciones_asesor');
SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE clientes ADD COLUMN observaciones_asesor TEXT DEFAULT NULL', 
  'SELECT "Column observaciones_asesor already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear tabla para comentarios del GTR hacia el asesor (chat en tiempo real)
CREATE TABLE IF NOT EXISTS comentarios_gtr (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  gtr_id INT NOT NULL,
  asesor_id INT DEFAULT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_cliente (cliente_id),
  INDEX idx_asesor (asesor_id),
  INDEX idx_leido (leido),
  INDEX idx_created (created_at),
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (gtr_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (asesor_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
