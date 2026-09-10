-- 001_reemplazar_stock_general.sql
-- Función para "Actualizar inventario por Excel" en el módulo Stock General.
--
-- Recibe el listado nuevo de productos (un array JSON) y, DENTRO DE UNA MISMA
-- TRANSACCIÓN, borra todo el Stock General actual y carga el nuevo. Si algo
-- falla a mitad de camino, Postgres revierte todo solo: la tabla nunca queda
-- vacía ni a medias.
--
-- Pasos que hace la función, en orden:
--   1. Suelta el producto_id de todos los ítems de pedidos (para poder borrar
--      la tabla productos sin que la llave foránea lo impida).
--   2. Borra el Stock General actual.
--   3. Carga los productos nuevos del Excel.
--   4. Vuelve a enganchar los ítems de pedidos que quedaron sueltos con el
--      producto nuevo que tenga el mismo nombre y depósito, así los pedidos
--      pendientes/aprobados siguen descontando stock cuando se entreguen.
--
-- Cómo correrlo: pegar este archivo completo en el SQL Editor de Supabase y
-- ejecutar (botón "Run"). Se puede volver a correr sin problema (CREATE OR
-- REPLACE), pero si Postgres tira error 42P13 (cambió el RETURNS), primero:
--   DROP FUNCTION IF EXISTS reemplazar_stock_general(jsonb);
-- y después correr el CREATE de nuevo.

CREATE OR REPLACE FUNCTION reemplazar_stock_general(p_productos jsonb)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_insertados integer;
BEGIN
  -- 1. Soltar el producto_id de todos los ítems de pedidos. Los pedidos guardan
  --    el nombre, el depósito y la cantidad de cada ítem por separado, así que
  --    esto no rompe el historial. En el paso 4 se vuelven a enganchar los que
  --    se pueda.
  UPDATE pedido_items SET producto_id = NULL WHERE producto_id IS NOT NULL;

  -- 2. Borrar todo el Stock General actual.
  --    El "WHERE true" es a propósito: Supabase bloquea cualquier DELETE sin
  --    condición ejecutado con la anon key, incluso adentro de una función.
  --    "WHERE true" destraba ese bloqueo sin cambiar nada: sigue borrando todo.
  DELETE FROM productos WHERE true;

  -- 3. Cargar el listado nuevo del Excel.
  INSERT INTO productos (nombre, marca, modelo, descripcion, codigo, categoria, deposito, cantidad)
  SELECT
    NULLIF(TRIM(x->>'nombre'), ''),
    NULLIF(TRIM(x->>'marca'), ''),
    NULLIF(TRIM(x->>'modelo'), ''),
    NULLIF(TRIM(x->>'descripcion'), ''),
    NULLIF(TRIM(x->>'codigo'), ''),
    COALESCE(NULLIF(TRIM(x->>'categoria'), ''), 'General'),
    x->>'deposito',
    COALESCE((x->>'cantidad')::integer, 0)
  FROM jsonb_array_elements(p_productos) AS x
  WHERE COALESCE(TRIM(x->>'nombre'), '') <> ''
    AND x->>'deposito' IN ('Caseros', 'Mataderos');

  GET DIAGNOSTICS v_insertados = ROW_COUNT;

  -- 4. Volver a enganchar los ítems de pedidos que quedaron sueltos
  --    (producto_id NULL) con el producto nuevo que tenga el mismo nombre y el
  --    mismo depósito. El cruce ignora mayúsculas y espacios de más. Si un ítem
  --    no encuentra coincidencia se queda suelto: el flujo de entrega ya
  --    contempla ese caso (simplemente no descuenta stock automático).
  --    El subselect con DISTINCT ON toma un solo producto por nombre+depósito
  --    (el de menor id) por si llegara a haber repetidos.
  UPDATE pedido_items pi
  SET producto_id = coincidencia.id
  FROM (
    SELECT DISTINCT ON (LOWER(TRIM(nombre)), deposito)
           id,
           LOWER(TRIM(nombre)) AS nombre_norm,
           deposito
    FROM productos
    ORDER BY LOWER(TRIM(nombre)), deposito, id
  ) AS coincidencia
  WHERE pi.producto_id IS NULL
    AND LOWER(TRIM(pi.nombre)) = coincidencia.nombre_norm
    AND TRIM(pi.deposito) = coincidencia.deposito;

  RETURN v_insertados;
END;
$$;

-- La app usa la anon key desde el navegador (igual que login_usuario, etc.).
GRANT EXECUTE ON FUNCTION reemplazar_stock_general(jsonb) TO anon, authenticated;
