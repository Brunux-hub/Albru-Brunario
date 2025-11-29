-- Script para recalcular los contadores de reasignaciones basándose en el historial real
-- Detecta cambios de asesor en el historial_estados para actualizar el contador

-- Primero, creamos una tabla temporal con las reasignaciones reales
CREATE TEMPORARY TABLE temp_reasignaciones AS
SELECT 
    he1.cliente_id,
    COUNT(DISTINCT he1.id) as total_reasignaciones
FROM historial_estados he1
WHERE he1.id IN (
    SELECT MIN(he2.id)
    FROM historial_estados he2
    WHERE he2.cliente_id = he1.cliente_id
    AND he2.usuario_id != (
        SELECT he3.usuario_id
        FROM historial_estados he3
        WHERE he3.cliente_id = he2.cliente_id
        AND he3.id < he2.id
        ORDER BY he3.id DESC
        LIMIT 1
    )
    GROUP BY he2.cliente_id, he2.usuario_id
)
AND he1.id > (
    SELECT MIN(he4.id)
    FROM historial_estados he4
    WHERE he4.cliente_id = he1.cliente_id
)
GROUP BY he1.cliente_id;

-- Ver qué clientes tienen diferencias
SELECT 
    c.id,
    c.telefono,
    c.contador_reasignaciones as contador_actual,
    COALESCE(tr.total_reasignaciones, 0) as contador_real,
    (COALESCE(tr.total_reasignaciones, 0) - c.contador_reasignaciones) as diferencia
FROM clientes c
LEFT JOIN temp_reasignaciones tr ON c.id = tr.cliente_id
WHERE c.contador_reasignaciones != COALESCE(tr.total_reasignaciones, 0)
ORDER BY diferencia DESC
LIMIT 20;

-- Actualizar todos los contadores
UPDATE clientes c
LEFT JOIN temp_reasignaciones tr ON c.id = tr.cliente_id
SET c.contador_reasignaciones = COALESCE(tr.total_reasignaciones, 0)
WHERE c.contador_reasignaciones != COALESCE(tr.total_reasignaciones, 0);

-- Mostrar estadísticas finales
SELECT 
    'Clientes con 0 reasignaciones' as descripcion,
    COUNT(*) as cantidad
FROM clientes 
WHERE contador_reasignaciones = 0
UNION ALL
SELECT 
    'Clientes con 1+ reasignaciones' as descripcion,
    COUNT(*) as cantidad
FROM clientes 
WHERE contador_reasignaciones > 0
UNION ALL
SELECT 
    'Total de clientes' as descripcion,
    COUNT(*) as cantidad
FROM clientes;

-- Limpiar tabla temporal
DROP TEMPORARY TABLE temp_reasignaciones;