-- Migración: Tabla para historial detallado de gestiones por paso (para importar Excel)
-- Fecha: 2025-11-15
-- Descripción: Almacena el historial completo de gestiones de cada lead,
--              replicando la estructura del Excel con múltiples pasos de asesores

CREATE TABLE IF NOT EXISTS historial_gestiones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Identificación del cliente
  cliente_id INT NOT NULL,
  telefono VARCHAR(20), -- Lead original del Excel
  
  -- Número de paso en el proceso (1, 2, 3... = ASESOR-1, ASESOR-2...)
  paso INT NOT NULL,
  
  -- Información del asesor en este paso
  asesor_nombre VARCHAR(255),
  asesor_id INT, -- Referencia a tabla asesores si existe
  
  -- Categorización/Tipificación en este paso (columna TIPO del Excel)
  categoria VARCHAR(100), -- NO-CONTESTA, PREVENTA, SIN COBERTURA/DAL, etc.
  subcategoria VARCHAR(100), -- Subcategoría si existe
  
  -- Tipo de contacto realizado
  tipo_contacto VARCHAR(50) DEFAULT 'telefónico', -- Telefónico, email, presencial, etc.
  
  -- Resultado de la gestión
  resultado ENUM('exitoso', 'sin_contacto', 'rechazado', 'agendado', 'pendiente', 'derivado') DEFAULT 'pendiente',
  
  -- Observaciones y comentarios
  observaciones TEXT,
  comentario TEXT,
  
  -- Fechas
  fecha_gestion DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índices para búsqueda rápida
  INDEX idx_cliente_paso (cliente_id, paso),
  INDEX idx_telefono (telefono),
  INDEX idx_asesor (asesor_id),
  INDEX idx_fecha (fecha_gestion),
  
  -- Foreign key
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentarios de la tabla
ALTER TABLE historial_gestiones 
  COMMENT = 'Historial detallado de gestiones por paso para visualización de stepper y análisis de conversión';
