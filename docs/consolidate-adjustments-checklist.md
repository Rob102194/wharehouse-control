# Consolidación de ajustes: eliminar página dedicada, consolidar en stock

## Objetivo
Eliminar la página `/operations/adjustment` y consolidar todos los ajustes de stock en el modal rápido desde la página `/stock`. Los operadores también pueden ajustar stock.

## Checklist

### 1. Migración SQL: actualizar RPC `create_adjustment`
- [x] 1.1. Crear `supabase/migrations/20260522_000001_fix_adjustment_rpc.sql`
- [ ] 1.2. Permitir rol `operator` en `create_adjustment`
- [ ] 1.3. Agregar parámetro `p_allow_negative boolean default true`
- [ ] 1.4. Hacer condicional el check de stock negativo (solo bloquear si `p_allow_negative = false`)
- [ ] 1.5. Agregar warning de stock (`v_stock_warning text := null`)
- [ ] 1.6. Mantener retorno como `UUID` (no cambiar a `RETURN QUERY`)

### 2. Eliminar página de ajustes en operaciones
- [ ] 2.1. Eliminar `app/(dashboard)/operations/adjustment/page.tsx`
- [ ] 2.2. Eliminar `app/(dashboard)/operations/adjustment/adjustment-form.tsx`

### 3. Limpiar `operations/actions.ts`
- [ ] 3.1. Eliminar `createAdjustmentAction`
- [ ] 3.2. Eliminar import `createAdjustment`
- [ ] 3.3. Eliminar import `AdjustmentDirection`
- [ ] 3.4. Eliminar mapeo de error `"Only admin can create adjustments"`

### 4. Limpiar `operations/operations-hub.tsx`
- [ ] 4.1. Eliminar tarjeta "Ajuste administrativo"
- [ ] 4.2. Eliminar prop `canCreateAdjustment` de `OperationsHubProps`
- [ ] 4.3. Simplificar componente

### 5. Limpiar `operations/page.tsx`
- [ ] 5.1. Eliminar prop `canCreateAdjustment` del `<OperationsHub>`

### 6. Bug 1: Fix tabla `stock` en `stock/actions.ts`
- [ ] 6.1. Cambiar `.from("stock")` → `.from("warehouse_stock")`

### 7. Pasar rol a `StockTable`
- [ ] 7.1. Agregar prop `canAdjust` a `StockTable`
- [ ] 7.2. Ocultar botón "Ajustar" si `!canAdjust`
- [ ] 7.3. Pasar rol desde `stock/page.tsx`

### 8. Bug 2+3: Fix compensación de ajustes
- [ ] 8.1. En `server/movements.ts` → `createCompensationMovement`, agregar `p_allow_negative: true` a la llamada RPC `create_adjustment`

### 9. Verificación
- [ ] 9.1. Build sin errores: `npx next build` o `npm run build`
- [ ] 9.2. La página `/operations` ya no muestra tarjeta "Ajuste administrativo"
- [ ] 9.3. La página `/stock` muestra botón "Ajustar" para admin y operator
- [ ] 9.4. La página `/stock` NO muestra botón "Ajustar" para owner
- [ ] 9.5. Al navegar a `/operations/adjustment` → 404
