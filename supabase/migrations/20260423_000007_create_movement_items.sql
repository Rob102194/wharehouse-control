create table public.movement_items (
  id uuid primary key default gen_random_uuid(),
  movement_id uuid not null references public.movements (id) on delete cascade,
  product_variant_id uuid not null references public.product_variants (id) on delete restrict,
  quantity numeric(14,3) not null,
  received_quantity numeric(14,3),
  created_at timestamptz not null default now(),
  constraint movement_items_quantity_positive_check check (quantity > 0),
  constraint movement_items_received_quantity_range_check check (
    received_quantity is null or (received_quantity >= 0 and received_quantity <= quantity)
  ),
  constraint movement_items_movement_variant_unique unique (movement_id, product_variant_id)
);

create index movement_items_movement_id_idx on public.movement_items (movement_id);
create index movement_items_product_variant_id_idx on public.movement_items (product_variant_id);
