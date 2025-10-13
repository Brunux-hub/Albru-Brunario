-- Migración completa: Agregar todas las columnas faltantes a la tabla clientes
USE albru;

-- Agregar todas las columnas faltantes una por una
ALTER TABLE clientes 
ADD COLUMN numero_registro VARCHAR(50) NULL,
ADD COLUMN numero_grabacion VARCHAR(50) NULL,
ADD COLUMN numero_referencia VARCHAR(50) NULL,
ADD COLUMN tipo_documento VARCHAR(30) NULL,
ADD COLUMN fecha_nacimiento DATE NULL,
ADD COLUMN lugar_nacimiento VARCHAR(100) NULL,
ADD COLUMN titular_linea VARCHAR(100) NULL,
ADD COLUMN numero_piso VARCHAR(10) NULL,
ADD COLUMN interior VARCHAR(20) NULL,
ADD COLUMN tipo_cliente VARCHAR(50) NULL,
ADD COLUMN dispositivos_adicionales TEXT NULL,
ADD COLUMN pago_adelanto_instalacion DECIMAL(10,2) NULL,
ADD COLUMN plataforma_digital VARCHAR(50) NULL,
ADD COLUMN fecha_programacion TIMESTAMP NULL,
ADD COLUMN fecha_instalacion DATE NULL,
ADD COLUMN fecha_lead TIMESTAMP NULL,
ADD COLUMN score INT NULL;

-- Verificar que todas las columnas se agregaron correctamente
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'albru' 
AND TABLE_NAME = 'clientes'
ORDER BY ORDINAL_POSITION;