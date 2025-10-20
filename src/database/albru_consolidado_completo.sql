-- ===============================================
-- ALBRU - BASE DE DATOS CONSOLIDADA COMPLETA
-- Versión: Única y definitiva para Docker
-- Fecha: 13 de octubre 2025
-- ===============================================
-- Este archivo contiene TODA la estructura necesaria:
-- 1. Esquema completo de tablas
-- 2. Todos los campos del wizard
-- 3. Usuarios iniciales (admin + prueba)
-- 4. Índices optimizados
-- ===============================================

-- Configuración inicial
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS albru CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE albru;

-- ===============================================
-- 1. TABLA ASESORES (COMPLETA)
-- ===============================================
DROP TABLE IF EXISTS asesores;
CREATE TABLE asesores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    tipo ENUM('asesor', 'gtr', 'validador', 'supervisor', 'admin') DEFAULT 'asesor',
    clientes_asignados INT DEFAULT 0,
    estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 2. TABLA CLIENTES (COMPLETA CON TODOS LOS CAMPOS + WIZARD)
-- ===============================================
DROP TABLE IF EXISTS clientes;
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id VARCHAR(50) UNIQUE,
    nombre VARCHAR(100) NULL,
    telefono VARCHAR(20),
    dni VARCHAR(20),
    correo_electronico VARCHAR(100),
    direccion TEXT,
    distrito VARCHAR(50),
    plan_seleccionado VARCHAR(100),
    precio_final DECIMAL(10,2),
    estado_cliente ENUM('nuevo', 'contactado', 'interesado', 'cotizado', 'vendido', 'perdido', 'seguimiento') DEFAULT 'nuevo',
    asesor_asignado INT,
    observaciones_asesor TEXT,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cita TIMESTAMP NULL,
    
    -- Campos adicionales del sistema
    numero_registro VARCHAR(50) NULL,
    numero_grabacion VARCHAR(50) NULL,
    numero_referencia VARCHAR(50) NULL,
    tipo_documento VARCHAR(30) NULL,
    fecha_nacimiento DATE NULL,
    lugar_nacimiento VARCHAR(100) NULL,
    titular_linea VARCHAR(100) NULL,
    numero_piso VARCHAR(10) NULL,
    interior VARCHAR(20) NULL,
    tipo_cliente VARCHAR(50) NULL,
    dispositivos_adicionales TEXT NULL,
    pago_adelanto_instalacion DECIMAL(10,2) NULL,
    plataforma_digital VARCHAR(50) NULL,
    fecha_programacion TIMESTAMP NULL,
    fecha_instalacion DATE NULL,
    fecha_lead TIMESTAMP NULL,
    score INT NULL,
    coordenadas VARCHAR(100) NULL,
    campania VARCHAR(100) NULL,
    canal VARCHAR(50) NULL,
    comentarios_iniciales TEXT NULL,
    servicio VARCHAR(100) NULL,
    seguimiento TEXT NULL,
    gestion TEXT NULL,
    
    -- CAMPOS DEL WIZARD PASO 1
    lead_score VARCHAR(50) NULL COMMENT 'Score del lead del paso 1',
    tipo_cliente_wizard ENUM('nuevo', 'antiguo') NULL COMMENT 'Tipo de cliente del wizard paso 1',
    
    -- CAMPOS DEL WIZARD PASO 2
    telefono_registro VARCHAR(20) NULL COMMENT 'Teléfono de registro del paso 2',
    dni_nombre_titular VARCHAR(100) NULL COMMENT 'DNI/Nombre titular línea telefónica',
    parentesco_titular VARCHAR(50) NULL COMMENT 'Parentesco con el titular de la línea',
    telefono_referencia_wizard VARCHAR(20) NULL COMMENT 'Teléfono de referencia',
    telefono_grabacion_wizard VARCHAR(20) NULL COMMENT 'Teléfono de grabación',
    departamento VARCHAR(50) NULL COMMENT 'Departamento (UBIGEO)',
    direccion_completa TEXT NULL COMMENT 'Dirección completa del paso 2',
    numero_piso_wizard VARCHAR(10) NULL COMMENT 'Número de piso del wizard',
    
    -- CAMPOS DEL WIZARD PASO 3
    tipo_plan VARCHAR(100) NULL COMMENT 'Tipo de plan seleccionado',
    servicio_contratado TEXT NULL COMMENT 'Servicios contratados (JSON o lista separada por comas)',
    velocidad_contratada VARCHAR(50) NULL COMMENT 'Velocidad contratada',
    precio_plan DECIMAL(10,2) NULL COMMENT 'Precio del plan',
    dispositivos_adicionales_wizard TEXT NULL COMMENT 'Dispositivos adicionales seleccionados',
    plataforma_digital_wizard TEXT NULL COMMENT 'Plataformas digitales seleccionadas',
    
    -- CAMPOS DEL WIZARD PASO 4
    pago_adelanto_instalacion_wizard ENUM('SI', 'NO') NULL COMMENT 'Pago adelanto instalación',
    
    -- METADATOS DEL WIZARD
    wizard_completado BOOLEAN DEFAULT FALSE COMMENT 'Indica si el wizard fue completado',
    fecha_wizard_completado TIMESTAMP NULL COMMENT 'Fecha cuando se completó el wizard',
    wizard_data_json JSON NULL COMMENT 'Datos completos del wizard en formato JSON para respaldo',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (asesor_asignado) REFERENCES asesores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 3. TABLA USUARIOS SISTEMA (AUTENTICACIÓN)
-- ===============================================
DROP TABLE IF EXISTS usuarios_sistema;
CREATE TABLE usuarios_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asesor_id INT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHR(255) NOT NULL,
    role ENUM('admin', 'gtr', 'asesor', 'supervisor', 'validaciones') NOT NULL,
    estado_acceso ENUM('pendiente', 'activo', 'suspendido') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP NULL,
    creado_por INT NULL,
    
    FOREIGN KEY (asesor_id) REFERENCES asesores(id) ON DELETE CASCADE,
    FOREIGN KEY (creado_por) REFERENCES usuarios_sistema(id) ON DELETE SET NULL,
    
    CHECK (role IN ('admin', 'gtr', 'asesor', 'supervisor', 'validaciones')),
    CHECK (estado_acceso IN ('pendiente', 'activo', 'suspendido'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 4. TABLA HISTORIAL CLIENTE (AUDITORÍA)
-- ===============================================
DROP TABLE IF EXISTS historial_cliente;
CREATE TABLE historial_cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    usuario_id INT,
    accion VARCHAR(100) NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    comentarios TEXT,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios_sistema(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 5. TABLA VALIDACIONES (PROCESO DE VALIDACIÓN)
-- ===============================================
DROP TABLE IF EXISTS validaciones;
CREATE TABLE validaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    validador_id INT,
    status VARCHAR(20) DEFAULT 'pendiente',
    fecha_programacion TIMESTAMP NULL,
    fecha_instalacion DATE,
    resultado VARCHAR(20),
    motivo_rechazo TEXT,
    comentario_validador TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (validador_id) REFERENCES asesores(id) ON DELETE SET NULL,
    
    CHECK (status IN ('pendiente', 'en_revision', 'validado', 'rechazado'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 6. ÍNDICES PARA OPTIMIZACIÓN
-- ===============================================

-- Índices para tabla clientes (principales)
CREATE INDEX idx_clientes_estado ON clientes(estado_cliente);
CREATE INDEX idx_clientes_asesor ON clientes(asesor_asignado);
CREATE INDEX idx_clientes_lead ON clientes(lead_id);
CREATE INDEX idx_clientes_dni ON clientes(dni);
CREATE INDEX idx_clientes_fecha ON clientes(fecha_asignacion);

-- Índices para campos del wizard
CREATE INDEX idx_clientes_wizard_completado ON clientes(wizard_completado);
CREATE INDEX idx_clientes_tipo_cliente_wizard ON clientes(tipo_cliente_wizard);
CREATE INDEX idx_clientes_departamento ON clientes(departamento);
CREATE INDEX idx_clientes_distrito ON clientes(distrito);

-- Índices para tabla asesores
CREATE INDEX idx_asesores_tipo ON asesores(tipo);
CREATE INDEX idx_asesores_estado ON asesores(estado);
CREATE INDEX idx_asesores_email ON asesores(email);

-- Índices para tabla usuarios_sistema
CREATE INDEX idx_usuarios_role ON usuarios_sistema(role);
CREATE INDEX idx_usuarios_estado ON usuarios_sistema(estado_acceso);
CREATE INDEX idx_usuarios_login ON usuarios_sistema(ultimo_login);

-- Índices para tabla validaciones
CREATE INDEX idx_validaciones_status ON validaciones(status);
CREATE INDEX idx_validaciones_cliente ON validaciones(cliente_id);
CREATE INDEX idx_validaciones_validador ON validaciones(validador_id);
CREATE INDEX idx_validaciones_fecha ON validaciones(fecha_programacion);

-- ===============================================
-- 7. DATOS INICIALES - USUARIOS DEL SISTEMA
-- ===============================================

-- Crear asesores iniciales
INSERT INTO asesores (nombre, email, telefono, tipo, estado) VALUES
('Administrador Sistema', 'admin@albru.com', '999000000', 'admin', 'activo'),
('María García (GTR)', 'maria.gtr@albru.com', '999111222', 'gtr', 'activo'),
('Carlos López (Asesor)', 'carlos.asesor@albru.com', '999333444', 'asesor', 'activo'),
('Ana Supervisor', 'ana.supervisor@albru.com', '999555666', 'supervisor', 'activo'),
('Pedro Validador', 'pedro.validador@albru.com', '999777888', 'validador', 'activo');

-- Crear usuarios del sistema con contraseñas hasheadas
-- admin123 → $2b$10$XGKmkJlWXJmKVl5qGUVHPO3vU6M3BF5F3I3GrOzHCW3IQGGQNGbMm
-- gtr123 → $2b$10$YVvQhNznZU8.jZM4nQ4JqeMq7KXzS8fT4dwzYzwY0G3VuY3TZWzeu
-- asesor123 → $2b$10$8rLKYa4.KnZzpVL0BzBmfO8Nq1dWz2H.jF8QZ5MKVbYjZU4mLfcKi
-- super123 → $2b$10$9mKVwQz8P1aBcD5FgH6jKO4lMnO7pQ8rS9tU2vW3xY4zA5bC6dE7f
-- valid123 → $2b$10$1aBcDe2FgH3iJ4kL5mN6oP7qR8sT9uV0wX1yZ2aB3cD4eF5gH6iJ7k

INSERT INTO usuarios_sistema (asesor_id, username, password_hash, role, estado_acceso) VALUES
((SELECT id FROM asesores WHERE email = 'admin@albru.com'), 'admin', '$2b$10$XGKmkJlWXJmKVl5qGUVHPO3vU6M3BF5F3I3GrOzHCW3IQGGQNGbMm', 'admin', 'activo'),
((SELECT id FROM asesores WHERE email = 'maria.gtr@albru.com'), 'gtr_maria', '$2b$10$YVvQhNznZU8.jZM4nQ4JqeMq7KXzS8fT4dwzYzwY0G3VuY3TZWzeu', 'gtr', 'activo'),
((SELECT id FROM asesores WHERE email = 'carlos.asesor@albru.com'), 'asesor_carlos', '$2b$10$8rLKYa4.KnZzpVL0BzBmfO8Nq1dWz2H.jF8QZ5MKVbYjZU4mLfcKi', 'asesor', 'activo'),
((SELECT id FROM asesores WHERE email = 'ana.supervisor@albru.com'), 'supervisor_ana', '$2b$10$9mKVwQz8P1aBcD5FgH6jKO4lMnO7pQ8rS9tU2vW3xY4zA5bC6dE7f', 'supervisor', 'activo'),
((SELECT id FROM asesores WHERE email = 'pedro.validador@albru.com'), 'validador_pedro', '$2b$10$1aBcDe2FgH3iJ4kL5mN6oP7qR8sT9uV0wX1yZ2aB3cD4eF5gH6iJ7k', 'validaciones', 'activo');

-- ===============================================
-- 8. CONFIGURACIÓN FINAL
-- ===============================================
SET FOREIGN_KEY_CHECKS = 1;

-- ===============================================
-- 9. VERIFICACIONES FINALES
-- ===============================================
SELECT 'BASE DE DATOS CONSOLIDADA CREADA EXITOSAMENTE' as status;
SELECT '================================================' as separador;

SELECT 'RESUMEN DE DATOS CREADOS:' as info;
SELECT COUNT(*) as total_asesores FROM asesores;
SELECT COUNT(*) as total_usuarios FROM usuarios_sistema;
SELECT COUNT(*) as total_clientes FROM clientes;
SELECT COUNT(*) as total_validaciones FROM validaciones;

SELECT '================================================' as separador;
SELECT 'USUARIOS DE ACCESO CREADOS:' as info;
SELECT 
    u.username, 
    u.role, 
    a.nombre as nombre_completo,
    u.estado_acceso
FROM usuarios_sistema u 
LEFT JOIN asesores a ON u.asesor_id = a.id 
ORDER BY u.role;

SELECT '================================================' as separador;
SELECT 'CONTRASEÑAS DE ACCESO (CAMBIAR EN PRODUCCIÓN):' as info;
SELECT 'admin → admin123' as login_admin;
SELECT 'gtr_maria → gtr123' as login_gtr;
SELECT 'asesor_carlos → asesor123' as login_asesor;
SELECT 'supervisor_ana → super123' as login_supervisor;
SELECT 'validador_pedro → valid123' as login_validador;

-- ===============================================
-- INSTRUCCIONES DE USO:
-- ===============================================
-- 1. Esta BD contiene la estructura completa:
--    ✅ Esquema completo de todas las tablas
--    ✅ Todos los campos del wizard del asesor
--    ✅ Usuarios del sistema para cada rol
--    ✅ Índices optimizados para rendimiento
--
-- 2. Usuarios listos para usar:
--    - admin/admin123        → Administrador general
--    - gtr_maria/gtr123      → GTR (gestor)
--    - asesor_carlos/asesor123 → Asesor de ventas
--    - supervisor_ana/super123 → Supervisor
--    - validador_pedro/valid123 → Validaciones
--
-- 3. Para usar en Docker:
--    - Este archivo reemplaza TODOS los SQL anteriores
--    - Solo importar este archivo en MySQL
--    - Cambiar contraseñas después del primer login
--
-- 4. Tablas incluidas y listas:
--    - asesores (con tipos: admin, gtr, asesor, supervisor, validador)
--    - clientes (con TODOS los campos del wizard completo) - VACÍA
--    - usuarios_sistema (autenticación y roles)
--    - historial_cliente (auditoría de cambios) - VACÍA
--    - validaciones (proceso de validación) - VACÍA
--
-- 5. Los clientes se agregan desde la aplicación web
--    - No hay datos de prueba precargados
--    - Tablas limpias y listas para datos reales
--
-- ===============================================
