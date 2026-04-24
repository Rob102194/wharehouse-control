create table public.movements (
  id uuid primary key default gen_random_uuid(),
  movement_type text not null,
  status text not null,
  origin_warehouse_id uuid references public.warehouses (id) on delete restrict,
  destination_warehouse_id uuid references public.warehouses (id) on delete restrict,
  adjustment_direction text,
  adjustment_reason text,
  notes text,
  incident_note text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz not null default now(),
  received_by uuid references public.profiles (id) on delete restrict,
  received_at timestamptz,
  constraint movements_type_check check (movement_type in ('entry', 'exit', 'transfer', 'adjustment')),
  constraint movements_status_check check (status in ('confirmed', 'in_transit', 'received', 'received_with_incident')),
  constraint movements_adjustment_direction_check check (
    adjustment_direction is null or adjustment_direction in ('positive', 'negative')
  ),
  constraint movements_received_pair_check check (
    (received_by is null and received_at is null) or (received_by is not null and received_at is not null)
  ),
  constraint movements_transfer_fields_only_check check (
    movement_type = 'transfer' or (received_by is null and received_at is null and incident_note is null)
  ),
  constraint movements_entry_shape_check check (
    movement_type <> 'entry' or (
      status = 'confirmed'
      and destination_warehouse_id is not null
      and origin_warehouse_id is null
      and adjustment_direction is null
      and adjustment_reason is null
    )
  ),
  constraint movements_exit_shape_check check (
    movement_type <> 'exit' or (
      status = 'confirmed'
      and origin_warehouse_id is not null
      and destination_warehouse_id is null
      and adjustment_direction is null
      and adjustment_reason is null
    )
  ),
  constraint movements_transfer_shape_check check (
    movement_type <> 'transfer' or (
      status in ('in_transit', 'received', 'received_with_incident')
      and origin_warehouse_id is not null
      and destination_warehouse_id is not null
      and origin_warehouse_id <> destination_warehouse_id
      and adjustment_direction is null
      and adjustment_reason is null
      and (
        (status = 'in_transit' and received_by is null and received_at is null)
        or (status in ('received', 'received_with_incident') and received_by is not null and received_at is not null)
      )
    )
  ),
  constraint movements_adjustment_shape_check check (
    movement_type <> 'adjustment' or (
      status = 'confirmed'
      and (
        (origin_warehouse_id is not null and destination_warehouse_id is null)
        or (origin_warehouse_id is null and destination_warehouse_id is not null)
      )
      and adjustment_direction is not null
      and adjustment_reason is not null
      and length(trim(adjustment_reason)) > 0
    )
  )
);

create index movements_created_at_idx on public.movements (created_at);
create index movements_type_idx on public.movements (movement_type);
create index movements_status_idx on public.movements (status);
create index movements_origin_warehouse_idx on public.movements (origin_warehouse_id);
create index movements_destination_warehouse_idx on public.movements (destination_warehouse_id);
create index movements_created_by_idx on public.movements (created_by);
