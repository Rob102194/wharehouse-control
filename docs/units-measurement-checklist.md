# Sistema de Unidades de Medida - Segunda Unidad (kg/lt)

Objetivo: implementar sistema de segunda unidad de medida para productos medibles, permitiendo consolidación de stock por producto base, manteniendo integridad de movimientos y MVP.

## 1) Decision funcional

- [x] Segunda unidad aplica a productos medibles (`is_measurable = true`)
- [x] Flag `producto medible` decide si segunda unidad es obligatoria
- [x] Tipos de unidad principal: kg, lt, racion, pomo, lata, paquete
- [x] Segunda unidad restringida a: kg, lt (para productos medibles)
- [x] SKU auto-generado si no se proporciona
- [x] Productos existentes migrados con segunda unidad por defecto (kg)
- [x] Agregar variante a producto existente habilitado

## 2) Objetivo UX

- [ ] Modal de creación de mercancía (2 pasos)
- [ ] Validación inline para segunda unidad
- [ ] Toggle en stock: variante vs consolidado por producto
- [ ] Mostrar segunda unidad en OperationProductPicker
- [ ] Diseño responsive (admin y consulta)

## 3) Base de datos

- [ ] Agregar columna `is_measurable` a tabla `products`
  - Tipo: boolean
  - Default: true
  - Nullable: no
- [ ] Agregar columna `secondary_unit` a tabla `product_variants`
  - Tipo: text
  - Nullable: si (para productos no medibles)
- [ ] Agregar columna `secondary_quantity` a tabla `product_variants`
  - Tipo: numeric
  - Nullable: si
- [ ] Crear check constraint para valores válidos de `secondary_unit`
- [ ] Proteger nuevas columnas con RLS

## 4) Backend - Tipos TypeScript

- [ ] Actualizar `types/product.ts` con `is_measurable`
- [ ] Actualizar `types/product-variant.ts` con `secondary_unit`, `secondary_quantity`

## 5) Backend - Server Actions

- [ ] Crear/actualizar `createProduct` con validación de segunda unidad
- [ ] Crear/actualizar `createProductWithVariants` (producto + variantes en una operación)
- [ ] Crear `addVariantToProduct` (agregar variante a producto existente)
- [ ] Actualizar `updateProductVariant` con validación de segunda unidad
- [ ] Validar siempre en server (no confiar en cliente)

## 6) Backend - RPCs y Consultas

- [ ] Crear RPC `getProductStockSummary(product_id)` para cálculo consolidado
- [ ] Verificar que consultas de stock existentes no se rompen

## 7) UI - Componentes

- [ ] Crear componente Modal (si no existe)
- [ ] Crear componente `ProductFormModal` (crear mercancía)
- [ ] Crear componente `VariantFormModal` (agregar/editar variante)
- [ ] Crear toggle de vista stock (variante vs consolidado)

## 8) UI - Páginas Admin

- [ ] Actualizar `admin/products/page.tsx`
  - [ ] Botón "Nueva mercancía" abre modal
  - [ ] En cada producto: botón "+ Variante"
- [ ] Actualizar `admin/product-variants/page.tsx`
  - [ ] Mostrar segunda unidad en tabla
  - [ ] Editar variante con campos de segunda unidad

## 9) UI - Operaciones

- [ ] Actualizar `OperationProductPicker` para mostrar segunda unidad
  - Formato: "Producto - Variante (X kg)"

## 10) UI - Stock

- [ ] Actualizar página de stock
  - [ ] Vista por variante (default, igual que ahora)
  - [ ] Vista consolidada por producto (agrupar, sumar secondary_quantity)
  - [ ] Mostrar totales por segunda unidad (ej: "Total kg: 45.5")

## 11) Migración de datos

- [ ] Eliminar productos de prueba existentes (3 registros)
- [ ] Crear productos de prueba con nuevo esquema
- [ ] Verificar que variantes existentes en DB tengan valores válidos

## 12) Reglas a no romper

- [ ] Stock sigue siendo derivado de movimientos confirmados
- [ ] No se modifica lógica de movimientos existentes
- [ ] Contrato de `items_json` se mantiene igual
- [ ] Validaciones server-side para movimientos no se alteran
- [ ] RLS y políticas existentes se mantienen
- [ ] Auditoría de movimientos intacta

## 13) QA Funcional

- [ ] Crear producto medible con segunda unidad obligatoria
- [ ] Crear producto no medible (is_measurable = false) sin segunda unidad
- [ ] Agregar variante a producto existente
- [ ] Editar variante con segunda unidad
- [ ] Validar que no permite guardar sin segunda unidad si es medible
- [ ] Verificar stock consolidado muestra totales correctos
- [ ] Verificar que operaciones (entry/exit/transfer) funcionan igual
- [ ] Verificar history refleja movimientos creados
- [ ] Verificar stock refleja cambios correctamente

## 14) QA UX

- [ ] Modal de creación es fluido y fácil de usar
- [ ] Validación de segunda unidad es clara
- [ ] Toggle de vista stock funciona correctamente
- [ ] OperationProductPicker muestra segunda unidad legible
- [ ] Diseño responsive en tablet y desktop
- [ ] Acceso rápido para crear mercancía desde admin

## 15) Limpieza técnica

- [ ] Eliminar productos/variantes de prueba viejos
- [ ] Revisar imports/helpers sobrantes
- [ ] Mantener `lint` en verde
- [ ] Mantener `build` en verde
- [ ] Actualizar tipos si faltan exports

## 16) Cierre

- [ ] Feature funciona según especificación
- [ ] Sin regresiones en movimientos
- [ ] UX fluida para usuario admin
- [ ] Documentación actualizada (si aplica)