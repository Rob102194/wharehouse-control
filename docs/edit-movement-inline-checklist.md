# Checklist - Edición Inline de Operaciones en Modal

## Objetivo
Permitir editar todas las propiedades de una operación desde el modal: almacenes, items (agregar/eliminar/modificar cantidades), notas. Usando estrategia de movimiento compensatorio + nuevo movimiento.

---

## 1) UI - Modal de Edición

### 1.1 Estructura del Modal
- [x] Rediseñar `movement-detail-modal.tsx` completamente
- [x] Agregar estados locales para modo edición (isEditing, editReason)
- [x] Separar vista de solo lectura vs modo edición

### 1.2 Selector de Almacenes
- [x] Agregar `<select>` para origen (todos los almacenes activos)
- [x] Agregar `<select>` para destino (solo para transfers)
- [x] Validar origen ≠ destino
- [x] Deshabilitar destino para entry/exit

### 1.3 Tabla de Items Editable
- [x] Convertir tabla de items en editable
- [x] Input de cantidad editable por fila
- [x] Botón eliminar (🗑️) por cada item
- [x] Validar cantidad > 0

### 1.4 Agregar Nuevos Items
- [x] Agregar botón "+ Agregar producto"
- [x] Crear buscador de variantes (solo activas)
- [x] Input de cantidad para nuevo producto
- [x] Validar no duplicar producto existente

### 1.5 Validaciones en UI
- [ ] Mostrar warning si stock resultante será negativo
- [x] Validar reason de edición obligatorio
- [x] Botón guardar solo habilitado si todo válido

### 1.6 Badges de Estado
- [x] Mostrar badge "En tránsito" si status = in_transit
- [x] Mostrar badge "Editado" con conteo

---

## 2) Server Action - Lógica de Compensación

### 2.1 Nueva Acción
- [x] Crear `editMovementWithCompensationAction` en `actions.ts`
- [x] Recibir: movement_id, origin_warehouse_id, destination_warehouse_id, items[], notes, edit_reason

### 2.2 Validaciones
- [x] Validar movement_id existe
- [x] Validar edit_reason obligatorio (min 3 caracteres)
- [x] Validar origen ≠ destino (para transfers)
- [x] Validar items con product_variant_id y quantity > 0
- [x] Validar no duplicar product_variant_id en items
- [x] Validar variantes activas

### 2.3 Crear Movimiento Compensatorio
- [x] Crear función `createCompensationMovement` en `server/movements.ts`
- [x] entry → crear exit con mismos items (devuelve stock a origen)
- [x] exit → crear entry con mismos items (devuelve stock a origen)
- [x] transfer → crear transfer inversa
- [x] adjustment → crear adjustment inversa
- [x] Usar `p_allow_negative: true` para permitir negativo

### 2.4 Crear Nuevo Movimiento
- [x] Usar funciones RPC existentes: createEntry, createExit, createTransfer
- [x] Mantener movement_type original
- [x] Usar nuevos valores de almacenes e items
- [x] Incluir notas proporcionadas

### 2.5 Auditoría
- [x] Registrar en edit_history:
  - [x] `original_movement_id`
  - [x] `compensation_movement_id`
  - [x] `new_movement_id`
  - [x] `edit_reason`
  - [x] `edited_at` (timestamp)

### 2.6 Revalidación
- [x] Revalidar `/history`
- [x] Revalidar `/stock`

---

## 3) Tipos TypeScript

### 3.1 Actualizar Tipos
- [x] Crear tipo `EditableMovementItem` para UI
- [x] Crear tipo `MovementEditRequest` para server action

---

## 4) Componentes Reutilizables

### 4.1 Product Picker
- [x] Crear endpoint `/api/product-variants` para buscar variantes
- [x] Filtrar solo variantes activas
- [x] Retornar variant_id + variant_name + sku

---

## 5) Testing y Validación

### 5.1 Pruebas Funcionales
- [ ] Editar solo notas
- [ ] Cambiar origen/destino (transferencia)
- [ ] Modificar cantidades de items
- [ ] Eliminar items existentes
- [ ] Agregar nuevos items
- [ ] Editing operación en tránsito
- [ ] Verificar stock después de edición

### 5.2 Validaciones UI
- [ ] Warning de stock negativo
- [x] Validar reason obligatorio
- [x] Validar no duplicar productos

### 5.3 Build
- [x] Verificar `npm run build` pasa

---

## 6) Reglas de Negocio a Respetar

- [x] No duplicar productos en items
- [x] Solo variantes activas al buscar/agregar
- [x] Stock puede quedar negativo (con warning - pendiente)
- [ ] Mantener fecha original del movimiento
- [x] Auditoría completa: original + compensación + nuevo
- [x] Razón de edición obligatoria y registrada

---

## 7) Eliminación de Operaciones

### 7.1 UI - Modal de Confirmación
- [x] Agregar botón "Eliminar operación" en modal
- [x] Modal de confirmación con razón obligatoria
- [x] Validar razón antes de confirmar

### 7.2 Server Action
- [x] Crear deleteMovementWithCompensationAction
- [x] Validar movement_id y delete_reason
- [x] Crear compensación (reutilizar función existente)
- [x] Actualizar edit_history con campos de eliminación
- [x] Revalidar /history y /stock

### 7.3 Testing
- [ ] Eliminar operación completa
- [ ] Verificar stock ajustado
- [ ] Verificar movimiento marcado en historial