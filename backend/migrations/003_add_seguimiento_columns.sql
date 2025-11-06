-- Migration: Añadir columnas para seguimiento y estado comercial
-- Fecha: 2025-10-31

-- Añadir columnas solo si no existen (usando procedure temporal)
DELIMITER $$

CREATE PROCEDURE add_columns_if_not_exists()
BEGIN
  -- seguimiento_status
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'seguimiento_status') THEN
    ALTER TABLE clientes ADD COLUMN seguimiento_status VARCHAR(64) NULL;
  END IF;
  
  -- derivado_at
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'derivado_at') THEN
    ALTER TABLE clientes ADD COLUMN derivado_at DATETIME NULL;
  END IF;
  
  -- opened_at
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'opened_at') THEN
    ALTER TABLE clientes ADD COLUMN opened_at DATETIME NULL;
  END IF;
  
  -- estatus_comercial_categoria
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'estatus_comercial_categoria') THEN
    ALTER TABLE clientes ADD COLUMN estatus_comercial_categoria VARCHAR(128) NULL;
  END IF;
  
  -- estatus_comercial_subcategoria
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'estatus_comercial_subcategoria') THEN
    ALTER TABLE clientes ADD COLUMN estatus_comercial_subcategoria VARCHAR(128) NULL;
  END IF;
  
  -- wizard_data_json
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'wizard_data_json') THEN
    ALTER TABLE clientes ADD COLUMN wizard_data_json JSON NULL;
  END IF;
  
  -- quality_status
  IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'quality_status') THEN
    ALTER TABLE clientes ADD COLUMN quality_status VARCHAR(64) NULL;
  END IF;
END$$

DELIMITER ;

-- Ejecutar procedure
CALL add_columns_if_not_exists();

-- Eliminar procedure
DROP PROCEDURE IF EXISTS add_columns_if_not_exists;

-- Índices para consultas rápidas (con manejo de errores)
-- Intentar crear índice seguimiento_status
SET @exist_idx := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                   WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'clientes' 
                   AND INDEX_NAME = 'idx_clientes_seguimiento_status');
SET @sql_idx1 := IF(@exist_idx = 0, 
                    'CREATE INDEX idx_clientes_seguimiento_status ON clientes(seguimiento_status)', 
                    'SELECT ''Index idx_clientes_seguimiento_status already exists'' AS msg');
PREPARE stmt1 FROM @sql_idx1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- Intentar crear índice derivado_at
SET @exist_idx2 := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'clientes' 
                    AND INDEX_NAME = 'idx_clientes_derivado_at');
SET @sql_idx2 := IF(@exist_idx2 = 0, 
                    'CREATE INDEX idx_clientes_derivado_at ON clientes(derivado_at)', 
                    'SELECT ''Index idx_clientes_derivado_at already exists'' AS msg');
PREPARE stmt2 FROM @sql_idx2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
