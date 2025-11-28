-- =====================================================
-- Migración: Agregar contador de reasignaciones
-- Fecha: 2024-11-26
-- Descripción: Agrega campo para contar cuántas veces
--              un cliente ha sido reasignado entre asesores
-- =====================================================

-- 1. Agregar campo contador_reasignaciones a tabla clientes
ALTER TABLE clientes
ADD COLUMN contador_reasignaciones INT DEFAULT 0 NOT NULL COMMENT 'Número de veces que el cliente ha sido reasignado entre asesores'
AFTER asesor_asignado;

-- 2. Calcular valor inicial basado en historial existente
-- (Contar cambios de asesor en historial_estados)
UPDATE clientes c
SET contador_reasignaciones = (
    SELECT COUNT(*) - 1
    FROM historial_estados he
    WHERE he.cliente_id = c.id
    AND he.tipo = 'reasignacion'
)
WHERE EXISTS (
    SELECT 1 FROM historial_estados he 
    WHERE he.cliente_id = c.id
    AND he.tipo = 'reasignacion'
);

-- 3. Crear índice para optimizar consultas por prioridad de reasignación
CREATE INDEX idx_contador_reasignaciones ON clientes(contador_reasignaciones, fecha_wizard_completado);

-- 4. Comentario en la tabla
ALTER TABLE clientes 
MODIFY COLUMN contador_reasignaciones INT DEFAULT 0 NOT NULL 
COMMENT 'Contador de reasignaciones. Mayor valor = más prioridad para NO reasignar';

-- =====================================================
-- TRIGGER: Actualizar contador automáticamente
-- =====================================================

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS actualizar_contador_reasignaciones;

-- Crear trigger que incrementa contador cuando cambia asesor_id
DELIMITER $$

CREATE TRIGGER actualizar_contador_reasignaciones
AFTER UPDATE ON clientes
FOR EACH ROW
BEGIN
    -- Si el asesor_asignado cambió (reasignación)
    IF OLD.asesor_asignado IS NOT NULL 
       AND NEW.asesor_asignado IS NOT NULL 
       AND OLD.asesor_asignado != NEW.asesor_asignado 
       AND NEW.asesor_asignado > 0 THEN
        
        -- Incrementar contador
        UPDATE clientes 
        SET contador_reasignaciones = contador_reasignaciones + 1
        WHERE id = NEW.id;
        
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver clientes con más reasignaciones (mayor prioridad de NO reasignar)
SELECT 
    id,
    nombre,
    telefono,
    asesor_asignado,
    contador_reasignaciones,
    fecha_wizard_completado,
    updated_at
FROM clientes
WHERE contador_reasignaciones > 0
ORDER BY contador_reasignaciones DESC, fecha_wizard_completado DESC
LIMIT 20;

-- Estadísticas generales
SELECT 
    '0 reasignaciones' as categoria,
    COUNT(*) as cantidad
FROM clientes
WHERE contador_reasignaciones = 0

UNION ALL

SELECT 
    '1-2 reasignaciones' as categoria,
    COUNT(*) as cantidad
FROM clientes
WHERE contador_reasignaciones BETWEEN 1 AND 2

UNION ALL

SELECT 
    '3-5 reasignaciones' as categoria,
    COUNT(*) as cantidad
FROM clientes
WHERE contador_reasignaciones BETWEEN 3 AND 5

UNION ALL

SELECT 
    '6+ reasignaciones' as categoria,
    COUNT(*) as cantidad
FROM clientes
WHERE contador_reasignaciones >= 6;

-- =====================================================
-- NOTAS DE USO
-- =====================================================
/*
INTERPRETACIÓN DEL CONTADOR:
- 0 = Cliente nunca reasignado (está con su primer asesor)
- 1 = Cliente reasignado 1 vez (2do asesor)
- 2 = Cliente reasignado 2 veces (3er asesor)
- 3+ = Cliente reasignado múltiples veces (ALTA PRIORIDAD de NO reasignar más)

USO EN EL FRONTEND:
1. Mostrar badge con número de reasignaciones
2. Color de alerta:
   - Verde (0-1): Normal
   - Amarillo (2-3): Precaución
   - Rojo (4+): EVITAR reasignar

3. Al asignar/reasignar, considerar este contador para:
   - Advertir al usuario antes de reasignar clientes con contador alto
   - Priorizar mantener clientes con el mismo asesor
   - Reportes de estabilidad de asignaciones

EJEMPLO DE QUERY PARA PANEL GTR:
SELECT 
    u.nombre as asesor,
    COUNT(c.id) as total_clientes,
    SUM(CASE WHEN c.contador_reasignaciones = 0 THEN 1 ELSE 0 END) as clientes_originales,
    SUM(CASE WHEN c.contador_reasignaciones > 0 THEN 1 ELSE 0 END) as clientes_reasignados,
    AVG(c.contador_reasignaciones) as promedio_reasignaciones
FROM usuarios u
LEFT JOIN clientes c ON c.asesor_asignado = u.id
WHERE u.tipo = 'asesor' AND c.wizard_completado = 1
GROUP BY u.id, u.nombre
ORDER BY total_clientes DESC;
*/
