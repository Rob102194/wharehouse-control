# Etapa 8 - Cierre MVP y Preparacion de Release

Objetivo: asegurar que el MVP esta listo para salida controlada, sin agregar features nuevas.

## 1) Hardening final

### 1.1 Seguridad de base de datos

- [x] RLS habilitada en tablas criticas:
  - [x] `products`
  - [x] `warehouses`
  - [x] `product_variants`
  - [x] `movements`
  - [x] `movement_items`
- [x] `anon` sin acceso a tablas criticas.
- [x] `authenticated` sin `insert/update/delete` directos en tablas criticas.
- [x] RPCs criticos sin `execute` para `anon/authenticated`:
  - [x] `create_entry`
  - [x] `create_exit`
  - [x] `create_transfer`
  - [x] `receive_transfer`
  - [x] `create_adjustment`

### 1.2 Variables de entorno y secretos

- [ ] `NEXT_PUBLIC_SUPABASE_URL` correcto por entorno.
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` correcto por entorno.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` solo en servidor (nunca cliente).
- [ ] Credenciales de prueba separadas de credenciales productivas.

## 2) QA de regresion por rol

### 2.1 Admin

- [x] Puede entrar a `/operations`.
- [x] Puede entrar a `/history`.
- [x] Puede entrar a `/stock`.
- [x] Puede entrar a `/admin`.
- [ ] Puede crear ajuste en operaciones.

### 2.2 Operator

- [x] Puede entrar a `/operations`.
- [x] Puede entrar a `/history`.
- [x] Puede entrar a `/stock`.
- [x] No puede entrar a `/admin` (debe redirigir).

### 2.3 Owner

- [x] Puede entrar a `/history`.
- [x] Puede entrar a `/stock`.
- [x] No puede entrar a `/operations` (debe redirigir).
- [x] No puede entrar a `/admin` (debe redirigir).

### 2.4 Flujos de inventario criticos

- [ ] Entrada valida impacta stock e historial.
- [ ] Salida valida impacta stock e historial.
- [ ] Salida sin stock suficiente falla con error controlado.
- [ ] Transferencia valida crea estado `in_transit`.
- [ ] Recepcion exacta cambia a `received`.
- [ ] Recepcion con diferencia cambia a `received_with_incident`.
- [ ] Historial refleja actor, origen/destino, notas e incidencia.

## 3) Readiness de release

### 3.1 Calidad tecnica

- [x] `npm run lint` sin errores.
- [x] `npm run build` sin errores.
- [ ] Sin errores de runtime en rutas principales.

### 3.2 Datos iniciales

- [ ] Al menos un usuario por rol (`admin`, `operator`, `owner`) activo.
- [ ] Al menos dos almacenes activos para transferencias.
- [ ] Al menos un producto y variante activa para pruebas.

### 3.3 Go/No-Go

Definir estado final:

- [x] GO: todos los checks criticos en verde.
- [ ] NO-GO: existe fallo en seguridad, permisos o flujo critico.

## 4) Evidencia minima requerida

Adjuntar para cierre:

1. Resultado de validacion de RLS/privilegios.
2. Resultado de smoke por rol (admin/operator/owner).
3. Resultado de `lint` y `build`.
4. Lista de riesgos abiertos (si aplica).
