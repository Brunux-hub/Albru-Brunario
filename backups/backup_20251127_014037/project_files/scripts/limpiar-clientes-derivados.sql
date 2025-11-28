-- Script para limpiar clientes derivados y resetear seguimiento
-- Esto permite hacer pruebas desde cero del sistema de seguimiento automático

-- 1. Limpiar seguimiento_status de todos los clientes
UPDATE clientes 
SET 
  seguimiento_status = NULL,
  derivado_at = NULL,
  opened_at = NULL,
  asesor_asignado = NULL,
  updated_at = NOW()
WHERE seguimiento_status IS NOT NULL;

-- 2. Limpiar locks de clientes
DELETE FROM cliente_locks;

-- 3. Verificar estado final
SELECT 
  COUNT(*) as total_clientes,
  SUM(CASE WHEN seguimiento_status IS NULL THEN 1 ELSE 0 END) as sin_seguimiento,
  SUM(CASE WHEN seguimiento_status = 'derivado' THEN 1 ELSE 0 END) as derivados,
  SUM(CASE WHEN seguimiento_status = 'en_gestion' THEN 1 ELSE 0 END) as en_gestion,
  SUM(CASE WHEN seguimiento_status = 'gestionado' THEN 1 ELSE 0 END) as gestionados,
  SUM(CASE WHEN asesor_asignado IS NULL THEN 1 ELSE 0 END) as sin_asesor
FROM clientes;

-- 4. Mostrar clientes disponibles para asignar
SELECT 
  id,
  nombre,
  telefono,
  asesor_asignado,
  seguimiento_status
FROM clientes
ORDER BY id
LIMIT 10;
