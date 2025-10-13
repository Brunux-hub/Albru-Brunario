-- Script para crear usuarios de prueba GTR y Asesor
-- Ejecutar en Adminer o línea de comandos MySQL

USE albru;

-- 1. Crear asesores de prueba
INSERT INTO asesores (nombre, email, telefono, tipo, estado) VALUES
('María García', 'maria.gtr@empresa.com', '999111222', 'gtr', 'activo'),
('Carlos López', 'carlos.asesor@empresa.com', '999333444', 'asesor', 'activo');

-- 2. Crear usuarios del sistema
-- Contraseñas: gtr123 y asesor123 (hasheadas con bcrypt)
INSERT INTO usuarios_sistema (asesor_id, username, password_hash, role, estado_acceso) VALUES
((SELECT id FROM asesores WHERE email = 'maria.gtr@empresa.com'), 'gtr_maria', '$2b$10$YVvQhNznZU8.jZM4nQ4JqeMq7KXzS8fT4dwzYzwY0G3VuY3TZWzeu', 'gtr', 'activo'),
((SELECT id FROM asesores WHERE email = 'carlos.asesor@empresa.com'), 'asesor_carlos', '$2b$10$8rLKYa4.KnZzpVL0BzBmfO8Nq1dWz2H.jF8QZ5MKVbYjZU4mLfcKi', 'asesor', 'activo');

-- 3. Crear algunos clientes de prueba para asignar
INSERT INTO clientes (nombre, telefono, dni, direccion, plan_seleccionado, precio_final, estado_cliente, asesor_asignado) VALUES
('Juan Pérez', '987654321', '12345678', 'Av. Lima 123', 'Internet 100MB', 79.90, 'nuevo', (SELECT id FROM asesores WHERE email = 'carlos.asesor@empresa.com')),
('Ana Silva', '976543210', '87654321', 'Jr. Ayacucho 456', 'Internet 200MB', 129.90, 'contactado', (SELECT id FROM asesores WHERE email = 'carlos.asesor@empresa.com'));

-- 4. Verificar que todo se creó correctamente
SELECT 'Asesores creados:' as info;
SELECT id, nombre, email, tipo FROM asesores WHERE email IN ('maria.gtr@empresa.com', 'carlos.asesor@empresa.com');

SELECT 'Usuarios del sistema creados:' as info;
SELECT u.id, u.username, u.role, a.nombre as asesor_nombre 
FROM usuarios_sistema u 
LEFT JOIN asesores a ON u.asesor_id = a.id 
WHERE u.username IN ('gtr_maria', 'asesor_carlos');

SELECT 'Clientes asignados:' as info;
SELECT c.id, c.nombre, a.nombre as asesor_asignado
FROM clientes c
LEFT JOIN asesores a ON c.asesor_asignado = a.id
WHERE c.nombre IN ('Juan Pérez', 'Ana Silva');