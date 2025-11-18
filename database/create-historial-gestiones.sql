-- ============================================
-- TABLA: historial_gestiones
-- ============================================
-- Propósito: Almacenar el historial completo de gestiones realizadas
--            por los asesores sobre los clientes.
--            
-- Características:
-- - Soporta múltiples gestiones por cliente
-- - Registra paso secuencial de cada gestión
-- - Incluye categorización y subcategorización
-- - Mantiene observaciones y comentarios
-- - Registra asesor responsable
-- - Timestamps automáticos
--
-- Uso: Esta tabla es alimentada por:
--      1. Importación desde Excel (script importar-historial-gestiones.cjs)
--      2. Gestiones en tiempo real desde el panel GTR
--
-- Visualización: Panel GTR → Modal de Historial del Cliente
-- ============================================

CREATE TABLE IF NOT EXISTS historial_gestiones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Relación con cliente
  cliente_id INT NOT NULL,
  
  -- Secuencia de la gestión
  paso INT NOT NULL COMMENT 'Número secuencial de la gestión (1, 2, 3...)',
  
  -- Información del asesor
  asesor_id INT NULL COMMENT 'ID del usuario asesor (si existe en tabla usuarios)',
  asesor_nombre VARCHAR(255) NULL COMMENT 'Nombre del asesor (puede venir del Excel)',
  
  -- Categorización de la gestión
  categoria VARCHAR(100) NULL COMMENT 'Categoría principal: Lista negra, Preventa, Agendado, Seguimiento, etc.',
  subcategoria VARCHAR(100) NULL COMMENT 'Subcategoría: Venta cerrada, No contesta, Gestión o chat, etc.',
  
  -- Detalles adicionales
  tipo_contacto VARCHAR(50) NULL COMMENT 'Tipo de contacto realizado',
  resultado VARCHAR(100) NULL COMMENT 'Resultado de la gestión',
  
  -- Observaciones
  observaciones TEXT NULL COMMENT 'Observaciones detalladas de la gestión',
  comentario TEXT NULL COMMENT 'Comentario adicional del asesor',
  
  -- Fecha de la gestión
  fecha_gestion DATETIME NULL COMMENT 'Fecha y hora en que se realizó la gestión',
  
  -- Timestamps automáticos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices para optimizar consultas
  INDEX idx_cliente_id (cliente_id),
  INDEX idx_asesor_id (asesor_id),
  INDEX idx_categoria (categoria),
  INDEX idx_fecha_gestion (fecha_gestion),
  INDEX idx_cliente_paso (cliente_id, paso),
  
  -- Relación con tabla clientes
  CONSTRAINT fk_historial_cliente 
    FOREIGN KEY (cliente_id) 
    REFERENCES clientes(id) 
    ON DELETE CASCADE,
  
  -- Relación opcional con tabla usuarios
  CONSTRAINT fk_historial_asesor 
    FOREIGN KEY (asesor_id) 
    REFERENCES usuarios(id) 
    ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historial completo de gestiones realizadas sobre clientes';

-- ============================================
-- CONSULTAS ÚTILES
-- ============================================

-- Ver historial de un cliente específico (ordenado por paso)
-- SELECT * FROM historial_gestiones WHERE cliente_id = 11225 ORDER BY paso ASC;

-- Ver clientes con más gestiones
-- SELECT cliente_id, COUNT(*) as total_gestiones 
-- FROM historial_gestiones 
-- GROUP BY cliente_id 
-- ORDER BY total_gestiones DESC 
-- LIMIT 10;

-- Ver gestiones por categoría
-- SELECT categoria, COUNT(*) as total 
-- FROM historial_gestiones 
-- GROUP BY categoria 
-- ORDER BY total DESC;

-- Ver gestiones por asesor
-- SELECT asesor_nombre, COUNT(*) as total_gestiones 
-- FROM historial_gestiones 
-- GROUP BY asesor_nombre 
-- ORDER BY total_gestiones DESC;

-- Ver gestiones recientes
-- SELECT hg.*, c.nombre as cliente_nombre
-- FROM historial_gestiones hg
-- JOIN clientes c ON hg.cliente_id = c.id
-- ORDER BY hg.fecha_gestion DESC
-- LIMIT 20;

-- ============================================
-- ESTADÍSTICAS IMPORTADAS (18 Nov 2025)
-- ============================================
-- Total registros: 54,952 gestiones
-- Clientes únicos: 13,686
-- Asesores únicos: 81
-- Categorías: 26 tipificaciones mapeadas
-- Rango de fechas: Desde datos históricos en Excel
-- ============================================
