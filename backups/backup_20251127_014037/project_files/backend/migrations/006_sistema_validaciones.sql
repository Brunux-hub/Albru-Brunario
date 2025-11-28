-- ============================================
-- MIGRACIÓN: Sistema de Validaciones Automático
-- Descripción: Asignación automática de clientes a validadores
-- Fecha: 2025-11-12
-- ============================================

-- 1. Agregar campo de validador asignado en clientes
-- Verificar y agregar columnas si no existen
SET @dbname = DATABASE();
SET @tablename = 'clientes';
SET @columnname = 'validador_asignado';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (TABLE_SCHEMA = @dbname)
     AND (TABLE_NAME = @tablename)
     AND (COLUMN_NAME = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT NULL AFTER asesor_asignado')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'fecha_asignacion_validador';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (TABLE_SCHEMA = @dbname)
     AND (TABLE_NAME = @tablename)
     AND (COLUMN_NAME = @columnname)) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP NULL AFTER validador_asignado')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Agregar índice para búsquedas rápidas (verificar si existe primero)
SET @indexname = 'idx_validador_asignado';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE (TABLE_SCHEMA = @dbname)
     AND (TABLE_NAME = @tablename)
     AND (INDEX_NAME = @indexname)) > 0,
  'SELECT 1',
  CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, '(validador_asignado)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 2. Crear tabla de estadísticas de validadores (similar a asesores)
CREATE TABLE IF NOT EXISTS validador_stats_daily (
  id INT AUTO_INCREMENT PRIMARY KEY,
  validador_id INT NOT NULL,
  fecha DATE NOT NULL,
  clientes_asignados INT DEFAULT 0,
  clientes_validados INT DEFAULT 0,
  clientes_aprobados INT DEFAULT 0,
  clientes_rechazados INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_validador_fecha (validador_id, fecha),
  FOREIGN KEY (validador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_validador_fecha (validador_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Crear tabla de configuración de asignación automática
CREATE TABLE IF NOT EXISTS validacion_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metodo_asignacion ENUM('round-robin', 'aleatorio', 'carga-balanceada') DEFAULT 'round-robin',
  ultimo_validador_asignado INT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuración inicial
INSERT INTO validacion_config (metodo_asignacion, activo) 
VALUES ('round-robin', TRUE)
ON DUPLICATE KEY UPDATE metodo_asignacion = metodo_asignacion;

-- 4. Trigger para asignación automática cuando cliente pasa a PREVENTA COMPLETA
DELIMITER $$

DROP TRIGGER IF EXISTS auto_asignar_validador$$

CREATE TRIGGER auto_asignar_validador
AFTER UPDATE ON clientes
FOR EACH ROW
BEGIN
  DECLARE next_validador_id INT;
  DECLARE config_metodo VARCHAR(50);
  DECLARE ultimo_asignado INT;
  DECLARE total_validadores INT;
  
  -- Solo ejecutar si el estado cambió a PREVENTA COMPLETA y no tiene validador asignado
  IF NEW.estatus_comercial_subcategoria = 'PREVENTA COMPLETA' 
     AND (OLD.estatus_comercial_subcategoria != 'PREVENTA COMPLETA' OR OLD.estatus_comercial_subcategoria IS NULL)
     AND NEW.validador_asignado IS NULL THEN
    
    -- Obtener método de asignación
    SELECT metodo_asignacion, ultimo_validador_asignado 
    INTO config_metodo, ultimo_asignado
    FROM validacion_config 
    WHERE activo = TRUE 
    LIMIT 1;
    
    -- Contar validadores activos
    SELECT COUNT(*) INTO total_validadores
    FROM usuarios 
    WHERE tipo = 'validador' AND estado = 'activo';
    
    IF total_validadores > 0 THEN
      -- Método Round-Robin
      IF config_metodo = 'round-robin' THEN
        -- Obtener el siguiente validador después del último asignado
        SELECT id INTO next_validador_id
        FROM usuarios
        WHERE tipo = 'validador' 
          AND estado = 'activo'
          AND id > COALESCE(ultimo_asignado, 0)
        ORDER BY id ASC
        LIMIT 1;
        
        -- Si no hay siguiente, volver al primero
        IF next_validador_id IS NULL THEN
          SELECT id INTO next_validador_id
          FROM usuarios
          WHERE tipo = 'validador' AND estado = 'activo'
          ORDER BY id ASC
          LIMIT 1;
        END IF;
        
      -- Método Aleatorio
      ELSEIF config_metodo = 'aleatorio' THEN
        SELECT id INTO next_validador_id
        FROM usuarios
        WHERE tipo = 'validador' AND estado = 'activo'
        ORDER BY RAND()
        LIMIT 1;
        
      -- Método Carga Balanceada (el que menos clientes tiene)
      ELSEIF config_metodo = 'carga-balanceada' THEN
        SELECT u.id INTO next_validador_id
        FROM usuarios u
        LEFT JOIN clientes c ON c.validador_asignado = u.id AND c.estatus_comercial_subcategoria = 'PREVENTA COMPLETA'
        WHERE u.tipo = 'validador' AND u.estado = 'activo'
        GROUP BY u.id
        ORDER BY COUNT(c.id) ASC, RAND()
        LIMIT 1;
      END IF;
      
      -- Asignar validador al cliente
      IF next_validador_id IS NOT NULL THEN
        UPDATE clientes 
        SET validador_asignado = next_validador_id,
            fecha_asignacion_validador = NOW()
        WHERE id = NEW.id;
        
        -- Actualizar último validador asignado
        UPDATE validacion_config 
        SET ultimo_validador_asignado = next_validador_id
        WHERE activo = TRUE;
        
        -- Incrementar estadísticas del validador
        INSERT INTO validador_stats_daily (validador_id, fecha, clientes_asignados)
        VALUES (next_validador_id, DATE(CONVERT_TZ(NOW(), '+00:00', '-05:00')), 1)
        ON DUPLICATE KEY UPDATE clientes_asignados = clientes_asignados + 1;
      END IF;
    END IF;
  END IF;
END$$

DELIMITER ;

-- 5. Trigger para estadísticas cuando se valida un cliente
DELIMITER $$

DROP TRIGGER IF EXISTS actualizar_stats_validacion$$

CREATE TRIGGER actualizar_stats_validacion
AFTER UPDATE ON clientes
FOR EACH ROW
BEGIN
  DECLARE es_aprobado BOOLEAN DEFAULT FALSE;
  DECLARE es_rechazado BOOLEAN DEFAULT FALSE;
  
  -- Detectar si el cliente fue validado (cambio de PREVENTA COMPLETA a otro estado)
  IF OLD.estatus_comercial_subcategoria = 'PREVENTA COMPLETA' 
     AND NEW.estatus_comercial_subcategoria != 'PREVENTA COMPLETA'
     AND NEW.validador_asignado IS NOT NULL THEN
    
    -- Determinar si fue aprobado o rechazado
    IF NEW.estatus_comercial_subcategoria IN ('VENTAS', 'VENTA APROBADA') THEN
      SET es_aprobado = TRUE;
    ELSEIF NEW.estatus_comercial_subcategoria IN ('RECHAZADO', 'NO INTERESADO') THEN
      SET es_rechazado = TRUE;
    END IF;
    
    -- Actualizar estadísticas
    INSERT INTO validador_stats_daily (
      validador_id, 
      fecha, 
      clientes_validados,
      clientes_aprobados,
      clientes_rechazados
    )
    VALUES (
      NEW.validador_asignado,
      DATE(CONVERT_TZ(NOW(), '+00:00', '-05:00')),
      1,
      IF(es_aprobado, 1, 0),
      IF(es_rechazado, 1, 0)
    )
    ON DUPLICATE KEY UPDATE 
      clientes_validados = clientes_validados + 1,
      clientes_aprobados = clientes_aprobados + IF(es_aprobado, 1, 0),
      clientes_rechazados = clientes_rechazados + IF(es_rechazado, 1, 0);
  END IF;
END$$

DELIMITER ;

-- 6. Crear usuarios validadores de ejemplo (si no existen)
-- Nota: Las contraseñas deben ser hasheadas con bcrypt en la aplicación
-- Estas son solo placeholders, se deben actualizar desde la app

INSERT INTO usuarios (nombre, email, password, tipo, estado, created_at)
SELECT 'Validador 1', 'validador1@albru.com', '$2b$10$placeholder1', 'validador', 'activo', NOW()
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'validador1@albru.com');

INSERT INTO usuarios (nombre, email, password, tipo, estado, created_at)
SELECT 'Validador 2', 'validador2@albru.com', '$2b$10$placeholder2', 'validador', 'activo', NOW()
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'validador2@albru.com');

-- 7. Crear tabla de temas personalizados para usuarios (si no existe)
CREATE TABLE IF NOT EXISTS user_themes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  secondary_color VARCHAR(7) DEFAULT '#1e40af',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Crear temas para validadores
INSERT INTO user_themes (user_id, primary_color, secondary_color, created_at)
SELECT u.id, '#2563eb', '#1e40af', NOW()
FROM usuarios u
WHERE u.email = 'validador1@albru.com'
  AND NOT EXISTS (SELECT 1 FROM user_themes WHERE user_id = u.id);

INSERT INTO user_themes (user_id, primary_color, secondary_color, created_at)
SELECT u.id, '#059669', '#047857', NOW()
FROM usuarios u
WHERE u.email = 'validador2@albru.com'
  AND NOT EXISTS (SELECT 1 FROM user_themes WHERE user_id = u.id);

-- Verificación final
SELECT '✅ Migración completada exitosamente' AS status;
SELECT CONCAT('Total validadores: ', COUNT(*)) AS validadores FROM usuarios WHERE tipo = 'validador';
