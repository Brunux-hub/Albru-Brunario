-- Migración 007: Sistema de Duplicados y Categorización Automática
-- Fecha: 12 de noviembre de 2025
-- Objetivo: Identificar duplicados, categorizar correctamente y contar gestiones

-- 1. Agregar campos para manejo de duplicados
ALTER TABLE clientes 
ADD COLUMN es_duplicado BOOLEAN DEFAULT FALSE COMMENT 'TRUE si es un registro duplicado (no principal)',
ADD COLUMN telefono_principal_id INT NULL COMMENT 'ID del registro principal si es duplicado',
ADD COLUMN cantidad_duplicados INT DEFAULT 1 COMMENT 'Cantidad total de registros con mismo teléfono',
ADD COLUMN tipificacion_original VARCHAR(100) NULL COMMENT 'Tipificación original del CSV (ej: 4 - DOBLE CLICK)';

-- 2. Agregar índices para optimización
ALTER TABLE clientes
ADD INDEX idx_telefono_principal (telefono_principal_id),
ADD INDEX idx_es_duplicado (es_duplicado),
ADD INDEX idx_telefono_duplicados (telefono),
ADD INDEX idx_tipificacion (tipificacion_original);

-- 3. Identificar el registro PRINCIPAL de cada teléfono (el más antiguo)
UPDATE clientes c1
SET 
    es_duplicado = FALSE,
    cantidad_duplicados = (
        SELECT COUNT(*) 
        FROM clientes c2 
        WHERE c2.telefono = c1.telefono 
          AND c2.telefono IS NOT NULL 
          AND c2.telefono != ''
    ),
    telefono_principal_id = NULL
WHERE c1.id IN (
    SELECT MIN(id) 
    FROM (SELECT id, telefono FROM clientes) AS temp
    WHERE telefono IS NOT NULL AND telefono != ''
    GROUP BY telefono
);

-- 4. Marcar los registros DUPLICADOS
UPDATE clientes c1
SET 
    es_duplicado = TRUE,
    telefono_principal_id = (
        SELECT MIN(id) 
        FROM (SELECT id, telefono FROM clientes) AS temp
        WHERE temp.telefono = c1.telefono 
          AND temp.telefono IS NOT NULL
    )
WHERE c1.id NOT IN (
    SELECT MIN(id) 
    FROM (SELECT id, telefono FROM clientes) AS temp
    WHERE telefono IS NOT NULL AND telefono != ''
    GROUP BY telefono
) 
AND c1.telefono IS NOT NULL 
AND c1.telefono != '';

-- 5. Verificación de duplicados
SELECT 
    'Resumen de Duplicados' as info,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN es_duplicado = FALSE THEN 1 END) as registros_principales,
    COUNT(CASE WHEN es_duplicado = TRUE THEN 1 END) as registros_duplicados,
    SUM(cantidad_duplicados) as total_gestiones_posibles
FROM clientes
WHERE telefono IS NOT NULL AND telefono != '';

-- 6. Ver top 10 teléfonos con más duplicados
SELECT 
    telefono,
    cantidad_duplicados,
    MIN(id) as id_principal,
    GROUP_CONCAT(id ORDER BY id) as todos_los_ids
FROM clientes
WHERE cantidad_duplicados > 1
GROUP BY telefono, cantidad_duplicados
ORDER BY cantidad_duplicados DESC
LIMIT 10;
