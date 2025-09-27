-- ================================================
-- PRUEBA DE BASE DE DATOS ALBRU (SIN CREATE DATABASE)
-- ================================================

-- Crear extensiones si no existen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABLAS PRINCIPALES
-- ================================================

-- Limpiar tablas existentes si existen
DROP TABLE IF EXISTS validaciones CASCADE;
DROP TABLE IF EXISTS historial_cliente CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS asesores CASCADE;

-- Tabla de asesores/usuarios del sistema
CREATE TABLE asesores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(15),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    tipo VARCHAR(20) DEFAULT 'asesor' CHECK (tipo IN ('gtr', 'asesor', 'validador')),
    clientes_asignados INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla principal de clientes (maneja todo el flujo)
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    
    -- DATOS INICIALES (GTR)
    nombre VARCHAR(100),
    telefono VARCHAR(15),
    lead_id VARCHAR(50) UNIQUE,
    fuente_lead VARCHAR(50) DEFAULT 'whatsapp',
    
    -- ESTADO DEL FLUJO
    estado_cliente VARCHAR(20) DEFAULT 'lead_nuevo' CHECK (
        estado_cliente IN (
            'lead_nuevo', 'asignado', 'en_proceso', 'datos_completos', 
            'en_validacion', 'validado', 'rechazado', 'instalado'
        )
    ),
    
    -- ASIGNACIONES
    gtr_asignado INT REFERENCES asesores(id),
    asesor_asignado INT REFERENCES asesores(id),
    validador_asignado INT REFERENCES asesores(id),
    
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
    tipo_cliente VARCHAR(20) CHECK (tipo_cliente IN ('standard', 'premium', 'vip')),
    tipo_instalacion VARCHAR(50),
    plan_seleccionado VARCHAR(200),
    precio_final DECIMAL(10,2),
    metodo_pago VARCHAR(50),
    fecha_cita DATE,
    hora_cita TIME,
    
    -- OBSERVACIONES
    documentos_requeridos TEXT[],
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
    fecha_asignacion TIMESTAMP,
    fecha_datos_completos TIMESTAMP,
    fecha_validacion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de historial para tracking
CREATE TABLE historial_cliente (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES asesores(id),
    accion VARCHAR(100) NOT NULL,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20),
    comentarios TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla específica para validaciones
CREATE TABLE validaciones (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    validador_id INT REFERENCES asesores(id),
    status VARCHAR(20) DEFAULT 'pendiente' CHECK (
        status IN ('pendiente', 'en_revision', 'validado', 'rechazado')
    ),
    fecha_programacion TIMESTAMP,
    fecha_instalacion DATE,
    resultado VARCHAR(20),
    motivo_rechazo TEXT,
    comentario_validador TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
-- FUNCIONES DEL SISTEMA
-- ================================================

-- GTR: Ingresar nuevo lead
CREATE OR REPLACE FUNCTION gtr_ingresar_lead(
    p_nombre VARCHAR(100),
    p_telefono VARCHAR(15),
    p_gtr_id INT
) RETURNS INT AS $$
DECLARE
    nuevo_cliente_id INT;
    lead_id_generado VARCHAR(50);
BEGIN
    lead_id_generado := 'WSP_' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '_' || LPAD(nextval('clientes_id_seq')::TEXT, 3, '0');
    
    INSERT INTO clientes (nombre, telefono, lead_id, gtr_asignado, estado_cliente)
    VALUES (p_nombre, p_telefono, lead_id_generado, p_gtr_id, 'lead_nuevo')
    RETURNING id INTO nuevo_cliente_id;
    
    INSERT INTO historial_cliente (cliente_id, usuario_id, accion, estado_nuevo, comentarios)
    VALUES (nuevo_cliente_id, p_gtr_id, 'lead_ingresado', 'lead_nuevo', 'Lead desde WhatsApp');
    
    RETURN nuevo_cliente_id;
END;
$$ LANGUAGE plpgsql;

-- GTR: Asignar lead a asesor
CREATE OR REPLACE FUNCTION gtr_asignar_asesor(
    p_cliente_id INT,
    p_asesor_id INT,
    p_gtr_id INT
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE clientes 
    SET asesor_asignado = p_asesor_id,
        estado_cliente = 'asignado',
        fecha_asignacion = CURRENT_TIMESTAMP
    WHERE id = p_cliente_id AND estado_cliente = 'lead_nuevo';
    
    INSERT INTO historial_cliente (cliente_id, usuario_id, accion, estado_anterior, estado_nuevo, comentarios)
    VALUES (p_cliente_id, p_gtr_id, 'asignado_asesor', 'lead_nuevo', 'asignado', 'Asignado a asesor');
    
    UPDATE asesores SET clientes_asignados = clientes_asignados + 1 WHERE id = p_asesor_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ASESOR: Completar datos del cliente
CREATE OR REPLACE FUNCTION asesor_completar_datos(
    p_cliente_id INT,
    p_asesor_id INT,
    p_dni VARCHAR(50),
    p_email VARCHAR(100),
    p_direccion TEXT,
    p_distrito VARCHAR(100),
    p_plan VARCHAR(200),
    p_precio DECIMAL(10,2),
    p_observaciones TEXT
) RETURNS BOOLEAN AS $$
BEGIN
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
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- VALIDACIONES: Buscar por DNI
CREATE OR REPLACE FUNCTION buscar_por_dni(p_dni VARCHAR(50))
RETURNS TABLE (
    id INT,
    dni VARCHAR(50),
    nombre VARCHAR(100),
    telefono VARCHAR(15),
    email VARCHAR(100),
    estado VARCHAR(20),
    fecha_programacion DATE,
    fecha_instalacion DATE,
    comentario TEXT,
    asesor_nombre VARCHAR(100),
    plan_seleccionado VARCHAR(200),
    precio_final DECIMAL(10,2),
    direccion TEXT,
    distrito VARCHAR(100),
    observaciones_asesor TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id, c.dni, c.nombre, c.telefono, c.correo_electronico,
        c.estado_cliente, c.fecha_cita, NULL::DATE,
        c.comentario_validacion, a.nombre, c.plan_seleccionado,
        c.precio_final, c.direccion, c.distrito, c.observaciones_asesor
    FROM clientes c
    LEFT JOIN asesores a ON c.asesor_asignado = a.id
    WHERE c.dni = p_dni AND c.estado_cliente IN ('datos_completos', 'en_validacion', 'validado');
END;
$$ LANGUAGE plpgsql;

-- VALIDACIONES: Buscar por Lead ID
CREATE OR REPLACE FUNCTION buscar_por_lead(p_lead_id VARCHAR(50))
RETURNS TABLE (
    id INT,
    lead_id VARCHAR(50),
    nombre VARCHAR(100),
    telefono VARCHAR(15),
    email VARCHAR(100),
    estado VARCHAR(20),
    fecha_programacion DATE,
    comentario TEXT,
    asesor_nombre VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id, c.lead_id, c.nombre, c.telefono, c.correo_electronico,
        c.estado_cliente, c.fecha_cita, c.comentario_validacion, a.nombre
    FROM clientes c
    LEFT JOIN asesores a ON c.asesor_asignado = a.id
    WHERE c.lead_id = p_lead_id AND c.estado_cliente IN ('datos_completos', 'en_validacion', 'validado');
END;
$$ LANGUAGE plpgsql;

-- VALIDACIONES: Aprobar cliente
CREATE OR REPLACE FUNCTION validar_aprobar(
    p_cliente_id INT,
    p_validador_id INT,
    p_comentario TEXT
) RETURNS BOOLEAN AS $$
BEGIN
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
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- VALIDACIONES: Obtener clientes listos para validar
CREATE OR REPLACE FUNCTION obtener_para_validar()
RETURNS TABLE (
    id INT,
    dni VARCHAR(50),
    nombre VARCHAR(100),
    telefono VARCHAR(15),
    estado VARCHAR(20),
    asesor_nombre VARCHAR(100),
    fecha_datos_completos TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.dni, c.nombre, c.telefono, c.estado_cliente, a.nombre, c.fecha_datos_completos
    FROM clientes c
    LEFT JOIN asesores a ON c.asesor_asignado = a.id
    WHERE c.estado_cliente = 'datos_completos'
    ORDER BY c.fecha_datos_completos ASC;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- DATOS DE EJEMPLO
-- ================================================

-- Insertar asesores
INSERT INTO asesores (nombre, email, tipo) VALUES
('GTR Sistema', 'gtr@albru.com', 'gtr'),
('Ana García', 'ana.garcia@albru.com', 'asesor'),
('Luis López', 'luis.lopez@albru.com', 'asesor'),
('Carmen Torres', 'carmen.torres@albru.com', 'asesor'),
('Validador Calidad', 'validaciones@albru.com', 'validador');

-- ================================================
-- PRUEBAS DEL FLUJO COMPLETO
-- ================================================

-- 1. GTR ingresa lead
SELECT gtr_ingresar_lead('Juan Pérez', '+51956149567', 1) AS cliente_id_creado;

-- 2. GTR asigna a asesor
SELECT gtr_asignar_asesor(1, 2, 1) AS asignacion_exitosa;

-- 3. Asesor completa datos
SELECT asesor_completar_datos(
    1, 2, '12345678', 'juan@email.com', 
    'Av. Lima 123, Dpto 501', 'San Isidro', 
    'Plan Premium 500MB', 899.00, 
    'Cliente interesado, requiere instalación urgente'
) AS datos_completados;

-- 4. Ver el cliente creado
SELECT 
    id, nombre, dni, telefono, estado_cliente, 
    plan_seleccionado, precio_final 
FROM clientes WHERE id = 1;

-- 5. Buscar por DNI (función para validaciones)
SELECT * FROM buscar_por_dni('12345678');

-- 6. Aprobar validación
SELECT validar_aprobar(1, 5, 'Cliente aprobado, todos los datos correctos') AS validacion_aprobada;

-- 7. Ver historial completo
SELECT 
    h.fecha, h.accion, h.estado_anterior, h.estado_nuevo, 
    h.comentarios, a.nombre as usuario
FROM historial_cliente h 
LEFT JOIN asesores a ON h.usuario_id = a.id 
WHERE h.cliente_id = 1 
ORDER BY h.fecha DESC;

-- 8. Ver estado final del cliente
SELECT 
    c.id, c.nombre, c.dni, c.estado_cliente, c.plan_seleccionado,
    c.precio_final, a.nombre as asesor, v.nombre as validador
FROM clientes c
LEFT JOIN asesores a ON c.asesor_asignado = a.id
LEFT JOIN asesores v ON c.validador_asignado = v.id
WHERE c.id = 1;

-- ================================================
-- MENSAJE DE ÉXITO
-- ================================================
SELECT 'Base de datos ALBRU creada y probada exitosamente!' AS resultado;