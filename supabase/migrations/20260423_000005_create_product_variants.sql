create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  name text not null,
  sku text unique,
  presentation text,
  unit_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_name_not_blank check (length(trim(name)) > 0),
  constraint product_variants_sku_not_blank check (sku is null or length(trim(sku)) > 0),
  constraint product_variants_product_name_unique unique (product_id, name)
);

create index product_variants_product_id_idx on public.product_variants (product_id);
