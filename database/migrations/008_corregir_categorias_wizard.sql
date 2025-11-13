-- Actualización de Categorías y Subcategorías al formato correcto del Wizard
-- Fecha: 12 de noviembre de 2025
-- Objetivo: Corregir categorías y subcategorías para que coincidan con estatusComercial.ts

-- ====================================================================================
-- SIN CONTACTO (antes: PROSPECCIÓN)
-- ====================================================================================

-- 0 - NO CONTESTA, 0 - CORTA LLAMADA, 0 - BUZON → Sin contacto / No contesta, Corta llamada, Buzón
UPDATE clientes 
SET estatus_comercial_categoria = 'Sin contacto',
    estatus_comercial_subcategoria = 'No contesta'
WHERE tipificacion_original IN ('0 - NO CONTESTA');

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin contacto',
    estatus_comercial_subcategoria = 'Corta llamada'
WHERE tipificacion_original IN ('0 - CORTA LLAMADA');

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin contacto',
    estatus_comercial_subcategoria = 'Buzón'
WHERE tipificacion_original IN ('0 - BUZON');

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin contacto',
    estatus_comercial_subcategoria = 'Fuera de servicio'
WHERE tipificacion_original IN ('0 - FUERA DE SERVICIO');

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin contacto',
    estatus_comercial_subcategoria = 'Número equivocado'
WHERE tipificacion_original IN ('0 - N° EQUIVOCADO');

-- ====================================================================================
-- SEGUIMIENTO
-- ====================================================================================

UPDATE clientes 
SET estatus_comercial_categoria = 'Seguimiento',
    estatus_comercial_subcategoria = 'Solo info'
WHERE tipificacion_original IN ('1 - SOLO INFO');

UPDATE clientes 
SET estatus_comercial_categoria = 'Seguimiento',
    estatus_comercial_subcategoria = 'Gestión o chat'
WHERE tipificacion_original IN ('1 - GESTION x CHAT');

UPDATE clientes 
SET estatus_comercial_categoria = 'Seguimiento',
    estatus_comercial_subcategoria = 'Seguimiento'
WHERE tipificacion_original IN ('1 - SEGUIMIENTO', '4 - DOBLE CLICK');

-- ====================================================================================
-- AGENDADO
-- ====================================================================================

UPDATE clientes 
SET estatus_comercial_categoria = 'Agendado',
    estatus_comercial_subcategoria = 'Agendado'
WHERE tipificacion_original IN ('2 - AGENDADO');

UPDATE clientes 
SET estatus_comercial_categoria = 'Agendado',
    estatus_comercial_subcategoria = 'Consultaría con familiar'
WHERE tipificacion_original IN ('2 - CONSULTARA CON FAMILIAR');

UPDATE clientes 
SET estatus_comercial_categoria = 'Agendado',
    estatus_comercial_subcategoria = 'Fin de mes'
WHERE tipificacion_original IN ('2 - FIN DE MES');

-- ====================================================================================
-- RECHAZADO
-- ====================================================================================

UPDATE clientes 
SET estatus_comercial_categoria = 'Rechazado',
    estatus_comercial_subcategoria = 'No desea'
WHERE tipificacion_original IN ('3 - NO DESEA');

UPDATE clientes 
SET estatus_comercial_categoria = 'Rechazado',
    estatus_comercial_subcategoria = 'Con programación'
WHERE tipificacion_original IN ('3 - CON PROGRAMACIÓN');

UPDATE clientes 
SET estatus_comercial_categoria = 'Rechazado',
    estatus_comercial_subcategoria = 'No califica'
WHERE tipificacion_original IN ('3 - NO CALIFICA');

UPDATE clientes 
SET estatus_comercial_categoria = 'Rechazado',
    estatus_comercial_subcategoria = 'Venta cerrada desaprobada'
WHERE tipificacion_original IN ('3 - VC DESAPROBADA');

UPDATE clientes 
SET estatus_comercial_categoria = 'Rechazado',
    estatus_comercial_subcategoria = 'Zona fraude'
WHERE tipificacion_original IN ('3 - ZONA F');

UPDATE clientes 
SET estatus_comercial_categoria = 'Lista negra',
    estatus_comercial_subcategoria = 'Lista negra'
WHERE tipificacion_original IN ('8 - LISTA NEGRA');

-- ====================================================================================
-- RETIRADO
-- ====================================================================================

UPDATE clientes 
SET estatus_comercial_categoria = 'Retirado',
    estatus_comercial_subcategoria = 'No desea publicidad'
WHERE tipificacion_original IN ('4 - ND PUBLICIDAD');

-- ====================================================================================
-- SIN FACILIDADES
-- ====================================================================================

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin facilidades',
    estatus_comercial_subcategoria = 'Sin cobertura'
WHERE tipificacion_original IN ('5 - SIN COBERTURA');

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin facilidades',
    estatus_comercial_subcategoria = 'Servicio activo'
WHERE tipificacion_original IN ('5 - SERVICIO ACTIVO');

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin facilidades',
    estatus_comercial_subcategoria = 'Edificio sin liberar'
WHERE tipificacion_original IN ('5 - EDIFICIO SIN LIBERAR');

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin facilidades',
    estatus_comercial_subcategoria = 'Sin CTO'
WHERE tipificacion_original IN ('5 - SIN CTO');

-- ====================================================================================
-- PREVENTA COMPLETA
-- ====================================================================================

UPDATE clientes 
SET estatus_comercial_categoria = 'Preventa completa',
    estatus_comercial_subcategoria = 'Preventa pendiente de score'
WHERE tipificacion_original IN ('6 - PREVENTA', '6 - PDTE SCORE');

-- ====================================================================================
-- VERIFICACIÓN
-- ====================================================================================

SELECT 
    'Resumen de Actualización' as info,
    estatus_comercial_categoria as categoria,
    estatus_comercial_subcategoria as subcategoria,
    COUNT(*) as cantidad
FROM clientes
GROUP BY estatus_comercial_categoria, estatus_comercial_subcategoria
ORDER BY cantidad DESC;

-- Ver ejemplos de cada categoría
SELECT 
    tipificacion_original,
    estatus_comercial_categoria,
    estatus_comercial_subcategoria,
    COUNT(*) as cantidad
FROM clientes
WHERE tipificacion_original IS NOT NULL
GROUP BY tipificacion_original, estatus_comercial_categoria, estatus_comercial_subcategoria
ORDER BY estatus_comercial_categoria, cantidad DESC;
