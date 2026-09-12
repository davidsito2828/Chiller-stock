-- 002_corregir_peso_inicial_garrafas.sql
-- Corrige peso_inicial en garrafas EXISTENTES.
--
-- Motivo: al agregar la columna peso_inicial quedó en 13.6 para todas las
-- garrafas por igual, pero el peso real de cada una ya está escrito en el
-- texto de tipo_garrafa (ej: "Garrafa 6,8 KG", "Garrafa 13,60 KG"). Esto hacía
-- que el cálculo de "kg restantes" quedara mal para cualquier garrafa que no
-- fuera de 13,6 kg.
--
-- Qué hace: toma el número que aparece antes de "KG" en tipo_garrafa (con
-- coma o punto decimal), lo convierte a numérico y lo guarda en peso_inicial.
-- Las garrafas cuyo tipo_garrafa no tenga ese patrón (ej: texto raro, o sin
-- "KG") quedan sin tocar — siguen con el valor que tengan hoy.
--
-- Cómo correrlo: primero el SELECT de abajo, para revisar que los valores
-- detectados sean correctos. Si está todo bien, correr el UPDATE.

-- 1) Vista previa: qué se va a cambiar (no modifica nada).
SELECT
  id,
  codigo,
  tipo_garrafa,
  peso_inicial AS peso_actual,
  REPLACE(substring(tipo_garrafa FROM '(?i)([0-9]+(?:[.,][0-9]+)?)\s*kg'), ',', '.')::numeric AS peso_detectado
FROM garrafas
ORDER BY codigo;

-- 2) Corrección real. Solo toca las filas donde se pudo detectar un peso en
--    tipo_garrafa (WHERE tipo_garrafa ~* ...); el resto queda como está.
UPDATE garrafas
SET peso_inicial = REPLACE(substring(tipo_garrafa FROM '(?i)([0-9]+(?:[.,][0-9]+)?)\s*kg'), ',', '.')::numeric
WHERE tipo_garrafa ~* '[0-9]+(?:[.,][0-9]+)?\s*kg';
