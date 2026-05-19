# Checklist - Mejora de Interfaz de Historial

## Objetivo
Mejorar la accesibilidad móvil del historial, mostrar nombres amigables con iconos, badges de incidencia/editado visibles, y modal de detalles con edición inline.

---

## 1) Server-Side - Paginación y Tipos

### 1.1 Tipos TypeScript
- [x] Modificar `types/movement.ts`
- [x] Agregar campo `edit_count: number` a `MovementHistoryRow`
- [x] Agregar campo `is_incident: boolean` a `MovementHistoryRow` (calculado desde status)

### 1.2 Paginación en Server
- [x] Modificar `server/movements.ts`
- [x] Agregar parámetros `offset` y `limit` a `listMovementsForHistoryWithFilters`
- [x] Incluir consulta de `edit_history` para contar ediciones
- [x] Retornar también `total_count` para paginación

---

## 2) UI - Página Principal

### 2.1 Filtros Sticky
- [x] Modificar `app/(dashboard)/history/page.tsx`
- [x] Agregar clase `sticky top-0 z-10 bg-white` al contenedor de filtros
- [x] Agregar controls de paginación (prev/next/page info)
- [x] Integrar query params para `page` y `limit`

### 2.2 Mapeo de Tipos
- [x] Crear mapping de `movement_type` a nombre amigable + icono
- [x] entry → 📦 Compra
- [x] exit → 🚀 Despacho
- [x] transfer → ↔️ Transferencia
- [x] adjustment → ✏️ Ajuste

### 2.3 Badges Visibles
- [x] Modificar `app/(dashboard)/history/history-table.tsx`
- [x] Agregar badge "Incidencia" (rojo) si `is_incident`
- [x] Agregar badge "Editado" (gris) si `edit_count > 0`
- [x] Estilizar badges con Tailwind (small, rounded)

### 2.4 Diseño Responsive
- [x] Converter table a lista de cards en móvil (< 768px)
- [x] Mantener tabla en desktop (≥ 768px)
- [x] Agregar evento click en cada fila para abrir modal

---

## 3) Modal de Detalles

### 3.1 Componente Modal
- [x] Crear `app/(dashboard)/history/movement-detail-modal.tsx`
- [x] Props: movement, warehouses, isOpen, onClose
- [x] Mostrar todos los campos: fecha, tipo, origen, destino, actor, notas, items
- [x] Mostrar badges de incidencia/editado
- [x] Mostrar historial de ediciones (si existe)

### 3.2 Edición Inline
- [x] Agregar formulario dentro del modal
- [x] Campos editables: notas, adjustment_reason (si aplica), incident_note
- [x] Campo "Razón de edición" obligatorio
- [x] Integrar con server action

---

## 4) Server Action

### 4.1 Action para Edición
- [x] Crear `app/(dashboard)/history/actions.ts`
- [x] Implementar `updateMovementFromModalAction`
- [x] Validar razón obligatoria
- [x] Guardar en `edit_history` con timestamp y usuario
- [x] Revalidar `/history`

---

## 5) Integración

### 5.1 Conectar Modal con Tabla
- [x] Modificar `history-table.tsx`
- [x] Agregar estado para modal (selectedMovement, isOpen)
- [x] Abrir modal al click en fila
- [x] Cerrar modal después de guardar

---

## 6) QA y Validaciones

### 6.1 Testing
- [ ] Verificar que filtros sticky funcionan
- [ ] Verificar paginación (prev/next)
- [ ] Verificar nombres amigables con iconos
- [ ] Verificar badges visibles
- [ ] Verificar modal se abre al click
- [ ] Verificar edición inline funciona
- [ ] Verificar responsive en móvil

### 6.2 Build
- [x] Verificar `npm run build` pasa
- [ ] Verificar `npm run lint` pasa
- [x] Verificar no hay errores TypeScript

---

## 7) Reglas de Negocio a Respetar

- [ ] Mantener fecha original al editar
- [ ] Razón de edición obligatoria
- [ ] Auditoría: registrar usuario y timestamp
- [ ] Filtros permanecen al cambiar página
- [ ] Badges visibles sin necesidad de abrir detalle