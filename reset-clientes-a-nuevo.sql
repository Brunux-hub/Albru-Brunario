-- ================================================
-- SCRIPT: Resetear clientes gestionados a NUEVO
-- Descripción: Vuelve todos los clientes con modificaciones
--              al estado inicial "nuevo" para poder probar
--              el flujo completo de gestión
-- ================================================

-- 1. RESETEAR CLIENTES GESTIONADOS (volver a estado inicial)
UPDATE clientes
SET 
  -- Limpiar seguimiento
  seguimiento_status = 'no_gestionado',
  asesor_asignado = NULL,
  opened_at = NULL,
  returned_at = NULL,
  last_activity = NULL,
  
  -- Limpiar wizard
  wizard_completado = 0,
  fecha_wizard_completado = NULL,
  
  -- Limpiar estatus comercial
  estatus_comercial_categoria = NULL,
  estatus_comercial_subcategoria = NULL,
  
  -- Actualizar timestamp
  updated_at = NOW()
WHERE 
  -- Solo clientes que tienen alguna modificación
  (seguimiento_status IS NOT NULL AND seguimiento_status != 'no_gestionado')
  OR asesor_asignado IS NOT NULL
  OR wizard_completado = 1
  OR estatus_comercial_categoria IS NOT NULL;

-- 2. Ver resumen de cambios
SELECT 
  'Clientes reseteados' AS tipo,
  COUNT(*) AS cantidad
FROM clientes
WHERE seguimiento_status = 'no_gestionado'
  AND asesor_asignado IS NULL
  AND wizard_completado = 0;

-- 3. Ver estado actual de todos los clientes
SELECT 
  seguimiento_status,
  COUNT(*) AS cantidad
FROM clientes
GROUP BY seguimiento_status;

-- 4. OPCIONAL: Limpiar historial de estados del día de hoy
-- (Descomenta si quieres limpiar el historial también)
/*
DELETE FROM historial_estados 
WHERE DATE(created_at) = CURDATE();

DELETE FROM historial_cliente 
WHERE DATE(created_at) = CURDATE();
*/

SELECT '✅ Clientes reseteados exitosamente' AS mensaje;
