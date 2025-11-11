-- Migration: Respaldar y ajustar la tabla `clientes`
-- Fecha: 2025-10-22
-- Propósito:
-- 1) Crear una tabla de respaldo `clientes_backup` (estructura + datos)
-- 2) Eliminar columnas obsoletas que NO están en el CSV (excepto `nombre`)
-- 3) Añadir las columnas que vienen en el CSV en el orden solicitado
-- IMPORTANTE: Este script **modifica DDL** (ALTER TABLE) y no es reversible automáticamente.
-- Hacer un backup y probar en staging antes de ejecutar en producción.

-- 1) Crear carpeta de backups manualmente si no existe (ejecutar localmente):
--   mkdir -p database/backups

-- Si existiera una tabla `clientes_backup` no la sobrescribimos: crearemos una copia nueva con timestamp.
-- 2) Crear tabla de respaldo dentro de la BD (estructura + datos)
-- Creamos una tabla de respaldo con sufijo timestamp para no sobrescribir backups previos
SET @ts = DATE_FORMAT(NOW(), '%Y%m%d_%H%i%S');
SET @bkname = CONCAT('clientes_backup_', @ts);
SET @s = CONCAT('CREATE TABLE `', @bkname, '` LIKE clientes');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @s = CONCAT('INSERT INTO `', @bkname, '` SELECT * FROM clientes');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;


SET @cols = NULL;

SET @cols = 'apellidos,email,dni,edad,genero,estado_civil,ocupacion,ingresos_mensuales,dependientes_economicos,direccion,ciudad,horario_preferido_contacto,medio_contacto_preferido,asesor_asignado,estado,prioridad,fecha_primer_contacto,fecha_cierre_estimada,observaciones_asesor';
-- 0) Generar y ejecutar DROP de foreign keys en `clientes` que puedan bloquear la eliminación de columnas
SELECT GROUP_CONCAT(CONCAT('ALTER TABLE `', TABLE_NAME, '` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`') SEPARATOR '; ')
  INTO @fk_drop
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'clientes'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY';
SET @fk_drop = IFNULL(@fk_drop, 'SELECT 1');
PREPARE fkstmt FROM @fk_drop; EXECUTE fkstmt; DEALLOCATE PREPARE fkstmt;

-- Eliminar columnas de forma segura: generamos dinámicamente la lista de DROP para las columnas que EXISTEN
SELECT GROUP_CONCAT(CONCAT('DROP COLUMN `', COLUMN_NAME, '`') SEPARATOR ', ') INTO @dropst
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'clientes'
    AND COLUMN_NAME IN ('apellidos','email','dni','edad','genero','estado_civil','ocupacion','ingresos_mensuales','dependientes_economicos','direccion','ciudad','horario_preferido_contacto','medio_contacto_preferido','asesor_asignado','estado','prioridad','fecha_primer_contacto','fecha_cierre_estimada','observaciones_asesor');

SET @sql = IFNULL(CONCAT('ALTER TABLE clientes ', @dropst), 'SELECT "no_columns_to_drop"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) Agregar las columnas del CSV en el orden solicitado (manteniendo `nombre`)
-- Campos a agregar: tipo_base, leads_original_telefono, campana, canal_adquisicion,
-- sala_asignada, compania, back_office_info, tipificacion_back, datos_leads,
-- comentarios_back, ultima_fecha_gestion

ALTER TABLE clientes
  ADD COLUMN tipo_base VARCHAR(50) NULL AFTER nombre,
  ADD COLUMN leads_original_telefono VARCHAR(30) NULL AFTER tipo_base,
  ADD COLUMN campana VARCHAR(100) NULL AFTER leads_original_telefono,
  ADD COLUMN canal_adquisicion VARCHAR(100) NULL AFTER campana,
  ADD COLUMN sala_asignada VARCHAR(100) NULL AFTER canal_adquisicion,
  ADD COLUMN compania VARCHAR(100) NULL AFTER sala_asignada,
  ADD COLUMN back_office_info TEXT NULL AFTER compania,
  ADD COLUMN tipificacion_back VARCHAR(100) NULL AFTER back_office_info,
  ADD COLUMN datos_leads JSON NULL AFTER tipificacion_back,
  ADD COLUMN comentarios_back TEXT NULL AFTER datos_leads,
  ADD COLUMN ultima_fecha_gestion DATETIME NULL AFTER comentarios_back;

-- 5) Notas y pasos sugeridos después de ejecutar:
-- - Verificar integridad: SELECT COUNT(*) FROM clientes; SELECT COUNT(*) FROM clientes_backup;
-- - Revisar índices y añadir índices que sean necesarios sobre los nuevos campos.
-- - Si quieres importar datos del CSV, carga el CSV en una tabla temporal `clientes_import_csv`
--   y mapea los campos a las nuevas columnas (ejemplo de creación temporal abajo):
--
-- CREATE TABLE clientes_import_csv (
--   nombre VARCHAR(100),
--   tipo_base VARCHAR(50),
--   leads_original_telefono VARCHAR(30),
--   campana VARCHAR(100),
--   canal_adquisicion VARCHAR(100),
--   sala_asignada VARCHAR(100),
--   compania VARCHAR(100),
--   back_office_info TEXT,
--   tipificacion_back VARCHAR(100),
--   datos_leads JSON,
--   comentarios_back TEXT,
--   ultima_fecha_gestion DATETIME
-- );
--
-- Luego se puede importar CSV con LOAD DATA INFILE o herramientas de Adminer/Workbench
-- y ejecutar una instrucción de INSERT ... ON DUPLICATE KEY UPDATE o UPDATE SELECT
-- para poblar `clientes` desde `clientes_import_csv`.

-- FIN del script. Ejecutar con precaución en entorno que no sea producción primero.
