-- QUERIES PARA ENTENDER EL SISTEMA DE ATRIBUTOS EN INTERBRAS

-- ============================================================================
-- 1. TABLA ATTRIBUTES - Define los tipos de atributos disponibles
-- ============================================================================

-- Ver todos los atributos disponibles
SELECT 
  a.id,
  a.slug,
  a.name->>'es' as nombre_es,
  a.name->>'en' as nombre_en,
  a.description->>'es' as descripcion_es,
  a.sort_order,
  a.active,
  a.created_at,
  a.updated_at
FROM attributes a
ORDER BY a.sort_order, a.slug;

-- Resultado esperado: 4 atributos
-- - color: Color del producto
-- - resolucion: Resolución (HD, FHD, 4K, 8K)
-- - tecnologia-panel: Tecnología de panel (LED, QLED, OLED)
-- - voltage: Voltaje eléctrico (110V, 220V, Bivolt)

-- ============================================================================
-- 2. TABLA ATTRIBUTE_VALUES - Define los valores posibles para cada atributo
-- ============================================================================

-- Ver TODOS los valores de atributos organizados por atributo
SELECT 
  a.slug as atributo,
  av.id,
  av.slug as valor_slug,
  av.name->>'es' as valor_nombre_es,
  av.name->>'en' as valor_nombre_en,
  av.sort_order,
  av.active,
  av.created_at
FROM attributes a
LEFT JOIN attribute_values av ON a.id = av.attribute_id
ORDER BY a.sort_order, a.slug, av.sort_order;

-- ============================================================================
-- 3. VER VALORES POR ATRIBUTO ESPECÍFICO
-- ============================================================================

-- Valores del atributo COLOR
SELECT 
  av.id,
  av.slug,
  av.name->>'es' as nombre_es,
  av.sort_order
FROM attribute_values av
WHERE av.attribute_id = (SELECT id FROM attributes WHERE slug = 'color')
ORDER BY av.sort_order;

-- Valores del atributo RESOLUCIÓN
SELECT 
  av.id,
  av.slug,
  av.name->>'es' as nombre_es,
  av.sort_order
FROM attribute_values av
WHERE av.attribute_id = (SELECT id FROM attributes WHERE slug = 'resolucion')
ORDER BY av.sort_order;

-- Valores del atributo TECNOLOGÍA DE PANEL
SELECT 
  av.id,
  av.slug,
  av.name->>'es' as nombre_es,
  av.sort_order
FROM attribute_values av
WHERE av.attribute_id = (SELECT id FROM attributes WHERE slug = 'tecnologia-panel')
ORDER BY av.sort_order;

-- Valores del atributo VOLTAJE
SELECT 
  av.id,
  av.slug,
  av.name->>'es' as nombre_es,
  av.sort_order
FROM attribute_values av
WHERE av.attribute_id = (SELECT id FROM attributes WHERE slug = 'voltage')
ORDER BY av.sort_order;

-- ============================================================================
-- 4. TABLA VARIANTS - Cómo se vinculan los atributos con las variantes
-- ============================================================================

-- Ver estructura de variants (relevante: columna 'options')
-- Columnnas: id, product_id, sku, options (JSONB), units_per_box, sort_order, active

-- Ver variantes con sus opciones/atributos
SELECT 
  v.id,
  v.sku,
  v.product_id,
  v.options::text as opciones_json,
  v.active
FROM variants v
WHERE v.options IS NOT NULL
LIMIT 20;

-- ============================================================================
-- 5. EJEMPLOS DE VINCULACIÓN - TVs IN específicamente
-- ============================================================================

-- Ver cómo se vinculan los TVs IN con sus atributos
SELECT 
  v.id as variant_id,
  v.sku as variant_sku,
  v.options->>'color' as color_asignado,
  v.options->>'voltage' as voltage_asignado,
  v.options->>'resolucion' as resolucion_asignada,
  v.options->>'tecnologia-panel' as tecnologia_asignada,
  v.options::text as json_completo
FROM variants v
WHERE v.sku IN ('IN5000TV-NEGRO', 'IN5500TV-NEGRO', 'IN6500TV-NEGRO', 'IN7500TV-NEGRO')
ORDER BY v.sku;

-- ============================================================================
-- 6. BÚSQUEDA DE VARIANTES POR VALOR DE ATRIBUTO
-- ============================================================================

-- Encontrar TODAS las variantes de color "Negro"
SELECT 
  v.id,
  v.sku,
  v.options->>'color' as color
FROM variants v
WHERE v.options->>'color' = 'Negro'
ORDER BY v.sku;

-- Encontrar variantes con voltage "220V"
SELECT 
  v.id,
  v.sku,
  v.options->>'voltage' as voltage
FROM variants v
WHERE v.options->>'voltage' = '220V'
ORDER BY v.sku;

-- Encontrar variantes con resolución "4K"
SELECT 
  v.id,
  v.sku,
  v.options->>'resolucion' as resolucion
FROM variants v
WHERE v.options->>'resolucion' = '4K'
ORDER BY v.sku;

-- ============================================================================
-- 7. CÓMO SE VINCULAN (ARQUITECTURA COMPLETA)
-- ============================================================================

-- Vincular productos -> variantes -> atributos con sus valores
SELECT 
  p.id as producto_id,
  p.name->>'es' as producto_nombre,
  v.sku as variante_sku,
  v.options as atributos_json,
  -- Extrayendo cada atributo
  v.options->>'color' as color,
  v.options->>'voltage' as voltaje,
  v.options->>'resolucion' as resolucion,
  v.options->>'tecnologia-panel' as tecnologia_panel
FROM products p
INNER JOIN variants v ON p.id = v.product_id
WHERE v.options IS NOT NULL
LIMIT 10;

-- ============================================================================
-- EXPLICACIÓN DEL VINCULAMIENTO:
-- ============================================================================

/*
ARQUITECTURA:
=============

1. ATTRIBUTES (tabla principal)
   - Define qué atributos existen (color, voltage, etc.)
   - Cada atributo tiene: id, slug, name (JSON), description (JSON), sort_order, active

2. ATTRIBUTE_VALUES (valores permitidos)
   - Para cada atributo, define qué valores son válidos
   - Ejemplo: para COLOR existen: Azul, Rojo, Negro, etc.
   - Estructura: id, attribute_id, slug, name (JSON), sort_order, active

3. VARIANTS (enlace con el producto)
   - Cada variante tiene una columna 'options' de tipo JSONB
   - La columna options contiene: {"color": "Negro", "voltage": "220V", etc.}
   - La CLAVE del JSON (ej: "color") corresponde al SLUG del atributo
   - El VALOR del JSON (ej: "Negro") corresponde al NOMBRE del valor del atributo

FLUJO DE VINCULACIÓN:
====================

Ejemplo: Variante IN5000TV-NEGRO tiene atributo color="Negro"

1. variants table:
   - sku: "IN5000TV-NEGRO"
   - options: {"color": "Negro"}

2. attributes table:
   - slug: "color"
   - Corresponde a la CLAVE "color" en options

3. attribute_values table:
   - attribute_id: <id del atributo color>
   - slug: "negro"
   - name->>'es': "Negro"
   - Corresponde al VALOR "Negro" en options

RESUMEN:
========

✓ Los atributos NO están en una tabla separada que vincule con variantes
✓ La vinculación es IMPLÍCITA mediante el JSON en variants.options
✓ La clave del JSON corresponde al slug del atributo
✓ El valor del JSON corresponde al nombre del valor del atributo
✓ Este es un diseño DESNORMALIZADO pero FLEXIBLE

Para agregar un nuevo atributo a una variante existente:
1. Verificar que el atributo existe en attributes
2. Verificar que el valor existe en attribute_values para ese atributo
3. Actualizar el JSON en variants.options agregando la nueva clave-valor
   UPDATE variants SET options = jsonb_set(options, '{nueva_clave}', '"nuevo_valor"')
   WHERE id = '<variant_id>';
*/