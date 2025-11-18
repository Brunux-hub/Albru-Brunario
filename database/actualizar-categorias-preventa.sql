-- Actualizar clientes de prueba con categorías correctas del wizard

-- Cliente 2449: Preventa completa -> Venta cerrada
UPDATE clientes 
SET estatus_comercial_categoria = 'Preventa completa', 
    estatus_comercial_subcategoria = 'Venta cerrada'
WHERE id = 2449;

-- Cliente 2458: Preventa -> Preventa
UPDATE clientes 
SET estatus_comercial_categoria = 'Preventa', 
    estatus_comercial_subcategoria = 'Preventa'
WHERE id = 2458;

-- Verificar los cambios
SELECT id, nombre, estatus_comercial_categoria, estatus_comercial_subcategoria 
FROM clientes 
WHERE id IN (2449, 2458);
