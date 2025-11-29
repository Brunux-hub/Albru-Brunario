-- =====================================================
-- MIGRACIÓN: Sistema de Contador de Reasignaciones Diarias
-- =====================================================
-- Este sistema cuenta las reasignaciones del día actual
-- Se reinicia automáticamente cada día
-- El historial completo se mantiene en la tabla historial_estados

-- 1. Agregar columna para contador diario (verificar si existe primero)
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'clientes' 
    AND COLUMN_NAME = 'contador_reasignaciones_hoy'
);

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE clientes ADD COLUMN contador_reasignaciones_hoy INT DEFAULT 0 COMMENT "Contador de reasignaciones del día actual (se reinicia cada día)"',
    'SELECT "La columna contador_reasignaciones_hoy ya existe" as mensaje'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Agregar columna para fecha de última reasignación
SET @column_exists2 = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'clientes' 
    AND COLUMN_NAME = 'fecha_ultima_reasignacion'
);

SET @sql2 = IF(@column_exists2 = 0, 
    'ALTER TABLE clientes ADD COLUMN fecha_ultima_reasignacion DATE DEFAULT NULL COMMENT "Fecha de la última reasignación para control diario"',
    'SELECT "La columna fecha_ultima_reasignacion ya existe" as mensaje'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 3. Crear índices (MySQL ignora si ya existen en versiones recientes)
CREATE INDEX idx_contador_reasignaciones_hoy ON clientes(contador_reasignaciones_hoy);
CREATE INDEX idx_fecha_ultima_reasignacion ON clientes(fecha_ultima_reasignacion);

-- =====================================================
-- TRIGGER: Actualizar contador diario en reasignaciones
-- =====================================================

DROP TRIGGER IF EXISTS actualizar_contador_reasignaciones_diario;

DELIMITER $$

CREATE TRIGGER actualizar_contador_reasignaciones_diario
BEFORE UPDATE ON clientes
FOR EACH ROW
BEGIN
    DECLARE hoy DATE;
    SET hoy = CURDATE();
    
    -- Si cambió el asesor asignado (reasignación real)
    IF OLD.asesor_asignado IS NOT NULL 
       AND NEW.asesor_asignado IS NOT NULL 
       AND OLD.asesor_asignado != NEW.asesor_asignado 
       AND NEW.asesor_asignado > 0 THEN
        
        -- Si es el mismo día, incrementar contador
        IF NEW.fecha_ultima_reasignacion = hoy THEN
            SET NEW.contador_reasignaciones_hoy = NEW.contador_reasignaciones_hoy + 1;
        ELSE
            -- Si es un nuevo día, reiniciar contador a 1
            SET NEW.contador_reasignaciones_hoy = 1;
        END IF;
        
        -- Actualizar fecha de última reasignación
        SET NEW.fecha_ultima_reasignacion = hoy;
        
        -- Mantener el contador total también
        SET NEW.contador_reasignaciones = COALESCE(OLD.contador_reasignaciones, 0) + 1;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- PROCEDIMIENTO: Resetear contadores diarios
-- =====================================================
-- Este procedimiento se puede ejecutar manualmente o con un cron job

DROP PROCEDURE IF EXISTS resetear_contadores_diarios;

DELIMITER $$

CREATE PROCEDURE resetear_contadores_diarios()
BEGIN
    -- Resetear contadores de clientes cuya última reasignación no fue hoy
    UPDATE clientes 
    SET contador_reasignaciones_hoy = 0
    WHERE fecha_ultima_reasignacion IS NOT NULL 
      AND fecha_ultima_reasignacion < CURDATE()
      AND contador_reasignaciones_hoy > 0;
    
    SELECT 
        COUNT(*) as clientes_reseteados,
        CURDATE() as fecha_reseteo
    FROM clientes 
    WHERE fecha_ultima_reasignacion IS NOT NULL 
      AND fecha_ultima_reasignacion < CURDATE();
END$$

DELIMITER ;

-- =====================================================
-- VISTA: Estadísticas de reasignaciones diarias
-- =====================================================

CREATE OR REPLACE VIEW vista_reasignaciones_diarias AS
SELECT 
    DATE(fecha_ultima_reasignacion) as fecha,
    COUNT(*) as total_clientes,
    SUM(contador_reasignaciones_hoy) as total_reasignaciones_dia,
    AVG(contador_reasignaciones_hoy) as promedio_por_cliente,
    MAX(contador_reasignaciones_hoy) as max_reasignaciones
FROM clientes
WHERE fecha_ultima_reasignacion IS NOT NULL
GROUP BY DATE(fecha_ultima_reasignacion)
ORDER BY fecha DESC;

-- =====================================================
-- INICIALIZACIÓN: Setear datos actuales
-- =====================================================

-- Para los clientes existentes, inicializar con 0
UPDATE clientes 
SET contador_reasignaciones_hoy = 0,
    fecha_ultima_reasignacion = NULL
WHERE contador_reasignaciones_hoy IS NULL;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver clientes con reasignaciones hoy
SELECT 
    id,
    telefono,
    contador_reasignaciones_hoy as reasignaciones_hoy,
    contador_reasignaciones as reasignaciones_total,
    fecha_ultima_reasignacion,
    asesor_asignado
FROM clientes
WHERE contador_reasignaciones_hoy > 0
ORDER BY contador_reasignaciones_hoy DESC
LIMIT 20;

-- Ver estadísticas por día
SELECT * FROM vista_reasignaciones_diarias LIMIT 10;

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================
/*
1. CONTADOR DIARIO:
   - contador_reasignaciones_hoy: Muestra reasignaciones del día actual
   - Se resetea automáticamente cuando hay nueva reasignación en día diferente
   
2. CONTADOR TOTAL:
   - contador_reasignaciones: Se mantiene el histórico total
   - No se resetea nunca
   
3. RESETEO AUTOMÁTICO:
   - El trigger detecta automáticamente si es un nuevo día
   - No requiere cron job obligatorio
   - Opcionalmente se puede ejecutar: CALL resetear_contadores_diarios();
   
4. HISTORIAL COMPLETO:
   - Se mantiene en historial_estados
   - Se puede consultar para reportes históricos
   
5. FRONTEND:
   - Mostrar contador_reasignaciones_hoy en la tabla GTR
   - Tooltip puede mostrar contador_reasignaciones (total histórico)
*/