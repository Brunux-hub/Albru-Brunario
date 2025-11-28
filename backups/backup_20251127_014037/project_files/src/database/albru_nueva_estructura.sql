-- =====================================================
-- ALBRU - NUEVA ESTRUCTURA DE BASE DE DATOS SEPARADA
-- =====================================================

DROP DATABASE IF EXISTS albru;
CREATE DATABASE albru CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE albru;

-- =====================================================
-- 1. TABLA USUARIOS (Tabla principal para todos)
-- =====================================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    tipo ENUM('admin', 'gtr', 'asesor', 'supervisor', 'validador') NOT NULL,
    estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_estado (estado),
    INDEX idx_email (email)
);

-- =====================================================
-- 2. TABLA ADMINISTRADORES (Solo administradores)
-- =====================================================
CREATE TABLE administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    permisos_especiales JSON,
    nivel_acceso ENUM('super_admin', 'admin', 'admin_limitado') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_nivel_acceso (nivel_acceso)
);

-- =====================================================
-- 3. TABLA GTR (Gestores de Trabajo Remoto)
-- =====================================================
CREATE TABLE gtr (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    asesores_a_cargo INT DEFAULT 0,
    region VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_region (region)
);

-- =====================================================
-- 4. TABLA ASESORES (Solo asesores de ventas)
-- =====================================================
CREATE TABLE asesores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    gtr_asignado INT,
    clientes_asignados INT DEFAULT 0,
    meta_mensual DECIMAL(10,2) DEFAULT 0.00,
    ventas_realizadas DECIMAL(10,2) DEFAULT 0.00,
    comision_porcentaje DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (gtr_asignado) REFERENCES gtr(id) ON DELETE SET NULL,
    INDEX idx_gtr_asignado (gtr_asignado),
    INDEX idx_clientes_asignados (clientes_asignados)
);

-- =====================================================
-- 5. TABLA SUPERVISORES 
-- =====================================================
CREATE TABLE supervisores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    area_supervision VARCHAR(100),
    asesores_supervisados INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_area (area_supervision)
);

-- =====================================================
-- 6. TABLA VALIDADORES
-- =====================================================
CREATE TABLE validadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo_validacion ENUM('calidad', 'documentos', 'ventas', 'general') DEFAULT 'general',
    validaciones_realizadas INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_tipo_validacion (tipo_validacion)
);

-- =====================================================
-- 7. TABLA CLIENTES (Con campos del wizard)
-- =====================================================
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Información básica
    nombre VARCHAR(100),
    apellidos VARCHAR(100),
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    dni VARCHAR(20),
    
    -- Campos del wizard del asesor
    edad INT,
    genero ENUM('masculino', 'femenino', 'otro'),
    estado_civil ENUM('soltero', 'casado', 'divorciado', 'viudo', 'union_libre'),
    ocupacion VARCHAR(100),
    ingresos_mensuales DECIMAL(10,2),
    dependientes_economicos INT DEFAULT 0,
    
    -- Información de contacto adicional
    direccion TEXT,
    ciudad VARCHAR(50),
    departamento VARCHAR(50),
    codigo_postal VARCHAR(10),
    telefono_alternativo VARCHAR(20),
    
    -- Información del seguro
    tipo_seguro_interes ENUM('vida', 'salud', 'vehicular', 'hogar', 'empresarial'),
    monto_asegurado_deseado DECIMAL(12,2),
    tiene_seguros_actuales BOOLEAN DEFAULT FALSE,
    seguros_actuales TEXT,
    
    -- Información financiera
    banco_principal VARCHAR(50),
    tipo_cuenta ENUM('ahorros', 'corriente', 'nomina'),
    ingresos_adicionales DECIMAL(10,2),
    gastos_mensuales DECIMAL(10,2),
    
    -- Preferencias de contacto
    horario_preferido_contacto VARCHAR(50),
    medio_contacto_preferido ENUM('telefono', 'whatsapp', 'email', 'presencial'),
    
    -- Estados y asignaciones
    asesor_asignado INT,
    estado ENUM('nuevo', 'contactado', 'interesado', 'propuesta_enviada', 'cerrado', 'perdido') DEFAULT 'nuevo',
    prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
    
    -- Fechas importantes
    fecha_primer_contacto DATETIME,
    fecha_ultimo_contacto DATETIME,
    fecha_cierre_estimada DATE,
    
    -- Notas y observaciones
    notas TEXT,
    observaciones_asesor TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_telefono (telefono),
    INDEX idx_asesor_asignado (asesor_asignado),
    INDEX idx_estado (estado),
    INDEX idx_prioridad (prioridad),
    INDEX idx_tipo_seguro (tipo_seguro_interes),
    INDEX idx_created_at (created_at),
    
    -- Foreign Key
    FOREIGN KEY (asesor_asignado) REFERENCES asesores(id) ON DELETE SET NULL
);

-- =====================================================
-- 8. TABLA HISTORIAL_CLIENTE
-- =====================================================
CREATE TABLE historial_cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    usuario_id INT NOT NULL,
    accion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- 9. TABLA VALIDACIONES
-- =====================================================
CREATE TABLE validaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    validador_id INT NOT NULL,
    tipo_validacion ENUM('calidad', 'documentos', 'ventas', 'general') NOT NULL,
    estado ENUM('pendiente', 'aprobado', 'rechazado', 'revision') DEFAULT 'pendiente',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (validador_id) REFERENCES validadores(id) ON DELETE CASCADE,
    INDEX idx_cliente_id (cliente_id),
    INDEX idx_validador_id (validador_id),
    INDEX idx_estado (estado),
    INDEX idx_tipo (tipo_validacion)
);

-- =====================================================
-- INSERTAR USUARIOS BASE DEL SISTEMA
-- =====================================================

-- 1. Insertar usuarios principales
INSERT INTO usuarios (nombre, email, password, telefono, tipo, estado) VALUES
('Administrador Sistema', 'admin@albru.com', '$2b$10$rZ8qNqZ7YE.L8p9QCJ1lw.xGH2UJ8DjL0m1xP3oA9Qk1vM8yL5cD2', '+51999888777', 'admin', 'activo'),
('María García', 'maria.gtr@albru.com', '$2b$10$rZ8qNqZ7YE.L8p9QCJ1lw.xGH2UJ8DjL0m1xP3oA9Qk1vM8yL5cD2', '+51999888778', 'gtr', 'activo'),
('Carlos López', 'carlos.asesor@albru.com', '$2b$10$rZ8qNqZ7YE.L8p9QCJ1lw.xGH2UJ8DjL0m1xP3oA9Qk1vM8yL5cD2', '+51999888779', 'asesor', 'activo'),
('Ana Supervisor', 'ana.supervisor@albru.com', '$2b$10$rZ8qNqZ7YE.L8p9QCJ1lw.xGH2UJ8DjL0m1xP3oA9Qk1vM8yL5cD2', '+51999888780', 'supervisor', 'activo'),
('Pedro Validador', 'pedro.validador@albru.com', '$2b$10$rZ8qNqZ7YE.L8p9QCJ1lw.xGH2UJ8DjL0m1xP3oA9Qk1vM8yL5cD2', '+51999888781', 'validador', 'activo');

-- 2. Insertar en tabla administradores
INSERT INTO administradores (usuario_id, permisos_especiales, nivel_acceso) VALUES
(1, '{"full_access": true, "user_management": true, "system_config": true}', 'super_admin');

-- 3. Insertar en tabla GTR
INSERT INTO gtr (usuario_id, asesores_a_cargo, region) VALUES
(2, 1, 'Lima');

-- 4. Insertar en tabla asesores
INSERT INTO asesores (usuario_id, gtr_asignado, clientes_asignados, meta_mensual, comision_porcentaje) VALUES
(3, 1, 0, 50000.00, 5.00);

-- 5. Insertar en tabla supervisores
INSERT INTO supervisores (usuario_id, area_supervision, asesores_supervisados) VALUES
(4, 'Ventas', 0);

-- 6. Insertar en tabla validadores
INSERT INTO validadores (usuario_id, tipo_validacion, validaciones_realizadas) VALUES
(5, 'calidad', 0);

-- =====================================================
-- USUARIOS DE ACCESO AL SISTEMA (Login)
-- =====================================================
CREATE TABLE usuarios_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    usuario_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_username (username),
    INDEX idx_activo (activo)
);

-- Insertar usuarios de sistema para login
INSERT INTO usuarios_sistema (username, password, usuario_id, activo) VALUES
('admin', '$2b$10$rZ8qNqZ7YE.L8p9QCJ1lw.xGH2UJ8DjL0m1xP3oA9Qk1vM8yL5cD2', 1, TRUE),
('gtr_maria', '$2b$10$rZ8qNqZ7YE.L8p9QCJ1lw.xGH2UJ8DjL0m1xP3oA9Qk1vM8yL5cD2', 2, TRUE),
('asesor_carlos', '$2b$10$rZ8qNqZ7YE.L8p9QCJ1lw.xGH2UJ8DjL0m1xP3oA9Qk1vM8yL5cD2', 3, TRUE),
('supervisor_ana', '$2b$10$rZ8qNqZ7YE.L8p9QCJ1lw.xGH2UJ8DjL0m1xP3oA9Qk1vM8yL5cD2', 4, TRUE),
('validador_pedro', '$2b$10$rZ8qNqZ7YE.L8p9QCJ1lw.xGH2UJ8DjL0m1xP3oA9Qk1vM8yL5cD2', 5, TRUE);

-- =====================================================
-- VISTAS PARA FACILITAR CONSULTAS
-- =====================================================

-- Vista de usuarios completos con rol específico
CREATE VIEW vista_usuarios_completos AS
SELECT 
    u.id,
    u.nombre,
    u.email,
    u.telefono,
    u.tipo,
    u.estado,
    u.created_at,
    CASE 
        WHEN u.tipo = 'admin' THEN a.nivel_acceso
        WHEN u.tipo = 'gtr' THEN g.region
        WHEN u.tipo = 'asesor' THEN CONCAT('Meta: ', ases.meta_mensual)
        WHEN u.tipo = 'supervisor' THEN s.area_supervision
        WHEN u.tipo = 'validador' THEN v.tipo_validacion
        ELSE NULL
    END as detalle_rol
FROM usuarios u
LEFT JOIN administradores a ON u.id = a.usuario_id
LEFT JOIN gtr g ON u.id = g.usuario_id  
LEFT JOIN asesores ases ON u.id = ases.usuario_id
LEFT JOIN supervisores s ON u.id = s.usuario_id
LEFT JOIN validadores v ON u.id = v.usuario_id;

-- Vista solo de asesores con información completa
CREATE VIEW vista_asesores_completos AS
SELECT 
    a.id as asesor_id,
    u.id as usuario_id,
    u.nombre,
    u.email,
    u.telefono,
    u.estado,
    a.clientes_asignados,
    a.meta_mensual,
    a.ventas_realizadas,
    a.comision_porcentaje,
    g.nombre as gtr_nombre
FROM asesores a
JOIN usuarios u ON a.usuario_id = u.id
LEFT JOIN gtr gt ON a.gtr_asignado = gt.id
LEFT JOIN usuarios g ON gt.usuario_id = g.id
WHERE u.estado = 'activo';

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================
-- Esta estructura separa claramente:
-- 1. usuarios: Tabla principal con información básica
-- 2. administradores: Solo administradores del sistema
-- 3. gtr: Solo gestores de trabajo remoto  
-- 4. asesores: Solo asesores de ventas
-- 5. supervisores: Solo supervisores
-- 6. validadores: Solo validadores
-- 7. usuarios_sistema: Para login y autenticación
-- 
-- Cada tabla especializada tiene foreign key a usuarios
-- y campos específicos para ese rol.