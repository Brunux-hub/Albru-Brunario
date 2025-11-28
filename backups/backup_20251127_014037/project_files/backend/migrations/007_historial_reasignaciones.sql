-- Migration: Crear tabla historial_reasignaciones
-- Fecha: 2025-11-14
CREATE TABLE IF NOT EXISTS historial_reasignaciones (
  id BIGINT NOT NULL AUTO_INCREMENT,
  cliente_id BIGINT NOT NULL,
  asesor_usuario_id BIGINT NULL,
  asesor_nombre VARCHAR(255) NULL,
  categoria VARCHAR(255) NULL,
  subcategoria VARCHAR(255) NULL,
  seguimiento_status VARCHAR(100) NULL,
  comentario TEXT NULL,
  evento VARCHAR(50) DEFAULT 'reasignacion',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_hist_reasign_cliente (cliente_id),
  INDEX idx_hist_reasign_asesor_fecha (asesor_usuario_id, created_at)
);
