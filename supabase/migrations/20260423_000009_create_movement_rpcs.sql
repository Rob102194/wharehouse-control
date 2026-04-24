create or replace function public.parse_movement_items(p_items jsonb)
returns table(product_variant_id uuid, quantity numeric(14,3))
language sql
as $$
  select
    (item->>'product_variant_id')::uuid as product_variant_id,
    (item->>'quantity')::numeric(14,3) as quantity
  from jsonb_array_elements(p_items) as item
$$;

create or replace function public.parse_received_items(p_items jsonb)
returns table(product_variant_id uuid, received_quantity numeric(14,3))
language sql
as $$
  select
    (item->>'product_variant_id')::uuid as product_variant_id,
    (item->>'received_quantity')::numeric(14,3) as received_quantity
  from jsonb_array_elements(p_items) as item
$$;

create or replace function public.get_warehouse_variant_stock(
  p_warehouse_id uuid,
  p_product_variant_id uuid
)
returns numeric(14,3)
language sql
stable
as $$
  select coalesce((
    select ws.stock
    from public.warehouse_stock ws
    where ws.warehouse_id = p_warehouse_id
      and ws.product_variant_id = p_product_variant_id
  ), 0)::numeric(14,3)
$$;

create or replace function public.create_entry(
  p_destination_warehouse_id uuid,
  p_created_by uuid,
  p_items jsonb,
  p_notes text default null
)
returns uuid
language plpgsql
as $$
declare
  v_movement_id uuid;
  v_actor_role text;
  v_actor_active boolean;
  v_has_invalid_items boolean;
  v_has_duplicate_items boolean;
  v_has_inactive_variants boolean;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Items are required';
  end if;

  select p.role, p.active
  into v_actor_role, v_actor_active
  from public.profiles p
  where p.id = p_created_by;

  if v_actor_role is null or v_actor_active is not true then
    raise exception 'Invalid actor profile';
  end if;

  if v_actor_role not in ('operator', 'admin') then
    raise exception 'Actor role cannot create entries';
  end if;

  if not exists (
    select 1
    from public.warehouses w
    where w.id = p_destination_warehouse_id
      and w.active = true
  ) then
    raise exception 'Destination warehouse is invalid or inactive';
  end if;

  select exists (
    select 1
    from public.parse_movement_items(p_items) i
    where i.product_variant_id is null
      or i.quantity is null
      or i.quantity <= 0
  )
  into v_has_invalid_items;

  if v_has_invalid_items then
    raise exception 'Invalid movement items';
  end if;

  select exists (
    select 1
    from public.parse_movement_items(p_items) i
    group by i.product_variant_id
    having count(*) > 1
  )
  into v_has_duplicate_items;

  if v_has_duplicate_items then
    raise exception 'Duplicate product_variant_id in items';
  end if;

  select exists (
    select 1
    from public.parse_movement_items(p_items) i
    left join public.product_variants pv
      on pv.id = i.product_variant_id
     and pv.active = true
    where pv.id is null
  )
  into v_has_inactive_variants;

  if v_has_inactive_variants then
    raise exception 'Invalid or inactive product variant in items';
  end if;

  insert into public.movements (
    movement_type,
    status,
    destination_warehouse_id,
    notes,
    created_by
  )
  values (
    'entry',
    'confirmed',
    p_destination_warehouse_id,
    nullif(trim(p_notes), ''),
    p_created_by
  )
  returning id into v_movement_id;

  insert into public.movement_items (movement_id, product_variant_id, quantity)
  select v_movement_id, i.product_variant_id, i.quantity
  from public.parse_movement_items(p_items) i;

  return v_movement_id;
end;
$$;

create or replace function public.create_exit(
  p_origin_warehouse_id uuid,
  p_created_by uuid,
  p_items jsonb,
  p_notes text default null
)
returns uuid
language plpgsql
as $$
declare
  v_movement_id uuid;
  v_actor_role text;
  v_actor_active boolean;
  v_has_invalid_items boolean;
  v_has_duplicate_items boolean;
  v_has_inactive_variants boolean;
  v_item record;
  v_available_stock numeric(14,3);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Items are required';
  end if;

  select p.role, p.active
  into v_actor_role, v_actor_active
  from public.profiles p
  where p.id = p_created_by;

  if v_actor_role is null or v_actor_active is not true then
    raise exception 'Invalid actor profile';
  end if;

  if v_actor_role not in ('operator', 'admin') then
    raise exception 'Actor role cannot create exits';
  end if;

  if not exists (
    select 1
    from public.warehouses w
    where w.id = p_origin_warehouse_id
      and w.active = true
  ) then
    raise exception 'Origin warehouse is invalid or inactive';
  end if;

  select exists (
    select 1
    from public.parse_movement_items(p_items) i
    where i.product_variant_id is null
      or i.quantity is null
      or i.quantity <= 0
  )
  into v_has_invalid_items;

  if v_has_invalid_items then
    raise exception 'Invalid movement items';
  end if;

  select exists (
    select 1
    from public.parse_movement_items(p_items) i
    group by i.product_variant_id
    having count(*) > 1
  )
  into v_has_duplicate_items;

  if v_has_duplicate_items then
    raise exception 'Duplicate product_variant_id in items';
  end if;

  select exists (
    select 1
    from public.parse_movement_items(p_items) i
    left join public.product_variants pv
      on pv.id = i.product_variant_id
     and pv.active = true
    where pv.id is null
  )
  into v_has_inactive_variants;

  if v_has_inactive_variants then
    raise exception 'Invalid or inactive product variant in items';
  end if;

  for v_item in
    select i.product_variant_id, i.quantity
    from public.parse_movement_items(p_items) i
  loop
    perform pg_advisory_xact_lock(hashtext(p_origin_warehouse_id::text), hashtext(v_item.product_variant_id::text));

    select public.get_warehouse_variant_stock(p_origin_warehouse_id, v_item.product_variant_id)
    into v_available_stock;

    if v_available_stock < v_item.quantity then
      raise exception 'Insufficient stock for variant % in warehouse %', v_item.product_variant_id, p_origin_warehouse_id;
    end if;
  end loop;

  insert into public.movements (
    movement_type,
    status,
    origin_warehouse_id,
    notes,
    created_by
  )
  values (
    'exit',
    'confirmed',
    p_origin_warehouse_id,
    nullif(trim(p_notes), ''),
    p_created_by
  )
  returning id into v_movement_id;

  insert into public.movement_items (movement_id, product_variant_id, quantity)
  select v_movement_id, i.product_variant_id, i.quantity
  from public.parse_movement_items(p_items) i;

  return v_movement_id;
end;
$$;

create or replace function public.create_transfer(
  p_origin_warehouse_id uuid,
  p_destination_warehouse_id uuid,
  p_created_by uuid,
  p_items jsonb,
  p_notes text default null
)
returns uuid
language plpgsql
as $$
declare
  v_movement_id uuid;
  v_actor_role text;
  v_actor_active boolean;
  v_has_invalid_items boolean;
  v_has_duplicate_items boolean;
  v_has_inactive_variants boolean;
  v_item record;
  v_available_stock numeric(14,3);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Items are required';
  end if;

  if p_origin_warehouse_id = p_destination_warehouse_id then
    raise exception 'Origin and destination warehouses must be different';
  end if;

  select p.role, p.active
  into v_actor_role, v_actor_active
  from public.profiles p
  where p.id = p_created_by;

  if v_actor_role is null or v_actor_active is not true then
    raise exception 'Invalid actor profile';
  end if;

  if v_actor_role not in ('operator', 'admin') then
    raise exception 'Actor role cannot create transfers';
  end if;

  if not exists (
    select 1
    from public.warehouses w
    where w.id = p_origin_warehouse_id
      and w.active = true
  ) then
    raise exception 'Origin warehouse is invalid or inactive';
  end if;

  if not exists (
    select 1
    from public.warehouses w
    where w.id = p_destination_warehouse_id
      and w.active = true
  ) then
    raise exception 'Destination warehouse is invalid or inactive';
  end if;

  select exists (
    select 1
    from public.parse_movement_items(p_items) i
    where i.product_variant_id is null
      or i.quantity is null
      or i.quantity <= 0
  )
  into v_has_invalid_items;

  if v_has_invalid_items then
    raise exception 'Invalid movement items';
  end if;

  select exists (
    select 1
    from public.parse_movement_items(p_items) i
    group by i.product_variant_id
    having count(*) > 1
  )
  into v_has_duplicate_items;

  if v_has_duplicate_items then
    raise exception 'Duplicate product_variant_id in items';
  end if;

  select exists (
    select 1
    from public.parse_movement_items(p_items) i
    left join public.product_variants pv
      on pv.id = i.product_variant_id
     and pv.active = true
    where pv.id is null
  )
  into v_has_inactive_variants;

  if v_has_inactive_variants then
    raise exception 'Invalid or inactive product variant in items';
  end if;

  for v_item in
    select i.product_variant_id, i.quantity
    from public.parse_movement_items(p_items) i
  loop
    perform pg_advisory_xact_lock(hashtext(p_origin_warehouse_id::text), hashtext(v_item.product_variant_id::text));

    select public.get_warehouse_variant_stock(p_origin_warehouse_id, v_item.product_variant_id)
    into v_available_stock;

    if v_available_stock < v_item.quantity then
      raise exception 'Insufficient stock for variant % in warehouse %', v_item.product_variant_id, p_origin_warehouse_id;
    end if;
  end loop;

  insert into public.movements (
    movement_type,
    status,
    origin_warehouse_id,
    destination_warehouse_id,
    notes,
    created_by
  )
  values (
    'transfer',
    'in_transit',
    p_origin_warehouse_id,
    p_destination_warehouse_id,
    nullif(trim(p_notes), ''),
    p_created_by
  )
  returning id into v_movement_id;

  insert into public.movement_items (movement_id, product_variant_id, quantity)
  select v_movement_id, i.product_variant_id, i.quantity
  from public.parse_movement_items(p_items) i;

  return v_movement_id;
end;
$$;

create or replace function public.receive_transfer(
  p_movement_id uuid,
  p_received_by uuid,
  p_items jsonb,
  p_incident_note text default null
)
returns uuid
language plpgsql
as $$
declare
  v_actor_role text;
  v_actor_active boolean;
  v_movement record;
  v_has_invalid_items boolean;
  v_has_duplicate_items boolean;
  v_has_missing_items boolean;
  v_has_extra_items boolean;
  v_has_exceeding_items boolean;
  v_has_differences boolean;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Received items are required';
  end if;

  select p.role, p.active
  into v_actor_role, v_actor_active
  from public.profiles p
  where p.id = p_received_by;

  if v_actor_role is null or v_actor_active is not true then
    raise exception 'Invalid actor profile';
  end if;

  if v_actor_role not in ('operator', 'admin') then
    raise exception 'Actor role cannot receive transfers';
  end if;

  select m.*
  into v_movement
  from public.movements m
  where m.id = p_movement_id
    and m.movement_type = 'transfer'
  for update;

  if not found then
    raise exception 'Transfer movement not found';
  end if;

  if v_movement.status <> 'in_transit' then
    raise exception 'Transfer is not in transit';
  end if;

  select exists (
    select 1
    from public.parse_received_items(p_items) i
    where i.product_variant_id is null
      or i.received_quantity is null
      or i.received_quantity < 0
  )
  into v_has_invalid_items;

  if v_has_invalid_items then
    raise exception 'Invalid received items';
  end if;

  select exists (
    select 1
    from public.parse_received_items(p_items) i
    group by i.product_variant_id
    having count(*) > 1
  )
  into v_has_duplicate_items;

  if v_has_duplicate_items then
    raise exception 'Duplicate product_variant_id in received items';
  end if;

  select exists (
    select 1
    from public.movement_items mi
    where mi.movement_id = p_movement_id
      and not exists (
        select 1
        from public.parse_received_items(p_items) ri
        where ri.product_variant_id = mi.product_variant_id
      )
  )
  into v_has_missing_items;

  if v_has_missing_items then
    raise exception 'Missing movement items in transfer receipt';
  end if;

  select exists (
    select 1
    from public.parse_received_items(p_items) ri
    where not exists (
      select 1
      from public.movement_items mi
      where mi.movement_id = p_movement_id
        and mi.product_variant_id = ri.product_variant_id
    )
  )
  into v_has_extra_items;

  if v_has_extra_items then
    raise exception 'Received items contain unknown product variants';
  end if;

  select exists (
    select 1
    from public.parse_received_items(p_items) ri
    join public.movement_items mi
      on mi.movement_id = p_movement_id
     and mi.product_variant_id = ri.product_variant_id
    where ri.received_quantity > mi.quantity
  )
  into v_has_exceeding_items;

  if v_has_exceeding_items then
    raise exception 'Received quantity cannot exceed dispatched quantity';
  end if;

  update public.movement_items mi
  set received_quantity = ri.received_quantity
  from public.parse_received_items(p_items) ri
  where mi.movement_id = p_movement_id
    and mi.product_variant_id = ri.product_variant_id;

  select exists (
    select 1
    from public.movement_items mi
    where mi.movement_id = p_movement_id
      and mi.received_quantity is distinct from mi.quantity
  )
  into v_has_differences;

  update public.movements
  set
    status = case when v_has_differences then 'received_with_incident' else 'received' end,
    received_by = p_received_by,
    received_at = now(),
    incident_note = case when v_has_differences then nullif(trim(p_incident_note), '') else null end
  where id = p_movement_id;

  return p_movement_id;
end;
$$;

create or replace function public.create_adjustment(
  p_warehouse_id uuid,
  p_created_by uuid,
  p_adjustment_direction text,
  p_adjustment_reason text,
  p_items jsonb,
  p_notes text default null
)
returns uuid
language plpgsql
as $$
declare
  v_movement_id uuid;
  v_actor_role text;
  v_actor_active boolean;
  v_has_invalid_items boolean;
  v_has_duplicate_items boolean;
  v_has_inactive_variants boolean;
  v_item record;
  v_available_stock numeric(14,3);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Items are required';
  end if;

  if p_adjustment_direction not in ('positive', 'negative') then
    raise exception 'Invalid adjustment direction';
  end if;

  if p_adjustment_reason is null or length(trim(p_adjustment_reason)) = 0 then
    raise exception 'Adjustment reason is required';
  end if;

  select p.role, p.active
  into v_actor_role, v_actor_active
  from public.profiles p
  where p.id = p_created_by;

  if v_actor_role is null or v_actor_active is not true then
    raise exception 'Invalid actor profile';
  end if;

  if v_actor_role <> 'admin' then
    raise exception 'Only admin can create adjustments';
  end if;

  if not exists (
    select 1
    from public.warehouses w
    where w.id = p_warehouse_id
      and w.active = true
  ) then
    raise exception 'Warehouse is invalid or inactive';
  end if;

  select exists (
    select 1
    from public.parse_movement_items(p_items) i
    where i.product_variant_id is null
      or i.quantity is null
      or i.quantity <= 0
  )
  into v_has_invalid_items;

  if v_has_invalid_items then
    raise exception 'Invalid movement items';
  end if;

  select exists (
    select 1
    from public.parse_movement_items(p_items) i
    group by i.product_variant_id
    having count(*) > 1
  )
  into v_has_duplicate_items;

  if v_has_duplicate_items then
    raise exception 'Duplicate product_variant_id in items';
  end if;

  select exists (
    select 1
    from public.parse_movement_items(p_items) i
    left join public.product_variants pv
      on pv.id = i.product_variant_id
     and pv.active = true
    where pv.id is null
  )
  into v_has_inactive_variants;

  if v_has_inactive_variants then
    raise exception 'Invalid or inactive product variant in items';
  end if;

  if p_adjustment_direction = 'negative' then
    for v_item in
      select i.product_variant_id, i.quantity
      from public.parse_movement_items(p_items) i
    loop
      perform pg_advisory_xact_lock(hashtext(p_warehouse_id::text), hashtext(v_item.product_variant_id::text));

      select public.get_warehouse_variant_stock(p_warehouse_id, v_item.product_variant_id)
      into v_available_stock;

      if v_available_stock < v_item.quantity then
        raise exception 'Insufficient stock for variant % in warehouse %', v_item.product_variant_id, p_warehouse_id;
      end if;
    end loop;
  end if;

  insert into public.movements (
    movement_type,
    status,
    origin_warehouse_id,
    adjustment_direction,
    adjustment_reason,
    notes,
    created_by
  )
  values (
    'adjustment',
    'confirmed',
    p_warehouse_id,
    p_adjustment_direction,
    trim(p_adjustment_reason),
    nullif(trim(p_notes), ''),
    p_created_by
  )
  returning id into v_movement_id;

  insert into public.movement_items (movement_id, product_variant_id, quantity)
  select v_movement_id, i.product_variant_id, i.quantity
  from public.parse_movement_items(p_items) i;

  return v_movement_id;
end;
$$;
