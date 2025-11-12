DELIMITER $$

DROP TRIGGER IF EXISTS increment_atendidos_after_gestion$$

CREATE TRIGGER increment_atendidos_after_gestion
AFTER INSERT ON historial_estados
FOR EACH ROW
BEGIN
  IF NEW.estado_nuevo IN ('INTERESADO', 'NO CONTESTA', 'RECHAZADO', 'INFORMACION INCORRECTA', 'VENTAS', 'NO INTERESADO') THEN
    SET @asesor_id = (SELECT asesor_asignado FROM clientes WHERE id = NEW.cliente_id LIMIT 1);
    
    IF @asesor_id IS NOT NULL THEN
      INSERT INTO asesor_stats_daily (asesor_id, fecha, clientes_atendidos, clientes_reasignados)
      VALUES (@asesor_id, DATE(CONVERT_TZ(NOW(), '+00:00', '-05:00')), 1, 0)
      ON DUPLICATE KEY UPDATE clientes_atendidos = clientes_atendidos + 1;
    END IF;
  END IF;
END$$

DROP TRIGGER IF EXISTS increment_reasignados_after_reassign$$

CREATE TRIGGER increment_reasignados_after_reassign
AFTER UPDATE ON clientes
FOR EACH ROW
BEGIN
  IF OLD.asesor_asignado IS NOT NULL AND NEW.asesor_asignado IS NOT NULL AND OLD.asesor_asignado != NEW.asesor_asignado THEN
    INSERT INTO asesor_stats_daily (asesor_id, fecha, clientes_atendidos, clientes_reasignados)
    VALUES (NEW.asesor_asignado, DATE(CONVERT_TZ(NOW(), '+00:00', '-05:00')), 0, 1)
    ON DUPLICATE KEY UPDATE clientes_reasignados = clientes_reasignados + 1;
  END IF;
END$$

DELIMITER ;
