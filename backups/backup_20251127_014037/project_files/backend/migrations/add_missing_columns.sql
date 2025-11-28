-- Agregar columnas faltantes a la tabla clientes
USE albru;

ALTER TABLE clientes 
ADD COLUMN numero_registro VARCHAR(50) NULL,
ADD COLUMN numero_referencia VARCHAR(50) NULL;

-- Verificar que las columnas se agregaron correctamente
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'albru' 
AND TABLE_NAME = 'clientes' 
AND COLUMN_NAME IN ('numero_registro', 'numero_referencia');