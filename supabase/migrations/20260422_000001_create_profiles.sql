create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  email text unique,
  full_name text,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('operator', 'admin', 'owner')),
  constraint profiles_username_not_blank check (length(trim(username)) > 0),
  constraint profiles_email_not_blank check (email is null or length(trim(email)) > 0)
);
