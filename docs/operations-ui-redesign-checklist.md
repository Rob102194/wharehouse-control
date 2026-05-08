# Rediseno UI Operaciones - Selector Unico + Tabla Editable

Objetivo: mejorar la UX operativa de `operations` reemplazando el patron actual de lineas vacias por un flujo de seleccion unica de producto con tabla editable, manteniendo las reglas de negocio y el contrato actual con server actions/RPCs.

## 1) Decision funcional

- [x] Mantener nota global de la operacion.
- [x] No implementar nota por linea en esta iteracion.
- [x] Bloquear duplicados de variante en cliente.
- [x] Mantener validacion server-side actual.
- [ ] Definir mensaje UX exacto para duplicado bloqueado.
- [ ] Definir si al duplicado bloqueado se enfoca la fila existente.

## 2) Objetivo UX

- [ ] Reemplazar `agregar linea vacia + buscar dentro de la linea` por:
  - [ ] buscador unico de producto/SKU
  - [ ] sugerencias dinamicas mientras escribe
  - [ ] seleccion que agrega fila a tabla editable
- [ ] Mantener revision clara antes de confirmar.
- [ ] Mantener compatibilidad mobile/tablet.
- [ ] Mantener rapidez operativa tipo POS.

## 3) Componentes nuevos / refactor

### 3.1 Selector
- [ ] Crear `OperationProductPicker`.
- [ ] Mostrar sugerencias por nombre de producto, variante y SKU.
- [ ] Soportar teclado:
  - [ ] flecha arriba
  - [ ] flecha abajo
  - [ ] enter
  - [ ] escape
- [ ] Limpiar input tras seleccion exitosa.
- [ ] Bloquear duplicados.

### 3.2 Tabla editable
- [ ] Crear `OperationItemsTable`.
- [ ] Mostrar columnas:
  - [ ] producto / variante
  - [ ] SKU
  - [ ] cantidad
  - [ ] quitar
- [ ] Mantener errores por linea.
- [ ] Mantener edicion rapida de cantidades.
- [ ] Mantener eliminacion de filas.

### 3.3 Contenedor compartido
- [ ] Refactorizar `OperationLineItemsForm`.
- [ ] Mantener serializacion a `items_json`.
- [ ] Mantener compatibilidad con `lineErrors`.
- [ ] Mantener reset tras exito.

## 4) Flujos a migrar

- [ ] `receive-purchase`
- [ ] `dispatch-restaurant`
- [ ] `transfer-out`
- [ ] `return-from-restaurant`
- [ ] `dispatch-production`
- [ ] `receive-from-production`
- [ ] `adjustment`

## 5) Flujos fuera de alcance en esta iteracion

- [x] `transfer-receive` queda con tabla derivada del despacho.
- [ ] Reevaluar mas adelante si necesita mejoras visuales separadas.

## 6) Reglas a no romper

- [ ] `items_json` mantiene forma actual:
  - [ ] `product_variant_id`
  - [ ] `quantity`
- [ ] No introducir cambios en RPCs por este rediseno.
- [ ] No introducir cambios de schema por este rediseno.
- [ ] No permitir duplicados de variante en la tabla.
- [ ] Mantener cantidades > 0 donde aplique.
- [ ] Mantener reglas server-side de stock y movimientos.

## 7) QA UX

- [ ] Seleccionar variante agrega fila correctamente.
- [ ] Variante duplicada no crea segunda fila.
- [ ] La tabla permite editar cantidad sin friccion.
- [ ] La tabla permite quitar filas.
- [ ] Tras exito, la tabla vuelve vacia.
- [ ] La nota global sigue funcionando.
- [ ] El flujo es usable en desktop.
- [ ] El flujo es usable en tablet.
- [ ] El flujo es usable en mobile.

## 8) QA funcional

- [ ] `receive-purchase` sigue creando entrada.
- [ ] `dispatch-restaurant` sigue creando salida.
- [ ] `transfer-out` sigue creando transferencia.
- [ ] `return-from-restaurant` sigue creando entrada.
- [ ] `dispatch-production` sigue creando salida.
- [ ] `receive-from-production` sigue creando entrada.
- [ ] `adjustment` sigue creando ajuste.
- [ ] `history` refleja movimientos creados.
- [ ] `stock` refleja cambios correctamente.

## 9) Limpieza tecnica

- [ ] Eliminar logica vieja de lineas vacias si ya no se usa.
- [ ] Revisar imports/helpers sobrantes.
- [ ] Mantener `lint` en verde.
- [ ] Mantener `build` en verde.

## 10) Cierre

- [ ] UX operativa aprobada.
- [ ] Sin regresiones funcionales.
- [ ] Documentacion actualizada.
