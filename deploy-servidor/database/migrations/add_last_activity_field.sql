-- Migración para agregar campo last_activity y mejorar el sistema de seguimiento

-- 1. Agregar campo last_activity para tracking de actividad del asesor
ALTER TABLE clientes 
ADD COLUMN last_activity DATETIME DEFAULT NULL AFTER opened_at;

-- 2. Agregar índices
ALTER TABLE clientes 
ADD INDEX idx_last_activity (last_activity);

ALTER TABLE clientes 
ADD INDEX idx_seguimiento_activity (seguimiento_status, last_activity);

-- 3. Inicializar last_activity con opened_at para clientes en gestión
UPDATE clientes 
SET last_activity = opened_at 
WHERE seguimiento_status = 'en_gestion' AND opened_at IS NOT NULL AND last_activity IS NULL;

-- 3. Verificar estructura
DESCRIBE clientes;

-- 4. Mostrar clientes con seguimiento activo
SELECT 
  id,
  seguimiento_status,
  derivado_at,
  opened_at,
  last_activity,
  asesor_asignado,
  TIMESTAMPDIFF(SECOND, COALESCE(last_activity, opened_at, derivado_at), NOW()) as seconds_inactive
FROM clientes 
WHERE seguimiento_status IN ('derivado', 'en_gestion')
ORDER BY last_activity DESC
LIMIT 10;
