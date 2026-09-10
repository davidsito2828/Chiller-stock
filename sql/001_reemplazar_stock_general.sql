-- 001_reemplazar_stock_general.sql
-- Función para "Actualizar inventario por Excel" en el módulo Stock General.
--
-- Recibe el listado nuevo de productos (un array JSON) y, DENTRO DE UNA MISMA
-- TRANSACCIÓN, borra todo el Stock General actual y carga el nuevo. Si algo
-- falla a mitad de camino, Postgres revierte todo solo: la tabla nunca queda
-- vacía ni a medias.
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
  -- Los pedidos guardan el nombre/depósito/cantidad de cada ítem por separado,
  -- así que desvincular el producto no rompe el historial de pedidos: solo deja
  -- de descontar stock automático en pedidos viejos que todavía no se entregaron.
  UPDATE pedido_items SET producto_id = NULL WHERE producto_id IS NOT NULL;

  -- Borrar todo el Stock General actual.
  DELETE FROM productos;

  -- Cargar el listado nuevo del Excel.
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
  RETURN v_insertados;
END;
$$;

-- La app usa la anon key desde el navegador (igual que login_usuario, etc.).
GRANT EXECUTE ON FUNCTION reemplazar_stock_general(jsonb) TO anon, authenticated;
