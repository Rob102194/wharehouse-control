-- Modify exit and transfer functions to allow negative stock with warning
-- Instead of raising exception, allow the operation and return a warning flag

-- Modify create_exit to allow negative stock
CREATE OR REPLACE FUNCTION public.create_exit(
  p_origin_warehouse_id uuid,
  p_created_by uuid,
  p_items jsonb,
  p_notes text default null,
  p_allow_negative boolean default true
)
RETURNS table(movement_id uuid, warning text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_movement_id uuid;
  v_actor_role text;
  v_actor_active boolean;
  v_has_invalid_items boolean;
  v_has_duplicate_items boolean;
  v_has_inactive_variants boolean;
  v_item record;
  v_available_stock numeric(14,3);
  v_stock_warning text := null;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Items are required';
  END IF;

  SELECT p.role, p.active
  INTO v_actor_role, v_actor_active
  FROM public.profiles p
  WHERE p.id = p_created_by;

  IF v_actor_role IS NULL OR v_actor_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Invalid actor profile';
  END IF;

  IF v_actor_role NOT IN ('operator', 'admin') THEN
    RAISE EXCEPTION 'Actor role cannot create exits';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.warehouses w
    WHERE w.id = p_origin_warehouse_id AND w.active = true
  ) THEN
    RAISE EXCEPTION 'Origin warehouse is invalid or inactive';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.parse_movement_items(p_items) i
    WHERE i.product_variant_id IS NULL OR i.quantity IS NULL OR i.quantity <= 0
  ) INTO v_has_invalid_items;

  IF v_has_invalid_items THEN
    RAISE EXCEPTION 'Invalid movement items';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.parse_movement_items(p_items) i
    GROUP BY i.product_variant_id HAVING count(*) > 1
  ) INTO v_has_duplicate_items;

  IF v_has_duplicate_items THEN
    RAISE EXCEPTION 'Duplicate product_variant_id in items';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.parse_movement_items(p_items) i
    LEFT JOIN public.product_variants pv ON pv.id = i.product_variant_id AND pv.active = true
    WHERE pv.id IS NULL
  ) INTO v_has_inactive_variants;

  IF v_has_inactive_variants THEN
    RAISE EXCEPTION 'Invalid or inactive product variant in items';
  END IF;

  -- Check stock but only block if p_allow_negative is false
  FOR v_item IN
    SELECT i.product_variant_id, i.quantity
    FROM public.parse_movement_items(p_items) i
  LOOP
    IF p_allow_negative = false THEN
      PERFORM pg_advisory_xact_lock(hashtext(p_origin_warehouse_id::text), hashtext(v_item.product_variant_id::text));
      SELECT public.get_warehouse_variant_stock(p_origin_warehouse_id, v_item.product_variant_id)
      INTO v_available_stock;
      IF v_available_stock < v_item.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for variant % in warehouse %', v_item.product_variant_id, p_origin_warehouse_id;
      END IF;
    ELSE
      -- Check but don't block - just warn if negative
      SELECT public.get_warehouse_variant_stock(p_origin_warehouse_id, v_item.product_variant_id)
      INTO v_available_stock;
      IF v_available_stock < v_item.quantity THEN
        v_stock_warning := 'Stock will go negative for one or more variants';
      END IF;
    END IF;
  END LOOP;

  INSERT INTO public.movements (movement_type, status, origin_warehouse_id, notes, created_by)
  VALUES ('exit', 'confirmed', p_origin_warehouse_id, nullif(trim(p_notes), ''), p_created_by)
  RETURNING id INTO v_movement_id;

  INSERT INTO public.movement_items (movement_id, product_variant_id, quantity)
  SELECT v_movement_id, i.product_variant_id, i.quantity
  FROM public.parse_movement_items(p_items) i;

  RETURN QUERY SELECT v_movement_id, v_stock_warning;
END;
$$;

-- Modify create_transfer to allow negative stock
CREATE OR REPLACE FUNCTION public.create_transfer(
  p_origin_warehouse_id uuid,
  p_destination_warehouse_id uuid,
  p_created_by uuid,
  p_items jsonb,
  p_notes text default null,
  p_allow_negative boolean default true
)
RETURNS table(movement_id uuid, warning text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_movement_id uuid;
  v_actor_role text;
  v_actor_active boolean;
  v_has_invalid_items boolean;
  v_has_duplicate_items boolean;
  v_has_inactive_variants boolean;
  v_item record;
  v_available_stock numeric(14,3);
  v_stock_warning text := null;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Items are required';
  END IF;

  IF p_origin_warehouse_id = p_destination_warehouse_id THEN
    RAISE EXCEPTION 'Origin and destination warehouses must be different';
  END IF;

  SELECT p.role, p.active INTO v_actor_role, v_actor_active
  FROM public.profiles p WHERE p.id = p_created_by;

  IF v_actor_role IS NULL OR v_actor_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Invalid actor profile';
  END IF;

  IF v_actor_role NOT IN ('operator', 'admin') THEN
    RAISE EXCEPTION 'Actor role cannot create transfers';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.warehouses w WHERE w.id = p_origin_warehouse_id AND w.active = true) THEN
    RAISE EXCEPTION 'Origin warehouse is invalid or inactive';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.warehouses w WHERE w.id = p_destination_warehouse_id AND w.active = true) THEN
    RAISE EXCEPTION 'Destination warehouse is invalid or inactive';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.parse_movement_items(p_items) i
    WHERE i.product_variant_id IS NULL OR i.quantity IS NULL OR i.quantity <= 0
  ) INTO v_has_invalid_items;

  IF v_has_invalid_items THEN RAISE EXCEPTION 'Invalid movement items'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.parse_movement_items(p_items) i
    GROUP BY i.product_variant_id HAVING count(*) > 1
  ) INTO v_has_duplicate_items;

  IF v_has_duplicate_items THEN RAISE EXCEPTION 'Duplicate product_variant_id in items'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.parse_movement_items(p_items) i
    LEFT JOIN public.product_variants pv ON pv.id = i.product_variant_id AND pv.active = true
    WHERE pv.id IS NULL
  ) INTO v_has_inactive_variants;

  IF v_has_inactive_variants THEN RAISE EXCEPTION 'Invalid or inactive product variant in items'; END IF;

  -- Check stock but only block if p_allow_negative is false
  FOR v_item IN
    SELECT i.product_variant_id, i.quantity FROM public.parse_movement_items(p_items) i
  LOOP
    IF p_allow_negative = false THEN
      PERFORM pg_advisory_xact_lock(hashtext(p_origin_warehouse_id::text), hashtext(v_item.product_variant_id::text));
      SELECT public.get_warehouse_variant_stock(p_origin_warehouse_id, v_item.product_variant_id)
      INTO v_available_stock;
      IF v_available_stock < v_item.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for variant % in warehouse %', v_item.product_variant_id, p_origin_warehouse_id;
      END IF;
    ELSE
      SELECT public.get_warehouse_variant_stock(p_origin_warehouse_id, v_item.product_variant_id)
      INTO v_available_stock;
      IF v_available_stock < v_item.quantity THEN
        v_stock_warning := 'Stock will go negative for one or more variants';
      END IF;
    END IF;
  END LOOP;

  INSERT INTO public.movements (movement_type, status, origin_warehouse_id, destination_warehouse_id, notes, created_by)
  VALUES ('transfer', 'in_transit', p_origin_warehouse_id, p_destination_warehouse_id, nullif(trim(p_notes), ''), p_created_by)
  RETURNING id INTO v_movement_id;

  INSERT INTO public.movement_items (movement_id, product_variant_id, quantity)
  SELECT v_movement_id, i.product_variant_id, i.quantity
  FROM public.parse_movement_items(p_items) i;

  RETURN QUERY SELECT v_movement_id, v_stock_warning;
END;
$$;