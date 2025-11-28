-- Migration: Crear tabla historial_estados
-- Fecha: 2025-10-30
CREATE TABLE IF NOT EXISTS historial_estados (
  id INT NOT NULL AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  usuario_id INT NULL,
  tipo ENUM('gtr','asesor','sistema','calidad') DEFAULT 'sistema',
  estado_anterior VARCHAR(255) NULL,
  estado_nuevo VARCHAR(255) NULL,
  comentarios TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_historial_cliente (cliente_id),
  INDEX idx_historial_usuario (usuario_id)
);
