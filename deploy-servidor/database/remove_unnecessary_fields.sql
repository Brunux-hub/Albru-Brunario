-- Script para eliminar campos innecesarios de la tabla clientes
-- 16 de octubre de 2025

USE albru;

-- 1. Eliminar campos financieros detallados
ALTER TABLE clientes DROP COLUMN ingresos_adicionales;
ALTER TABLE clientes DROP COLUMN gastos_mensuales;
ALTER TABLE clientes DROP COLUMN banco_principal;
ALTER TABLE clientes DROP COLUMN tipo_cuenta;

-- 2. Eliminar campos de ubicación específicos
ALTER TABLE clientes DROP COLUMN codigo_postal;
ALTER TABLE clientes DROP COLUMN departamento;

-- 3. Eliminar campos de seguros detallados
ALTER TABLE clientes DROP COLUMN tiene_seguros_actuales;
ALTER TABLE clientes DROP COLUMN seguros_actuales;
ALTER TABLE clientes DROP COLUMN monto_asegurado_deseado;
ALTER TABLE clientes DROP COLUMN tipo_seguro_interes;

-- 4. Eliminar campo redundante de contacto
ALTER TABLE clientes DROP COLUMN telefono_alternativo;

-- 5. Eliminar campo de ubicación de nacimiento
ALTER TABLE clientes DROP COLUMN lugar_nacimiento;

-- Verificar estructura final
DESCRIBE clientes;