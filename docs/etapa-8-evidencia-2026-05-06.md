# Evidencia Etapa 8 - 2026-05-06

## 1) Seguridad de base de datos

Validacion SQL ejecutada:

- RLS activa en tablas criticas (`products`, `warehouses`, `product_variants`, `movements`, `movement_items`, `profiles`).
- Privilegios para `anon` y `authenticated` reducidos a minimo:
  - `anon`: sin privilegios en tablas criticas.
  - `authenticated`: solo `SELECT` en `products`, `warehouses`, `product_variants`, `movements`, `movement_items`, `profiles`.
- RPCs criticos sin `EXECUTE` para `anon`/`authenticated` (`create_entry`, `create_exit`, `create_transfer`, `receive_transfer`, `create_adjustment`).

## 2) Smoke test por rol en app

Entorno probado: `http://localhost:3000`

### Admin (`adminprueba`)

- `/operations`: OK
- `/history`: OK
- `/stock`: OK
- `/admin`: OK

### Operator (`operador`)

- `/operations`: OK
- `/history`: OK
- `/stock`: OK
- `/admin`: bloqueado (redirige a `/operations`): OK

### Owner (`ownerprueba`)

- `/history`: OK
- `/stock`: OK
- `/operations`: bloqueado (redirige a `/stock`): OK
- `/admin`: bloqueado (redirige a `/stock`): OK

## 3) Calidad tecnica

- `npm run lint`: OK
- `npm run build`: OK

Nota: aparecen warnings de carga de `@next/swc-win32-x64-msvc` en este entorno Windows, pero no bloquean lint/build ni funcionamiento validado.

## 4) Estado Go/No-Go

- Estado: **GO**
- Motivo: permisos endurecidos, roles validados y build/lint en verde.
