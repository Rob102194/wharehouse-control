1. Glosario Canónico
Términos a fijar como oficiales:
- warehouse: almacén físico
- product: producto base conceptual
- product_variant: variante operativa que realmente se mueve
- movement: cabecera de movimiento
- movement_item: línea de movimiento
- entry: entrada de stock
- exit: salida de stock
- transfer: transferencia entre almacenes
- adjustment: corrección controlada de stock
- current_stock: stock actual derivado, no editable manualmente
- movement_status: estado operativo del movimiento
- incident: diferencia o problema al recibir una transferencia
2. Reglas Funcionales Consolidadas
Estas quedan como reglas rectoras del sistema:
- El stock es consecuencia de movimientos confirmados.
- No existe edición libre de stock como fuente de verdad.
- Toda línea de movimiento apunta a una product_variant.
- Los movimientos confirmados deben ser inmutables en la práctica.
- Las correcciones se hacen con nuevos movimientos, no editando historia.
- Una salida no puede dejar stock negativo.
- Un despacho de transferencia no puede dejar stock negativo.
- En transferencia, origen y destino deben ser diferentes.
- El despacho reduce stock en origen.
- El destino solo incrementa stock cuando se confirma la recepción.
- Todo movimiento debe registrar actor y timestamp.
- Ajustes son solo para admin.
3. Roles Y Permisos
operator
Puede:
- crear entry
- crear exit
- crear transfer
- confirmar recepción de transferencias
- consultar stock e historial relevante
No puede:
- gestionar usuarios
- crear ajustes
- administrar catálogos globales si decides reservar eso a admin
admin
Puede:
- gestionar almacenes
- gestionar productos
- gestionar variantes
- gestionar usuarios o perfiles
- crear ajustes
- consultar todo
- operar movimientos si el negocio lo permite
owner
Puede:
- consultar stock
- consultar movimientos
- consultar transferencias
- consultar catálogos
No puede:
- crear ni confirmar movimientos
- administrar catálogos
- crear ajustes
4. Semántica De Cada Tipo De Movimiento
entry
- aumenta stock en un almacén destino
- representa compras u otros ingresos
- se considera confirmada al registrarse
exit
- reduce stock en un almacén origen
- representa despacho a cocina u otras salidas
- se considera confirmada al registrarse
transfer
- tiene ciclo de vida
- al despachar, reduce stock en origen
- al recibir, aumenta stock en destino
- requiere trazabilidad completa de despacho y recepción
adjustment
- corrige diferencias de inventario
- puede ser positiva o negativa
- debe incluir razón obligatoria
- solo admin
5. Estados De Movimiento
Recomendación funcional:
- entry: confirmed
- exit: confirmed
- adjustment: confirmed
- transfer: usa el ciclo completo
Como no hay código existente, sugiero separar claramente:
- movement_type: entry | exit | transfer | adjustment
- movement_status: depende del tipo
Estados para transferencias:
- pending: creada pero todavía no despachada, si decides permitir borrador
- in_transit: ya despachada desde origen
- received: recibida sin diferencias
- received_with_incident: recibida con diferencia/incidencia
- rejected: no aceptada
Decisión recomendada
Para mantener el MVP simple, sugiero que la transferencia nazca directamente en in_transit al confirmar el despacho, y reservar pending solo si realmente quieres borradores. Si no necesitas borradores, pending puede existir en schema pero no usarse al inicio.
6. Confirmado / Inmutable
Definición operativa recomendada:
- entry, exit, adjustment: quedan confirmados al crearse
- transfer: el despacho confirma la salida del origen; la recepción confirma la entrada al destino
- no se editan cantidades ni líneas después de confirmar
- cualquier corrección posterior debe ser otro movimiento
7. Alcance MVP Formal
Incluido:
- auth
- roles
- warehouses
- products
- product_variants
- entries
- exits
- transfers
- transfer receipts
- stock actual
- historial filtrable
- adjustments admin-only
Excluido:
- lotes
- vencimientos
- costing
- POS
- multi-sucursal multiempresa
- analytics avanzados