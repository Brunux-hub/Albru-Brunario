-- Agregar campo asesor_gestor para preservar quién gestionó al cliente
-- Esto evita perder la referencia cuando asesor_asignado se limpia al mover a GTR

ALTER TABLE clientes 
ADD COLUMN asesor_gestor INT DEFAULT NULL AFTER asesor_asignado,
ADD KEY idx_asesor_gestor (asesor_gestor);

-- Copiar datos existentes: si un cliente tiene wizard completado y NO tiene asesor_asignado,
-- pero tiene historial, intentar recuperar el último asesor
UPDATE clientes c
SET c.asesor_gestor = (
  SELECT h.asesor_id 
  FROM historial_estado h 
  WHERE h.cliente_id = c.id 
    AND h.accion LIKE '%wizard%completado%'
  ORDER BY h.fecha DESC 
  LIMIT 1
)
WHERE c.wizard_completado = 1 
  AND c.asesor_asignado IS NULL
  AND c.asesor_gestor IS NULL;

-- Para los que aún tienen asesor_asignado, copiarlo
UPDATE clientes
SET asesor_gestor = asesor_asignado
WHERE wizard_completado = 1 
  AND asesor_asignado IS NOT NULL
  AND asesor_gestor IS NULL;
