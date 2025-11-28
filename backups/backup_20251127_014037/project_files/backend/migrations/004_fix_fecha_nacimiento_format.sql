-- Migración para corregir fechas en formato incorrecto en fecha_nacimiento
-- Convierte fechas ISO/DATETIME a formato DATE (YYYY-MM-DD)

USE albru;

-- Paso 1: Crear columna temporal para backup
ALTER TABLE clientes ADD COLUMN fecha_nacimiento_backup VARCHAR(255) NULL AFTER fecha_nacimiento;

-- Paso 2: Copiar datos originales al backup
UPDATE clientes SET fecha_nacimiento_backup = fecha_nacimiento WHERE fecha_nacimiento IS NOT NULL;

-- Paso 3: Limpiar fechas que no son NULL pero están vacías o mal formateadas
UPDATE clientes SET fecha_nacimiento = NULL WHERE fecha_nacimiento = '' OR fecha_nacimiento = '0000-00-00';

-- Paso 4: No necesitamos hacer nada más porque fecha_nacimiento ya es tipo DATE
-- MySQL debería rechazar valores inválidos, pero si hay datos corruptos los limpiamos

-- Verificar si hay registros con problemas
SELECT id, nombre, fecha_nacimiento, fecha_nacimiento_backup 
FROM clientes 
WHERE fecha_nacimiento IS NOT NULL 
LIMIT 10;

-- NOTA: Si encuentras fechas en formato ISO guardadas como DATE, necesitas ejecutar:
-- UPDATE clientes SET fecha_nacimiento = DATE(fecha_nacimiento_backup) WHERE fecha_nacimiento_backup LIKE '%T%';

-- Opcional: Eliminar columna de backup después de verificar
-- ALTER TABLE clientes DROP COLUMN fecha_nacimiento_backup;
