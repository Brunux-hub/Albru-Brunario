-- ================================================
-- SCRIPT: Limpiar COMPLETAMENTE los clientes
-- Descripción: Elimina TODOS los campos de seguimiento
--              para que los clientes aparezcan completamente
--              limpios (sin badge "No Gestionado")
-- ================================================

-- 1. LIMPIAR COMPLETAMENTE todos los clientes con seguimiento
UPDATE clientes
SET 
  -- Limpiar TODOS los campos de seguimiento
  seguimiento_status = NULL,
  asesor_asignado = NULL,
  opened_at = NULL,
  returned_at = NULL,
  last_activity = NULL,
  
  -- Limpiar wizard
  wizard_completado = NULL,
  fecha_wizard_completado = NULL,
  
  -- Limpiar estatus comercial
  estatus_comercial_categoria = NULL,
  estatus_comercial_subcategoria = NULL,
  
  -- Actualizar timestamp
  updated_at = NOW()
WHERE 
  -- Limpiar cualquier cliente que tenga algún campo de seguimiento
  seguimiento_status IS NOT NULL
  OR asesor_asignado IS NOT NULL
  OR wizard_completado IS NOT NULL
  OR estatus_comercial_categoria IS NOT NULL
  OR opened_at IS NOT NULL;

-- 2. Ver cuántos clientes se limpiaron
SELECT 
  'Clientes limpiados completamente' AS tipo,
  COUNT(*) AS cantidad
FROM clientes
WHERE seguimiento_status IS NULL
  AND asesor_asignado IS NULL
  AND wizard_completado IS NULL;

-- 3. Ver estado final de seguimiento_status
SELECT 
  COALESCE(seguimiento_status, 'LIMPIO (NULL)') AS estado,
  COUNT(*) AS cantidad
FROM clientes
GROUP BY seguimiento_status
ORDER BY COUNT(*) DESC;

SELECT '✅ Clientes completamente limpios - Sin badges' AS mensaje;
