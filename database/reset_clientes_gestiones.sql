-- Resetear clientes a estado inicial
UPDATE clientes SET
  asesor_asignado = NULL,
  estatus_wizard = NULL,
  seguimiento_status = NULL,
  estatus_comercial_categoria = NULL,
  estatus_comercial_subcategoria = NULL,
  quality_status = NULL,
  fecha_ultimo_contacto = NULL,
  derivado_at = NULL,
  opened_at = NULL,
  returned_at = NULL,
  last_activity = NULL,
  notas = NULL,
  comentarios_back = NULL,
  wizard_completado = 0,
  fecha_wizard_completado = NULL,
  wizard_data_json = NULL,
  ultima_fecha_gestion = NULL;

-- Limpiar historial de estados (si la tabla existe)
DELETE FROM historial_estados WHERE 1=1;

-- Limpiar bloqueos de clientes (si la tabla existe)
DELETE FROM cliente_locks WHERE 1=1;
