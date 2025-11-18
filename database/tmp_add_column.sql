ALTER TABLE clientes ADD COLUMN IF NOT EXISTS asesor_asignado INT NULL;
ALTER TABLE clientes ADD INDEX IF NOT EXISTS idx_asesor_asignado (asesor_asignado);
