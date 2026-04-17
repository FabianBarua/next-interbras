DO $$
DECLARE
  cat_id uuid := 'a97641f7-9fac-4c64-aad5-f80b66b4380d';
  p_id uuid;
  v_id uuid;
BEGIN

  -- 1. ACC. CONTROLADOR T8 CROSS PRO (203-5, $75) — SKIP, already has product/variant

  -- 2. DISPLAY SCOOTER 8,5 (38-3, $10) — existing external_code, no variant
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'display-scooter-8-5', '{"es":"Display Scooter 8,5","pt":"Display Scooter 8,5"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '38-3', '{}', true) RETURNING id INTO v_id;
  UPDATE external_codes SET variant_id = v_id, price_usd = 10.00 WHERE system = 'cec' AND code = '38-3';

  -- 3. DISPLAY SCOOTER 10.5 (35-2, $15)
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'display-scooter-10-5', '{"es":"Display Scooter 10.5","pt":"Display Scooter 10.5"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '35-2', '{}', true) RETURNING id INTO v_id;
  UPDATE external_codes SET variant_id = v_id, price_usd = 15.00 WHERE system = 'cec' AND code = '35-2';

  -- 4. BATERIA X-SCOOTER TITAN F3 (15-4, $85)
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'bateria-x-scooter-titan-f3', '{"es":"Batería X-Scooter Titan F3","pt":"Bateria X-Scooter Titan F3"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '15-4', '{}', true) RETURNING id INTO v_id;
  UPDATE external_codes SET variant_id = v_id, price_usd = 85.00 WHERE system = 'cec' AND code = '15-4';

  -- 5. ACC. BATERIA F5 V8 X-SCOOTER XTREME (16-1, $150)
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'acc-bateria-f5-v8-x-scooter-xtreme', '{"es":"ACC. Batería F5 V8 X-Scooter Xtreme","pt":"ACC. Bateria F5 V8 X-Scooter Xtreme"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '16-1', '{}', true) RETURNING id INTO v_id;
  UPDATE external_codes SET variant_id = v_id, price_usd = 150.00 WHERE system = 'cec' AND code = '16-1';

  -- 6. BATERIA HOVERBOARD 6,5 (14-7, $15)
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'bateria-hoverboard-6-5', '{"es":"Batería Hoverboard 6,5","pt":"Bateria Hoverboard 6,5"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '14-7', '{}', true) RETURNING id INTO v_id;
  UPDATE external_codes SET variant_id = v_id, price_usd = 15.00 WHERE system = 'cec' AND code = '14-7';

  -- 7. ACC. X-SCOOTER BATERIA 8,5 (96-3, $60)
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'acc-x-scooter-bateria-8-5', '{"es":"ACC. X-Scooter Batería 8,5","pt":"ACC. X-Scooter Bateria 8,5"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '96-3', '{}', true) RETURNING id INTO v_id;
  UPDATE external_codes SET variant_id = v_id, price_usd = 60.00 WHERE system = 'cec' AND code = '96-3';

  -- 8. ACC. GUARDABARRO X-SCOOTER 8,5 PARALAMA (43-7, $10)
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'acc-guardabarro-x-scooter-8-5-paralama', '{"es":"ACC. Guardabarro X-Scooter 8,5 Paralama","pt":"ACC. Guardabarro X-Scooter 8,5 Paralama"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '43-7', '{}', true) RETURNING id INTO v_id;
  UPDATE external_codes SET variant_id = v_id, price_usd = 10.00 WHERE system = 'cec' AND code = '43-7';

  -- 9. ACC. ACELERADOR T4 CROSS (204-2, $12)
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'acc-acelerador-t4-cross', '{"es":"ACC. Acelerador T4 Cross","pt":"ACC. Acelerador T4 Cross"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '204-2', '{}', true) RETURNING id INTO v_id;
  UPDATE external_codes SET variant_id = v_id, price_usd = 12.00 WHERE system = 'cec' AND code = '204-2';

  -- 10. ACC. ACELERADOR CROSS PRO T8 (205-9, $12)
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'acc-acelerador-cross-pro-t8', '{"es":"ACC. Acelerador Cross Pro T8","pt":"ACC. Acelerador Cross Pro T8"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '205-9', '{}', true) RETURNING id INTO v_id;
  UPDATE external_codes SET variant_id = v_id, price_usd = 12.00 WHERE system = 'cec' AND code = '205-9';

  -- 11. ACC. ACELERADOR SCOOTER 10.5 ULTRA (268-4, $10) — NEW external_code
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'acc-acelerador-scooter-10-5-ultra', '{"es":"ACC. Acelerador Scooter 10.5 Ultra","pt":"ACC. Acelerador Scooter 10.5 Ultra"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '268-4', '{}', true) RETURNING id INTO v_id;
  INSERT INTO external_codes (variant_id, system, code, external_name, price_usd) VALUES
    (v_id, 'cec', '268-4', 'ACC. ACELERADOR SCOOTER 10.5 ULTRA', 10.00);

  -- 12. ACC. CARGADOR SCOOTER EVO (253-0, $25)
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'acc-cargador-scooter-evo', '{"es":"ACC. Cargador Scooter EVO","pt":"ACC. Carregador Scooter EVO"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '253-0', '{}', true) RETURNING id INTO v_id;
  UPDATE external_codes SET variant_id = v_id, price_usd = 25.00 WHERE system = 'cec' AND code = '253-0';

  -- 13. ACC. CARGADOR SCOOTER CROSS PRO T8 (199-1, $65)
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'acc-cargador-scooter-cross-pro-t8', '{"es":"ACC. Cargador Scooter Cross Pro T8","pt":"ACC. Carregador Scooter Cross Pro T8"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '199-1', '{}', true) RETURNING id INTO v_id;
  UPDATE external_codes SET variant_id = v_id, price_usd = 65.00 WHERE system = 'cec' AND code = '199-1';

  -- 14. ACC. CARGADOR SCOOTER CROSS T4 (198-4, $60)
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'acc-cargador-scooter-cross-t4', '{"es":"ACC. Cargador Scooter Cross T4","pt":"ACC. Carregador Scooter Cross T4"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '198-4', '{}', true) RETURNING id INTO v_id;
  UPDATE external_codes SET variant_id = v_id, price_usd = 60.00 WHERE system = 'cec' AND code = '198-4';

  -- 15. ACC. CARGADOR X-SCOOTER 8,5 (21-5, $10)
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'acc-cargador-x-scooter-8-5', '{"es":"ACC. Cargador X-Scooter 8,5","pt":"ACC. Carregador X-Scooter 8,5"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '21-5', '{}', true) RETURNING id INTO v_id;
  UPDATE external_codes SET variant_id = v_id, price_usd = 10.00 WHERE system = 'cec' AND code = '21-5';

  -- 16. ACC. MOTOR HOVERBOARD (80-2, $20) — NEW external_code
  INSERT INTO products (category_id, slug, name, active) VALUES
    (cat_id, 'acc-motor-hoverboard', '{"es":"ACC. Motor Hoverboard","pt":"ACC. Motor Hoverboard"}', true)
    RETURNING id INTO p_id;
  INSERT INTO variants (product_id, sku, options, active) VALUES
    (p_id, '80-2', '{}', true) RETURNING id INTO v_id;
  INSERT INTO external_codes (variant_id, system, code, external_name, price_usd) VALUES
    (v_id, 'cec', '80-2', 'ACC. MOTOR HOVERBOARD', 20.00);

  RAISE NOTICE 'Done: 15 products, 15 variants created. 13 external_codes updated, 2 inserted. (203-5 skipped, already exists)';
END $$;
