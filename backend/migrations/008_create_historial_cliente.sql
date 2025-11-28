-- Migration: Crear tabla historial_cliente si no existe
-- Fecha: 2025-11-27
CREATE TABLE IF NOT EXISTS historial_cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    usuario_id INT NOT NULL,
    accion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_created_at (created_at)
);

-- Nota: Esta migración se aplica manualmente cuando la base de datos ya existe
-- (no se ejecutó el script `albru_nueva_estructura.sql` en la inicialización).
