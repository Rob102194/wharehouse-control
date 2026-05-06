alter table public.products enable row level security;
alter table public.warehouses enable row level security;
alter table public.product_variants enable row level security;
alter table public.movements enable row level security;
alter table public.movement_items enable row level security;

create policy "products_select_authenticated"
on public.products
for select
to authenticated
using (true);

create policy "warehouses_select_authenticated"
on public.warehouses
for select
to authenticated
using (true);

create policy "product_variants_select_authenticated"
on public.product_variants
for select
to authenticated
using (true);

create policy "movements_select_authenticated"
on public.movements
for select
to authenticated
using (true);

create policy "movement_items_select_authenticated"
on public.movement_items
for select
to authenticated
using (true);
