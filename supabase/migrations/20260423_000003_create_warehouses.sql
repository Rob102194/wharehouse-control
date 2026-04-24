create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint warehouses_code_not_blank check (length(trim(code)) > 0),
  constraint warehouses_name_not_blank check (length(trim(name)) > 0)
);
