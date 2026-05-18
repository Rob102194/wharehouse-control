# Rediseno UI Operaciones - Selector Unico + Tabla Editable

Objetivo: mejorar la UX operativa de `operations` reemplazando el patron actual de lineas vacias por un flujo de seleccion unica de producto con tabla editable, manteniendo las reglas de negocio y el contrato actual con server actions/RPCs.

## 1) Decision funcional

- [x] Mantener nota global de la operacion.
- [x] No implementar nota por linea en esta iteracion.
- [x] Bloquear duplicados de variante en cliente.
- [x] Mantener validacion server-side actual.
- [x] Definir mensaje UX exacto para duplicado bloqueado: "Esta variante ya fue agregada a la operacion." (toast 2.5s).
- [x] Al duplicado bloqueado se enfoca el picker (input se mantiene activo para seguir buscando).

## 2) Objetivo UX

- [x] Reemplazar `agregar linea vacia + buscar dentro de la linea` por:
  - [x] buscador unico de producto/SKU
  - [x] sugerencias dinamicas mientras escribe
  - [x] seleccion que agrega fila a tabla editable
- [x] Mantener revision clara antes de confirmar.
- [x] Mantener compatibilidad mobile/tablet.
- [x] Mantener rapidez operativa tipo POS.

## 3) Componentes nuevos / refactor

### 3.1 Selector
- [x] Crear `OperationProductPicker`.
- [x] Mostrar sugerencias por nombre de producto, variante y SKU.
- [x] Soportar teclado:
  - [x] flecha arriba
  - [x] flecha abajo
  - [x] enter
  - [x] escape
- [x] Limpiar input tras seleccion exitosa.
- [x] Bloquear duplicados.

### 3.2 Tabla editable
- [x] Crear `OperationItemsTable`.
- [x] Mostrar columnas:
  - [x] producto / variante
  - [x] SKU
  - [x] cantidad
  - [x] quitar
- [x] Mantener errores por linea.
- [x] Mantener edicion rapida de cantidades.
- [x] Mantener eliminacion de filas.

### 3.3 Contenedor compartido
- [x] Refactorizar `OperationLineItemsForm`.
- [x] Mantener serializacion a `items_json`.
- [x] Mantener compatibilidad con `lineErrors`.
- [x] Mantener reset tras exito.

## 4) Flujos a migrar

- [x] `receive-purchase`
- [x] `dispatch-restaurant`
- [x] `transfer-out`
- [x] `return-from-restaurant`
- [x] `dispatch-production`
- [x] `receive-from-production`
- [x] `adjustment`

## 5) Flujos fuera de alcance en esta iteracion

- [x] `transfer-receive` queda con tabla derivada del despacho.
- [ ] Reevaluar mas adelante si necesita mejoras visuales separadas.

## 6) Reglas a no romper

- [x] `items_json` mantiene forma actual:
  - [x] `product_variant_id`
  - [x] `quantity`
- [x] No introducir cambios en RPCs por este rediseno.
- [x] No introducir cambios de schema por este rediseno.
- [x] No permitir duplicados de variante en la tabla.
- [x] Mantener cantidades > 0 donde aplique.
- [x] Mantener reglas server-side de stock y movimientos.

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

- [x] Eliminar logica vieja de lineas vacias si ya no se usa.
- [x] Revisar imports/helpers sobrantes.
- [x] Mantener `lint` en verde.
- [x] Mantener `build` en verde.

## 10) Cierre

- [ ] UX operativa aprobada.
- [ ] Sin regresiones funcionales.
- [x] Documentacion actualizada.
