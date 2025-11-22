-- Actualizar categorías y subcategorías en tabla clientes basado en tipificacion_original

-- PREVENTA COMPLETA
UPDATE clientes 
SET estatus_comercial_categoria = 'Preventa completa',
    estatus_comercial_subcategoria = 'Venta cerrada'
WHERE tipificacion_original IN ('PREVENTA COMPLETA', '7 - VENTA CERRADA', '7 - VC MES SIGUIENTE');

UPDATE clientes 
SET estatus_comercial_categoria = 'Preventa completa',
    estatus_comercial_subcategoria = 'Preventa pendiente de score'
WHERE tipificacion_original = '6 - PDTE SCORE';

-- PREVENTA INCOMPLETA
UPDATE clientes 
SET estatus_comercial_categoria = 'Preventa incompleta',
    estatus_comercial_subcategoria = 'Preventa incompleta'
WHERE tipificacion_original = '6 - PREVENTA';

-- LISTA NEGRA
UPDATE clientes 
SET estatus_comercial_categoria = 'Lista negra',
    estatus_comercial_subcategoria = 'Lista negra'
WHERE tipificacion_original = '8 - LISTA NEGRA';

-- SIN FACILIDADES
UPDATE clientes 
SET estatus_comercial_categoria = 'Sin facilidades',
    estatus_comercial_subcategoria = 'Sin cobertura'
WHERE tipificacion_original = '5 - SIN COBERTURA';

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin facilidades',
    estatus_comercial_subcategoria = 'Servicio activo'
WHERE tipificacion_original = '5 - SERVICIO ACTIVO';

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin facilidades',
    estatus_comercial_subcategoria = 'Edificio sin liberar'
WHERE tipificacion_original = '5 - EDIFICIO SIN LIBERAR';

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin facilidades',
    estatus_comercial_subcategoria = 'Sin CTO'
WHERE tipificacion_original = '5 - SIN CTO';

-- RETIRADO
UPDATE clientes 
SET estatus_comercial_categoria = 'Retirado',
    estatus_comercial_subcategoria = 'No desea publicidad'
WHERE tipificacion_original = '4 - ND PUBLICIDAD';

-- RECHAZADO
UPDATE clientes 
SET estatus_comercial_categoria = 'Rechazado',
    estatus_comercial_subcategoria = 'No desea'
WHERE tipificacion_original = '3 - NO DESEA';

UPDATE clientes 
SET estatus_comercial_categoria = 'Rechazado',
    estatus_comercial_subcategoria = 'Con programación'
WHERE tipificacion_original IN ('3 - CON PROGRAMACIÓN', '3 - CON PROGRAMACIÃ"N', '4 - CON PROGRAMACIÓN');

UPDATE clientes 
SET estatus_comercial_categoria = 'Rechazado',
    estatus_comercial_subcategoria = 'No califica'
WHERE tipificacion_original = '3 - NO CALIFICA';

UPDATE clientes 
SET estatus_comercial_categoria = 'Rechazado',
    estatus_comercial_subcategoria = 'Venta cerrada desaprobada'
WHERE tipificacion_original = '3 - VC DESAPROBADA';

UPDATE clientes 
SET estatus_comercial_categoria = 'Rechazado',
    estatus_comercial_subcategoria = 'Zona fraude'
WHERE tipificacion_original = '3 - ZONA F';

-- AGENDADO
UPDATE clientes 
SET estatus_comercial_categoria = 'Agendado',
    estatus_comercial_subcategoria = 'Agendado'
WHERE tipificacion_original = '2 - AGENDADO';

UPDATE clientes 
SET estatus_comercial_categoria = 'Agendado',
    estatus_comercial_subcategoria = 'Consultaría con familiar'
WHERE tipificacion_original = '2 - CONSULTARA CON FAMILIAR';

UPDATE clientes 
SET estatus_comercial_categoria = 'Agendado',
    estatus_comercial_subcategoria = 'Fin de mes'
WHERE tipificacion_original = '2 - FIN DE MES';

-- SEGUIMIENTO
UPDATE clientes 
SET estatus_comercial_categoria = 'Seguimiento',
    estatus_comercial_subcategoria = 'Seguimiento'
WHERE tipificacion_original IN ('1 - SEGUIMIENTO', '4 - DOBLE CLICK');

UPDATE clientes 
SET estatus_comercial_categoria = 'Seguimiento',
    estatus_comercial_subcategoria = 'Solo info'
WHERE tipificacion_original = '1 - SOLO INFO';

UPDATE clientes 
SET estatus_comercial_categoria = 'Seguimiento',
    estatus_comercial_subcategoria = 'Gestión o chat'
WHERE tipificacion_original = '1 - GESTION x CHAT';

-- SIN CONTACTO
UPDATE clientes 
SET estatus_comercial_categoria = 'Sin contacto',
    estatus_comercial_subcategoria = 'No contesta'
WHERE tipificacion_original IN ('0 - NO CONTESTA', '1 - NO CONTESTA', 'NO CONTESTA');

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin contacto',
    estatus_comercial_subcategoria = 'Buzón'
WHERE tipificacion_original = '0 - BUZON';

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin contacto',
    estatus_comercial_subcategoria = 'Fuera de servicio'
WHERE tipificacion_original = '0 - FUERA DE SERVICIO';

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin contacto',
    estatus_comercial_subcategoria = 'Número equivocado'
WHERE tipificacion_original IN ('0 - N° EQUIVOCADO', '0 - Nº EQUIVOCADO', '0 - NÂ° EQUIVOCADO');

UPDATE clientes 
SET estatus_comercial_categoria = 'Sin contacto',
    estatus_comercial_subcategoria = 'Corta llamada'
WHERE tipificacion_original = '0 - CORTA LLAMADA';
