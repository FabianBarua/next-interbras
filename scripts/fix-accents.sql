-- Fix broken accents by setting correct values directly using chr(237) = í
-- Affected: 62e5410f, 25638427, 4b8d984a, and check for Titan F3

UPDATE products SET name = ('{"es":"ACC. Bater' || chr(237) || 'a F5 V8 X-Scooter Xtreme","pt":"ACC. Bateria F5 V8 X-Scooter Xtreme"}')::jsonb
WHERE id = '62e5410f-c4fd-4f7d-97f7-919bb81f3404';

UPDATE products SET name = ('{"es":"ACC. X-Scooter Bater' || chr(237) || 'a 8,5","pt":"ACC. X-Scooter Bateria 8,5"}')::jsonb
WHERE id = '25638427-ab12-4cac-a65a-8f5389112933';

UPDATE products SET name = ('{"es":"Bater' || chr(237) || 'a Hoverboard 6,5","pt":"Bateria Hoverboard 6,5"}')::jsonb
WHERE id = '4b8d984a-6b8f-4fc3-b388-636555c2fb02';

UPDATE products SET name = ('{"es":"Bater' || chr(237) || 'a X-Scooter Titan F3","pt":"Bateria X-Scooter Titan F3"}')::jsonb
WHERE id = (SELECT id FROM products WHERE name->>'es' LIKE '%ater%Titan%F3%' LIMIT 1);

-- Verify all
SELECT id, name->>'es' as es, name->>'pt' as pt, octet_length(name->>'es') as bytes
FROM products
WHERE category_id = 'a97641f7-9fac-4c64-aad5-f80b66b4380d'
ORDER BY name->>'es';
