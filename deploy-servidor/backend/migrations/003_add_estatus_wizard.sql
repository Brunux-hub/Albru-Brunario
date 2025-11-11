-- Migration: Añadir columna estatus_wizard a la tabla clientes
-- Agrega una columna opcional para almacenar el estatus seleccionado en el wizard (frontend)
-- Ejecutar en la BD de staging/producción después de respaldar

ALTER TABLE clientes
  ADD COLUMN estatus_wizard VARCHAR(100) NULL COMMENT 'Estatus seleccionado en el wizard por el asesor/GTR';
