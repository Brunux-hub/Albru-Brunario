-- ===============================================
-- MIGRACIÓN: Agregar campos del wizard del asesor
-- Fecha: 13 de octubre 2025
-- Descripción: Agrega todos los campos faltantes del wizard del asesor
-- ===============================================

USE albru;

-- Agregar campos faltantes del PASO 1 del wizard
ALTER TABLE clientes 
ADD COLUMN lead_score VARCHAR(50) NULL COMMENT 'Score del lead del paso 1',
ADD COLUMN tipo_cliente_wizard ENUM('nuevo', 'antiguo') NULL COMMENT 'Tipo de cliente del wizard paso 1';

-- Agregar campos faltantes del PASO 2 del wizard
ALTER TABLE clientes 
ADD COLUMN telefono_registro VARCHAR(20) NULL COMMENT 'Teléfono de registro del paso 2',
ADD COLUMN dni_nombre_titular VARCHAR(100) NULL COMMENT 'DNI/Nombre titular línea telefónica',
ADD COLUMN parentesco_titular VARCHAR(50) NULL COMMENT 'Parentesco con el titular de la línea',
ADD COLUMN telefono_referencia_wizard VARCHAR(20) NULL COMMENT 'Teléfono de referencia',
ADD COLUMN telefono_grabacion_wizard VARCHAR(20) NULL COMMENT 'Teléfono de grabación',
ADD COLUMN departamento VARCHAR(50) NULL COMMENT 'Departamento (UBIGEO)',
ADD COLUMN direccion_completa TEXT NULL COMMENT 'Dirección completa del paso 2',
ADD COLUMN numero_piso_wizard VARCHAR(10) NULL COMMENT 'Número de piso del wizard';

-- Agregar campos faltantes del PASO 3 del wizard
ALTER TABLE clientes 
ADD COLUMN tipo_plan VARCHAR(100) NULL COMMENT 'Tipo de plan seleccionado',
ADD COLUMN servicio_contratado TEXT NULL COMMENT 'Servicios contratados (JSON o lista separada por comas)',
ADD COLUMN velocidad_contratada VARCHAR(50) NULL COMMENT 'Velocidad contratada',
ADD COLUMN precio_plan DECIMAL(10,2) NULL COMMENT 'Precio del plan',
ADD COLUMN dispositivos_adicionales_wizard TEXT NULL COMMENT 'Dispositivos adicionales seleccionados',
ADD COLUMN plataforma_digital_wizard TEXT NULL COMMENT 'Plataformas digitales seleccionadas';

-- Agregar campos faltantes del PASO 4 del wizard
ALTER TABLE clientes 
ADD COLUMN pago_adelanto_instalacion_wizard ENUM('SI', 'NO') NULL COMMENT 'Pago adelanto instalación';

-- Agregar campos de metadatos del wizard
ALTER TABLE clientes 
ADD COLUMN wizard_completado BOOLEAN DEFAULT FALSE COMMENT 'Indica si el wizard fue completado',
ADD COLUMN fecha_wizard_completado TIMESTAMP NULL COMMENT 'Fecha cuando se completó el wizard',
ADD COLUMN wizard_data_json JSON NULL COMMENT 'Datos completos del wizard en formato JSON para respaldo';

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_clientes_wizard_completado ON clientes(wizard_completado);
CREATE INDEX idx_clientes_tipo_cliente_wizard ON clientes(tipo_cliente_wizard);
CREATE INDEX idx_clientes_departamento ON clientes(departamento);
CREATE INDEX idx_clientes_distrito ON clientes(distrito);

-- Mostrar la estructura actualizada
DESCRIBE clientes;