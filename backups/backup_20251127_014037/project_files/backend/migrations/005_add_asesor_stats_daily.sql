-- Tabla para estadísticas diarias de asesores
CREATE TABLE IF NOT EXISTS asesor_stats_daily (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asesor_id INT NOT NULL,
  fecha DATE NOT NULL,
  clientes_atendidos INT DEFAULT 0,
  clientes_reasignados INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_asesor_fecha (asesor_id, fecha),
  FOREIGN KEY (asesor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_asesor_fecha (asesor_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger para incrementar clientes_atendidos cuando el estatus cambia a gestionado
DELIMITER $$

CREATE TRIGGER increment_atendidos_after_gestion
AFTER INSERT ON historial_estados
FOR EACH ROW
BEGIN
  -- Solo contar si el estado es uno de los estados finales de gestión
  IF NEW.estado_nuevo IN ('INTERESADO', 'NO CONTESTA', 'RECHAZADO', 'INFORMACION INCORRECTA', 'VENTAS', 'NO INTERESADO') THEN
    -- Obtener el asesor del cliente
    SET @asesor_id = (SELECT asesor_asignado FROM clientes WHERE id = NEW.cliente_id LIMIT 1);
    
    IF @asesor_id IS NOT NULL THEN
      -- Incrementar contador del día actual (hora Perú UTC-5)
      INSERT INTO asesor_stats_daily (asesor_id, fecha, clientes_atendidos, clientes_reasignados)
      VALUES (@asesor_id, DATE(CONVERT_TZ(NOW(), '+00:00', '-05:00')), 1, 0)
      ON DUPLICATE KEY UPDATE clientes_atendidos = clientes_atendidos + 1;
    END IF;
  END IF;
END$$

DELIMITER ;

-- Trigger para incrementar clientes_reasignados cuando se reasigna un cliente
DELIMITER $$

CREATE TRIGGER increment_reasignados_after_reassign
AFTER UPDATE ON clientes
FOR EACH ROW
BEGIN
  -- Solo contar si cambió el asesor_asignado
  IF OLD.asesor_asignado IS NOT NULL AND NEW.asesor_asignado IS NOT NULL AND OLD.asesor_asignado != NEW.asesor_asignado THEN
    -- Incrementar contador para el NUEVO asesor (el que recibe el cliente)
    INSERT INTO asesor_stats_daily (asesor_id, fecha, clientes_atendidos, clientes_reasignados)
    VALUES (NEW.asesor_asignado, DATE(CONVERT_TZ(NOW(), '+00:00', '-05:00')), 0, 1)
    ON DUPLICATE KEY UPDATE clientes_reasignados = clientes_reasignados + 1;
  END IF;
END$$

DELIMITER ;
