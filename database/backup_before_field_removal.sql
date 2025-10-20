-- Backup de los campos que se van a eliminar - 16 de octubre de 2025
-- Ejecutar ANTES de eliminar los campos para hacer respaldo

-- Crear tabla temporal con los datos que se van a eliminar
CREATE TABLE clientes_backup_campos_eliminados AS
SELECT 
    id,
    ingresos_adicionales,
    gastos_mensuales,
    banco_principal,
    tipo_cuenta,
    codigo_postal,
    departamento,
    tiene_seguros_actuales,
    seguros_actuales,
    monto_asegurado_deseado,
    tipo_seguro_interes,
    telefono_alternativo,
    lugar_nacimiento
FROM clientes;

-- Para restaurar los campos (si fuera necesario):
/*
ALTER TABLE clientes 
ADD COLUMN ingresos_adicionales decimal(10,2) AFTER ingresos_mensuales,
ADD COLUMN gastos_mensuales decimal(10,2) AFTER ingresos_adicionales,
ADD COLUMN banco_principal varchar(50) AFTER seguros_actuales,
ADD COLUMN tipo_cuenta enum('ahorros','corriente','nomina') AFTER banco_principal,
ADD COLUMN codigo_postal varchar(10) AFTER ciudad,
ADD COLUMN departamento varchar(50) AFTER ciudad,
ADD COLUMN tiene_seguros_actuales tinyint(1) DEFAULT 0 AFTER monto_asegurado_deseado,
ADD COLUMN seguros_actuales text AFTER tiene_seguros_actuales,
ADD COLUMN monto_asegurado_deseado decimal(12,2) AFTER tipo_seguro_interes,
ADD COLUMN tipo_seguro_interes enum('vida','salud','vehicular','hogar','empresarial') AFTER telefono_alternativo,
ADD COLUMN telefono_alternativo varchar(20) AFTER codigo_postal,
ADD COLUMN lugar_nacimiento varchar(100) AFTER fecha_nacimiento;
*/