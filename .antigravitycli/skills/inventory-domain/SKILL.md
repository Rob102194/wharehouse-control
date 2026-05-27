---
name: inventory-domain
description: Strict business domain rules and terminology for the restaurant warehouse inventory application
---

# Inventory domain

Use this skill whenever the task involves:
- business entities
- naming domain concepts
- product modeling
- warehouse modeling
- movement semantics
- stock meaning
- role behavior

## Purpose
This project is an inventory movement control system for a restaurant with multiple warehouses.

It is not a general ERP.
It is not a recipe-costing system.
It is not a purchasing platform.
It is not a kitchen production tracker.

The goal is to maintain reliable stock visibility by warehouse through auditable inventory movements.

## Domain scope
Current known business context:
- 5 warehouses
- 300+ products
- products may exist in multiple operational presentations
- purchases are represented as entries
- dispatch to kitchen is represented as exit
- no lot tracking in MVP
- no expiration tracking in MVP
- transfers require dispatch + receipt confirmation

Do not expand domain scope unless explicitly instructed.

## Canonical terms

### Warehouse
A physical inventory location inside the restaurant operation.

### Base product
A conceptual product family.
Example:
- Tuna
- Tomato Sauce
- Rice

Base products are useful for organization and reporting.
Base products are not enough for operational stock control.

### Product variant
The operational inventory item actually moved and counted in stock.
Examples:
- Tuna Can 170g
- Tuna Can 500g
- Water Bottle 1.5L
- Rice Sack 25kg

All movement lines must reference product variants.

Do not collapse different operational presentations into a single stock item.

### Entry
A movement that increases stock in a warehouse.

### Exit
A movement that decreases stock in a warehouse.
Kitchen dispatch is an exit.
The system does not track the product after kitchen exit.

### Transfer
A movement from one warehouse to another with double verification:
- origin operator dispatches
- destination operator confirms receipt

### Adjustment
A controlled stock correction used to reconcile differences.
Adjustment is admin-only in MVP.

## Domain rules that must remain stable
- Stock is derived from confirmed movements.
- Free manual stock editing is not the source of truth.
- Confirmed movements are effectively immutable.
- Corrections happen through new auditable movements, not silent overwrites.
- Every operational presentation is a distinct product variant.
- Every movement is attributable to a user.
- Every movement must be time-traceable.

## Roles
### Warehouse operator
Operational actor.
Can create:
- entries
- exits
- transfers
Can confirm:
- incoming transfer receipts

### Administrator
Can manage:
- warehouses
- products
- variants
- users
- adjustments
Can consult everything.

### Owner / read-only
Consultation only.

## Interpretation policy
If a request conflicts with these domain definitions:
1. prefer documented domain definitions
2. state the conflict
3. do not silently reinterpret the domain

If information is missing:
- say what is missing
- do not invent a new business flow