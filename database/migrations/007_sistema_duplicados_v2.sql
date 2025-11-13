-- Migración 007: Sistema de Duplicados y Categorización Automática
-- Fecha: 12 de noviembre de 2025
-- Versión 2: Sin subconsultas conflictivas

-- 1. Agregar campos para manejo de duplicados
ALTER TABLE clientes 
ADD COLUMN es_duplicado BOOLEAN DEFAULT FALSE COMMENT 'TRUE si es un registro duplicado (no principal)',
ADD COLUMN telefono_principal_id INT NULL COMMENT 'ID del registro principal si es duplicado',
ADD COLUMN cantidad_duplicados INT DEFAULT 1 COMMENT 'Cantidad total de registros con mismo teléfono',
ADD COLUMN tipificacion_original VARCHAR(100) NULL COMMENT 'Tipificación original del CSV (ej: 4 - DOBLE CLICK)';

-- 2. Agregar índices para optimización
ALTER TABLE clientes
ADD INDEX idx_telefono_principal (telefono_principal_id),
ADD INDEX idx_es_duplicado (es_duplicado),
ADD INDEX idx_telefono_duplicados (telefono);

-- Nota: La identificación de duplicados se hará automáticamente durante la importación
-- del CSV mediante el script import-clientes2-con-categorizacion.js
