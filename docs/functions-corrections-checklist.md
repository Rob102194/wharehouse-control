# Checklist - Correcciones de Funciones

Objetivo: Permitir modificación de stock, edición de operaciones y manejo de stocks negativos con workflow ágil y dinámico.

## 1) Modificación de AGENTS.md

- [x] Actualizar regla: "Never treat free manual stock editing as the source of truth"
  - Nueva: "Stock editable con auditoría y razón obligatoria"
- [x] Actualizar regla: "Adjustment: admin-only"
  - Nueva: "Operadores y admins pueden ajustar stock"
- [x] Actualizar regla: "No exit may reduce stock below available quantity"
  - Nueva: "Permitido con warning visible en tiempo real"
- [x] Actualizar regla: "Confirmed movements must be immutable"
  - Nueva: "Editable con auditoría, mantiene fecha original"

## 2) Fase 1 - Modificación de Stock (Desde Vista de Stock)

### 2.1 UI - Tabla de Stock
- [x] Agregar columna "Acción" en `app/(dashboard)/stock/page.tsx`
- [x] Agregar botón "Ajustar" por cada fila de stock

### 2.2 Componente Modal
- [x] Crear `app/(dashboard)/stock/stock-adjustment-modal.tsx`
- [x] Fields: nueva cantidad (input), razón (textarea, obligatoria)
- [x] Integrar con server action

### 2.3 Server Action
- [x] Crear `app/(dashboard)/stock/actions.ts`
- [x] Implementar `quickStockAdjustmentAction`
- [x] Validar razón obligatoria
- [x] Registrar usuario que hace el ajuste
- [x] Crear movimiento tipo "adjustment" automáticamente
- [x] Revalidar paths: /stock, /history

### 2.4 Historial de Ajustes
- [x] Actualizar vista de historial para mostrar ajustes rápidos
- [x] Agregar indicador visual de tipo "ajuste de inventario"

## 3) Fase 2 - Edición de Operaciones

### 3.1 UI - Botón en Historial
- [x] Modificar `app/(dashboard)/history/page.tsx`
- [x] Agregar botón "Editar" en cada fila de operación

### 3.2 Página de Edición
- [x] Crear `app/(dashboard)/history/[movementId]/edit/page.tsx`
- [x] Cargar datos de la operación original
- [x] Formulario editable: notas, razón, incidente
- [x] Mantener fecha/hora original (readonly)
- [x] Botón guardar y cancelar

### 3.3 Server Action
- [x] Crear `app/(dashboard)/history/[movementId]/edit/actions.ts`
- [x] Implementar `updateMovementAction`
- [x] Validar datos nuevos
- [x] Registrar "operación editada" en edit_history
- [x] Permitir consulta de versión anterior

### 3.4 Vista de Detalle
- [ ] Actualizar página de detalle de operación
- [ ] Mostrar indicador de "editada"
- [ ] Agregar link a versión anterior

## 4) Fase 3 - Stock Negativo

### 4.1 Server Actions - RPCs
- [x] Modificar `server/movements.ts` (o RPCs existentes)
- [x] Cambiar validación de exit: de "bloquear" a "permitir"
- [x] Cambiar validación de transfer dispatch: de "bloquear" a "permitir"

### 4.2 UI - Warning en Operaciones
- [x] Modificar `app/(dashboard)/operations/components/operation-form-feedback.tsx`
- [x] Detectar cuando operación deja stock negativo
- [x] Agregar badge rojo "Stock negativo" en feedback

### 4.3 UI - Alerta en Vista de Stock
- [x] Modificar `app/(dashboard)/stock/page.tsx`
- [x] Agregar columna "Alerta" con color para stocks negativos
- [x] Aplicar estilo visual (rojo/fondo rojo)

### 4.4 Vista Consolidada
- [x] Modificar `app/(dashboard)/stock/stock-view-toggle.tsx`
- [x] Mostrar alerta en productos con stock negativo

## 5) QA y Limpieza

### 5.1 Pruebas Funcionales
- [ ] Test: Ajuste de stock desde vista de stock
- [ ] Test: Edición de operación (variante, cantidad, almacén)
- [ ] Test: Operación que deja stock negativo muestra warning
- [ ] Test: Vista de stock muestra alertas de negativo
- [ ] Test: Vista consolidada muestra alertas de negativo

### 5.2 Validaciones
- [x] Verificar que lint pasa
- [x] Verificar que build pasa
- [ ] Verificar que RLS sigue funcionando
- [x] Verificar auditoría de cambios

### 5.3 Limpieza
- [ ] Eliminar código no usado
- [ ] Verificar imports
- [ ] Documentar cambios si es necesario

## 6) Reglas de Negocio a Respetar

- [x] Toda modificación de stock debe tener razón
- [x] Toda edición de operación debe mantener fecha original
- [x] Stock negativo debe mostrar warning claro
- [x] Auditoría: registrar usuario y timestamp en modificaciones
- [x] Operaciones editadas deben ser consultables con versión anterior