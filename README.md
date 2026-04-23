# Warehouse Control MVP

Base tecnica del MVP para control de movimientos de inventario en restaurantes.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres

## Requisitos

- Node.js 20+
- npm 10+

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar valores reales.

- `SUPABASE_SERVICE_ROLE_KEY` se usa solo en servidor para resolver `username -> email`.

## Acceso MVP

- El login visible usa `username + contrasena`.
- Supabase Auth autentica internamente por email.
- Cada usuario requiere fila en `public.profiles` con `id` igual a `auth.users.id`.

### Alta manual de usuarios (MVP)

1. Crear usuario en Supabase Auth (email + password).
2. Insertar fila en `public.profiles` con el mismo `id` de `auth.users`.
3. Definir `username`, `role` y `active = true`.
4. Completar `email` en `profiles` para habilitar login por username.

### Alta desde la aplicacion (admin)

- El modulo `Admin` incluye alta de usuario interno.
- La accion crea primero el usuario en Supabase Auth y luego inserta `profiles`.
- Si falla la insercion en `profiles`, se revierte el usuario de Auth para evitar datos inconsistentes.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
