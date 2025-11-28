-- ALBRU - Base de datos limpia para producción
-- Versión sin datos ficticios - Solo estructura y admin inicial
-- Fecha: 10 de octubre 2025

-- Configuración inicial
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS albru CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE albru;

-- ===============================================
-- 1. TABLA ASESORES (LIMPIA)
-- ===============================================
DROP TABLE IF EXISTS asesores;
CREATE TABLE asesores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    tipo ENUM('asesor', 'gtr', 'validador', 'supervisor') DEFAULT 'asesor',
    clientes_asignados INT DEFAULT 0,
    estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================
-- 2. TABLA CLIENTES (COMPLETA CON TODOS LOS CAMPOS)
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
    -- Campos adicionales requeridos por el frontend
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
    password_hash VARCHAR(255) NOT NULL,
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
-- 4. TABLA HISTORIAL CLIENTE (OPCIONAL)
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
-- Índices para tabla clientes
CREATE INDEX idx_clientes_estado ON clientes(estado_cliente);
CREATE INDEX idx_clientes_asesor ON clientes(asesor_asignado);
CREATE INDEX idx_clientes_lead ON clientes(lead_id);
CREATE INDEX idx_clientes_dni ON clientes(dni);
CREATE INDEX idx_clientes_fecha ON clientes(fecha_asignacion);

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
-- 7. DATOS INICIALES MÍNIMOS
-- ===============================================

-- Solo crear usuario administrador inicial
-- Password: admin123 → Hash bcrypt
INSERT INTO usuarios_sistema (
    asesor_id, 
    username, 
    password_hash, 
    role, 
    estado_acceso, 
    fecha_creacion
) VALUES (
    NULL,
    'admin',
    '$2b$10$XGKmkJlWXJmKVl5qGUVHPO3vU6M3BF5F3I3GrOzHCW3IQGGQNGbMm',
    'admin',
    'activo',
    NOW()
);

-- ===============================================
-- 8. CONFIGURACIÓN FINAL
-- ===============================================
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que todo se creó correctamente
SELECT 'Base de datos limpia creada exitosamente' as status;
SELECT 'Solo usuario admin inicial creado' as info;
SELECT COUNT(*) as total_usuarios FROM usuarios_sistema;
SELECT COUNT(*) as total_asesores FROM asesores;
SELECT COUNT(*) as total_clientes FROM clientes;
SELECT COUNT(*) as total_validaciones FROM validaciones;

-- ===============================================
-- INSTRUCCIONES DE USO:
-- ===============================================
-- 1. Esta BD está completamente limpia, solo tiene:
--    - Estructura de todas las tablas
--    - Usuario admin (admin/admin123)
--    - Índices para optimización
--
-- 2. Para usar en producción:
--    - Cambiar la contraseña del admin después del primer login
--    - Crear asesores reales desde el panel admin
--    - Los clientes se agregan automáticamente desde el sistema
--
-- 3. Tablas listas para recibir datos reales:
--    - asesores: Datos de empleados reales
--    - clientes: Leads y clientes reales del negocio  
--    - usuarios_sistema: Cuentas de acceso reales
--    - historial_cliente: Auditoría de cambios
--    - validaciones: Proceso de validación de instalaciones
-- ===============================================