-- ================================================
-- BASE DE DATOS COMPLETA ALBRU - MYSQL VERSION
-- Incluye: Estructura + Funciones + Datos Ejemplo
-- ================================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS albru;
USE albru;

-- ================================================
-- TABLAS PRINCIPALES
-- ================================================

-- Tabla de asesores/usuarios del sistema
CREATE TABLE asesores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(15),
    estado VARCHAR(20) DEFAULT 'activo',
    tipo VARCHAR(20) DEFAULT 'asesor',
    clientes_asignados INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CHECK (estado IN ('activo', 'inactivo')),
    CHECK (tipo IN ('gtr', 'asesor', 'validador'))
);

-- Tabla principal de clientes (maneja todo el flujo)
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- DATOS INICIALES (GTR)
    nombre VARCHAR(100),
    telefono VARCHAR(15),
    lead_id VARCHAR(50) UNIQUE,
    fuente_lead VARCHAR(50) DEFAULT 'whatsapp',
    
    -- ESTADO DEL FLUJO
    estado_cliente VARCHAR(20) DEFAULT 'lead_nuevo',
    
    -- ASIGNACIONES
    gtr_asignado INT,
    asesor_asignado INT,
    validador_asignado INT,
    
    -- DATOS COMPLETOS (ASESOR)
    dni VARCHAR(50) UNIQUE,
    correo_electronico VARCHAR(100),
    fecha_nacimiento DATE,
    tipo_documento VARCHAR(50),
    lugar_nacimiento VARCHAR(100),
    direccion TEXT,
    distrito VARCHAR(100),
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(10),
    numero_piso VARCHAR(10),
    
    -- SERVICIO (ASESOR)
    tipo_cliente VARCHAR(20),
    tipo_instalacion VARCHAR(50),
    plan_seleccionado VARCHAR(200),
    precio_final DECIMAL(10,2),
    metodo_pago VARCHAR(50),
    fecha_cita DATE,
    hora_cita TIME,
    
    -- OBSERVACIONES
    observaciones_asesor TEXT,
    comentario_validacion TEXT,
    
    -- EXTRAS
    coordenadas VARCHAR(100),
    score INT CHECK (score >= 0 AND score <= 100),
    numero_registro VARCHAR(50),
    numero_grabacion VARCHAR(50),
    titular_linea VARCHAR(100),
    plan_bono VARCHAR(150),
    
    -- FECHAS
    fecha_lead TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_asignacion TIMESTAMP NULL,
    fecha_datos_completos TIMESTAMP NULL,
    fecha_validacion TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- CLAVES FORÁNEAS
    FOREIGN KEY (gtr_asignado) REFERENCES asesores(id),
    FOREIGN KEY (asesor_asignado) REFERENCES asesores(id),
    FOREIGN KEY (validador_asignado) REFERENCES asesores(id),
    
    -- CONSTRAINTS
    CHECK (estado_cliente IN (
        'lead_nuevo', 'asignado', 'en_proceso', 'datos_completos', 
        'en_validacion', 'validado', 'rechazado', 'instalado'
    )),
    CHECK (tipo_cliente IN ('standard', 'premium', 'vip'))
);

-- Tabla de historial para tracking
CREATE TABLE historial_cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT,
    usuario_id INT,
    accion VARCHAR(100) NOT NULL,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20),
    comentarios TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES asesores(id)
);

-- Tabla específica para validaciones
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
    FOREIGN KEY (validador_id) REFERENCES asesores(id),
    
    CHECK (status IN ('pendiente', 'en_revision', 'validado', 'rechazado'))
);

-- ================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================
CREATE INDEX idx_clientes_lead_id ON clientes(lead_id);
CREATE INDEX idx_clientes_dni ON clientes(dni);
CREATE INDEX idx_clientes_estado ON clientes(estado_cliente);
CREATE INDEX idx_clientes_asesor ON clientes(asesor_asignado);
CREATE INDEX idx_validaciones_status ON validaciones(status);

-- ================================================
-- PROCEDIMIENTOS ALMACENADOS (EQUIVALENTE A FUNCIONES POSTGRESQL)
-- ================================================

DELIMITER //

-- GTR: Ingresar nuevo lead
CREATE PROCEDURE gtr_ingresar_lead(
    IN p_nombre VARCHAR(100),
    IN p_telefono VARCHAR(15),
    IN p_gtr_id INT,
    OUT nuevo_cliente_id INT
)
BEGIN
    DECLARE lead_id_generado VARCHAR(50);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    SET lead_id_generado = CONCAT('WSP_', DATE_FORMAT(CURDATE(), '%Y%m%d'), '_', LPAD(LAST_INSERT_ID(), 3, '0'));
    
    INSERT INTO clientes (nombre, telefono, lead_id, gtr_asignado, estado_cliente)
    VALUES (p_nombre, p_telefono, lead_id_generado, p_gtr_id, 'lead_nuevo');
    
    SET nuevo_cliente_id = LAST_INSERT_ID();
    
    INSERT INTO historial_cliente (cliente_id, usuario_id, accion, estado_nuevo, comentarios)
    VALUES (nuevo_cliente_id, p_gtr_id, 'lead_ingresado', 'lead_nuevo', 'Lead desde WhatsApp');
    
    COMMIT;
END//

-- GTR: Asignar lead a asesor
CREATE PROCEDURE gtr_asignar_asesor(
    IN p_cliente_id INT,
    IN p_asesor_id INT,
    IN p_gtr_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    UPDATE clientes 
    SET asesor_asignado = p_asesor_id,
        estado_cliente = 'asignado',
        fecha_asignacion = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_cliente_id AND estado_cliente = 'lead_nuevo';
    
    INSERT INTO historial_cliente (cliente_id, usuario_id, accion, estado_anterior, estado_nuevo, comentarios)
    VALUES (p_cliente_id, p_gtr_id, 'reasignado_asesor', 'lead_nuevo', 'asignado', 'Asignado a asesor');
    
    UPDATE asesores SET clientes_asignados = clientes_asignados + 1 WHERE id = p_asesor_id;
    
    COMMIT;
END//

-- ASESOR: Completar datos del cliente
CREATE PROCEDURE asesor_completar_datos(
    IN p_cliente_id INT,
    IN p_asesor_id INT,
    IN p_dni VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_direccion TEXT,
    IN p_distrito VARCHAR(100),
    IN p_plan VARCHAR(200),
    IN p_precio DECIMAL(10,2),
    IN p_observaciones TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    UPDATE clientes 
    SET 
        dni = p_dni,
        correo_electronico = p_email,
        direccion = p_direccion,
        distrito = p_distrito,
        plan_seleccionado = p_plan,
        precio_final = p_precio,
        observaciones_asesor = p_observaciones,
        estado_cliente = 'datos_completos',
        fecha_datos_completos = CURRENT_TIMESTAMP
    WHERE id = p_cliente_id AND asesor_asignado = p_asesor_id;
    
    INSERT INTO historial_cliente (cliente_id, usuario_id, accion, estado_nuevo, comentarios)
    VALUES (p_cliente_id, p_asesor_id, 'datos_completados', 'datos_completos', 'Datos completados por asesor');
    
    COMMIT;
END//

-- VALIDACIONES: Aprobar cliente
CREATE PROCEDURE validar_aprobar(
    IN p_cliente_id INT,
    IN p_validador_id INT,
    IN p_comentario TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    UPDATE clientes 
    SET estado_cliente = 'validado',
        validador_asignado = p_validador_id,
        fecha_validacion = CURRENT_TIMESTAMP,
        comentario_validacion = p_comentario
    WHERE id = p_cliente_id;
    
    INSERT INTO validaciones (cliente_id, validador_id, status, resultado, comentario_validador)
    VALUES (p_cliente_id, p_validador_id, 'validado', 'aprobado', p_comentario);
    
    INSERT INTO historial_cliente (cliente_id, usuario_id, accion, estado_nuevo, comentarios)
    VALUES (p_cliente_id, p_validador_id, 'validacion_aprobada', 'validado', p_comentario);
    
    COMMIT;
END//

DELIMITER ;

-- ================================================
-- DATOS DE EJEMPLO
-- ================================================

-- Insertar asesores
INSERT INTO asesores (nombre, email, tipo) VALUES
('GTR Sistema', 'gtr@albru.com', 'gtr'),
('JUAN', 'juan.garcia@albru.com', 'asesor'),
('Luis López', 'luis.lopez@albru.com', 'asesor'),
('Carmen Torres', 'carmen.torres@albru.com', 'asesor'),
('Validador Calidad', 'validaciones@albru.com', 'validador');

-- Ejemplo de clientes para testing
INSERT INTO clientes (nombre, telefono, dni, asesor_asignado, estado_cliente, plan_seleccionado, precio_final) VALUES
('María González', '+51987654321', '87654321', 2, 'asignado', 'Plan Premium 500MB', 899.00),
('Carlos Ruiz', '+51912345678', '12345678', 2, 'datos_completos', 'Plan Básico 200MB', 599.00),
('Ana Torres', '+51956789123', '45678912', 2, 'asignado', 'Plan Ultra 1GB', 1299.00);

-- ================================================
-- VISTAS ÚTILES PARA CONSULTAS RÁPIDAS
-- ================================================

-- Vista para ver clientes con información del asesor
CREATE VIEW vista_clientes_completa AS
SELECT 
    c.id,
    c.nombre,
    c.telefono,
    c.dni,
    c.correo_electronico,
    c.direccion,
    c.distrito,
    c.plan_seleccionado,
    c.precio_final,
    c.estado_cliente,
    c.observaciones_asesor,
    c.fecha_asignacion,
    c.fecha_cita,
    a.nombre as asesor_nombre,
    a.id as asesor_id
FROM clientes c
LEFT JOIN asesores a ON c.asesor_asignado = a.id;

-- Vista para clientes listos para validar
CREATE VIEW vista_para_validar AS
SELECT 
    c.id,
    c.dni,
    c.nombre,
    c.telefono,
    c.estado_cliente,
    a.nombre as asesor_nombre,
    c.fecha_datos_completos
FROM clientes c
LEFT JOIN asesores a ON c.asesor_asignado = a.id
WHERE c.estado_cliente = 'datos_completos'
ORDER BY c.fecha_datos_completos ASC;

-- ================================================
-- CONSULTAS ÚTILES PARA LA APLICACIÓN
-- ================================================

-- Ver todos los clientes con su asesor actual
-- SELECT * FROM vista_clientes_completa ORDER BY fecha_asignacion DESC;

-- Buscar cliente por DNI
-- SELECT * FROM vista_clientes_completa WHERE dni = '12345678';

-- Ver clientes asignados a JUAN
-- SELECT * FROM vista_clientes_completa WHERE asesor_nombre = 'JUAN';

-- Ver historial de un cliente
-- SELECT h.*, a.nombre as usuario FROM historial_cliente h 
-- LEFT JOIN asesores a ON h.usuario_id = a.id 
-- WHERE cliente_id = 1 ORDER BY fecha DESC;

GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY 'tu_contraseña' WITH GRANT OPTION;
FLUSH PRIVILEGES;