create or replace view public.warehouse_stock as
with stock_deltas as (
  select
    m.destination_warehouse_id as warehouse_id,
    mi.product_variant_id,
    mi.quantity as delta
  from public.movements m
  join public.movement_items mi on mi.movement_id = m.id
  where m.movement_type = 'entry'
    and m.status = 'confirmed'

  union all

  select
    m.origin_warehouse_id as warehouse_id,
    mi.product_variant_id,
    -mi.quantity as delta
  from public.movements m
  join public.movement_items mi on mi.movement_id = m.id
  where m.movement_type = 'exit'
    and m.status = 'confirmed'

  union all

  select
    m.origin_warehouse_id as warehouse_id,
    mi.product_variant_id,
    -mi.quantity as delta
  from public.movements m
  join public.movement_items mi on mi.movement_id = m.id
  where m.movement_type = 'transfer'
    and m.status in ('in_transit', 'received', 'received_with_incident')

  union all

  select
    m.destination_warehouse_id as warehouse_id,
    mi.product_variant_id,
    coalesce(mi.received_quantity, 0) as delta
  from public.movements m
  join public.movement_items mi on mi.movement_id = m.id
  where m.movement_type = 'transfer'
    and m.status in ('received', 'received_with_incident')

  union all

  select
    coalesce(m.origin_warehouse_id, m.destination_warehouse_id) as warehouse_id,
    mi.product_variant_id,
    case
      when m.adjustment_direction = 'positive' then mi.quantity
      else -mi.quantity
    end as delta
  from public.movements m
  join public.movement_items mi on mi.movement_id = m.id
  where m.movement_type = 'adjustment'
    and m.status = 'confirmed'
)
select
  warehouse_id,
  product_variant_id,
  sum(delta)::numeric(14,3) as stock
from stock_deltas
group by warehouse_id, product_variant_id;
