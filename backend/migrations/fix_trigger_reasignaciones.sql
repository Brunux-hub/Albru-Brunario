-- Arreglar trigger de contador de reasignaciones
-- Reemplaza el trigger existente (que hacía UPDATE sobre la misma tabla)
-- por un trigger BEFORE UPDATE que modifica directamente NEW.contador_reasignaciones

DROP TRIGGER IF EXISTS actualizar_contador_reasignaciones;

DELIMITER $$

CREATE TRIGGER actualizar_contador_reasignaciones
BEFORE UPDATE ON clientes
FOR EACH ROW
BEGIN
    -- Si el asesor asignado cambió (reasignación válida)
    IF OLD.asesor_asignado IS NOT NULL
       AND NEW.asesor_asignado IS NOT NULL
       AND OLD.asesor_asignado != NEW.asesor_asignado
       AND NEW.asesor_asignado > 0 THEN

        SET NEW.contador_reasignaciones = COALESCE(OLD.contador_reasignaciones, 0) + 1;

    END IF;
END$$

DELIMITER ;

-- Nota: este script evita ejecutar un UPDATE sobre la tabla `clientes` desde el trigger,
-- lo que provocaba el error MySQL 1442: "Can't update table 'clientes' in stored function/trigger..."
