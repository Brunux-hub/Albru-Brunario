-- Crear tabla para comentarios del GTR hacia el asesor
-- Estos comentarios se muestran en tiempo real en el wizard del asesor

CREATE TABLE IF NOT EXISTS comentarios_gtr (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  gtr_id INT NOT NULL,
  asesor_id INT DEFAULT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_cliente (cliente_id),
  INDEX idx_asesor (asesor_id),
  INDEX idx_leido (leido),
  INDEX idx_created (created_at),
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  FOREIGN KEY (gtr_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (asesor_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
