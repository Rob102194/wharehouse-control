# Sistema de Unidades de Medida - Segunda Unidad (kg/lt)

Objetivo: implementar sistema de segunda unidad de medida para productos medibles, permitiendo consolidación de stock por producto base, manteniendo integridad de movimientos y MVP.

## 1) Decision funcional

- [x] Segunda unidad aplica a productos medibles (`is_measurable = true`)
- [x] Flag `producto medible` decide si segunda unidad es obligatoria
- [x] Tipos de unidad principal: kg, lt, racion, pomo, lata, paquete
- [x] Segunda unidad restringida a: kg, lt (para productos medibles)
- [x] SKU auto-generado si no se proporciona
- [x] Agregar variante a producto existente habilitado
- [ ] Productos existentes migrados (pendiente - requiere eliminar datos prueba)

## 2) Objetivo UX

- [ ] Modal de creación de mercancía (2 pasos) - pendiente
- [x] Validación inline para segunda unidad (validación server-side implementada)
- [ ] Toggle en stock: variante vs consolidado por producto - pendiente
- [x] Mostrar segunda unidad en OperationProductPicker - implementado
- [x] Diseño responsive (admin y consulta) - existente

## 3) Base de datos

- [x] Agregar columna `is_measurable` a tabla `products`
- [x] Agregar columna `secondary_unit` a tabla `product_variants`
- [x] Agregar columna `secondary_quantity` a tabla `product_variants`
- [x] Crear check constraint para valores válidos de `secondary_unit`
- [x] Proteger nuevas columnas con RLS
- [x] Crear índices para queries de consolidado

## 4) Backend - Tipos TypeScript

- [x] Actualizar `types/product.ts` con `is_measurable`
- [x] Actualizar `types/product-variant.ts` con `secondary_unit`, `secondary_quantity`, `product_is_measurable`

## 5) Backend - Server Actions

- [x] Actualizar `createProductAction` con `is_measurable`
- [x] Actualizar `createProductVariantAction` con validación de segunda unidad
- [x] Validar siempre en server (no confiar en cliente)
- [ ] Crear `updateProductVariant` con validación de segunda unidad - pendiente

## 6) Backend - RPCs y Consultas

- [x] Crear RPC `get_product_stock_summary` para cálculo consolidado
- [ ] Integrar RPC en UI de stock - pendiente

## 7) UI - Componentes

- [x] Actualizar CreateProductForm con checkbox `is_measurable`
- [x] Actualizar CreateProductVariantForm con campos de segunda unidad
- [ ] Crear componente toggle vista stock - pendiente

## 8) UI - Páginas Admin

- [x] Page products muestra `is_measurable` en query
- [x] Page product-variants:表单 muestra campos de segunda unidad
- [ ] Mostrar segunda unidad en tabla de variantes - pendiente

## 9) UI - Operaciones

- [x] Actualizar `OperationProductPicker` para mostrar segunda unidad
- Formato: "Producto - Variante (0.15 kg) [SKU]"

## 10) UI - Stock

- [x] Actualizar página de stock
  - [x] Vista por variante (default) - existente
  - [x] Vista consolidada por producto - toggle implementado
  - [x] Mostrar totales por segunda unidad - funcionando

## 11) Migración de datos

- [x] Datos existentes actualizados con segunda unidad (kg/lt)
- [x] Productos de prueba creados:
  - Atún (medible, kg): Lata 0.15kg, Paquete 0.9kg
  - Aceite de oliva (medible, lt): Botella 500ml, Botella 1L, Galón 5L
  - Arroz (medible, kg): Bolsa 1kg, Saco 25kg
  - Servilletas (NO medible): Paquete 100 unidades
- [x] RPC `get_product_stock_summary` funciona correctamente

## 12) Reglas a no romper

- [x] Stock sigue siendo derivado de movimientos confirmados
- [x] No se modifica lógica de movimientos existentes
- [x] Contrato de `items_json` se mantiene igual
- [x] Validaciones server-side para movimientos no se alteran
- [x] RLS y políticas existentes se mantienen

## 13) QA Funcional

- [ ] Crear producto medible con segunda unidad obligatoria
- [ ] Crear producto no medible (is_measurable = false) sin segunda unidad
- [ ] Agregar variante a producto existente
- [ ] Editar variante con segunda unidad
- [ ] Validar que no permite guardar sin segunda unidad si es medible
- [ ] Verificar stock consolidado muestra totales correctos
- [ ] Verificar que operaciones (entry/exit/transfer) funcionan igual

## 14) QA UX

- [ ] Validación de segunda unidad es clara
- [ ] OperationProductPicker muestra segunda unidad legible
- [ ] Diseño responsive en tablet y desktop

## 15) Limpieza técnica

- [x] Mantener `lint` en verde
- [x] Mantener `build` en verde

## 16) Cierre

- [ ] Feature funciona según especificación
- [ ] Sin regresiones en movimientos
- [ ] UX fluida para usuario admin