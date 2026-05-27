---
name: movement-rules
description: Strict stock and movement rules for entries, exits, transfers, and adjustments
---

# Movement rules

Use this skill whenever the task involves:
- stock validation
- movement creation
- transfer lifecycle
- movement status
- movement mutation rules
- stock consistency
- auditability

## Primary principle
Stock is a consequence of confirmed movements.

Do not implement stock behavior that bypasses movement history unless explicitly requested for a separate derived cache or snapshot.

## Allowed movement types in MVP
- entry
- exit
- transfer
- adjustment

Do not introduce more movement types unless explicitly requested.

## Entry rules
- Entry increases stock in a destination warehouse.
- Entry must record actor user and timestamp.
- Entry may include multiple line items.
- Each line item must reference a product variant.

## Exit rules
- Exit decreases stock from an origin warehouse.
- Exit must not reduce stock below available quantity.
- Exit to kitchen ends traceability for that stock line in MVP.
- Exit must record actor user and timestamp.
- Exit may include multiple line items.
- Each line item must reference a product variant.

## Transfer rules
- Origin and destination warehouses must be different.
- Transfer dispatch decreases stock in origin warehouse.
- Destination stock increases only after receipt confirmation.
- Transfer must keep enough data to answer:
  - who dispatched
  - when dispatched
  - from which warehouse
  - to which warehouse
  - who confirmed receipt
  - when receipt was confirmed
  - whether an incident occurred

## Transfer statuses
Preferred lifecycle:
- pending
- in_transit
- received
- received_with_incident
- rejected

If the existing codebase uses different names, respect the existing codebase and do not rename without explicit reason.

## Adjustment rules
- Adjustment is admin-only.
- Adjustment must require a reason or note.
- Adjustment must be auditable.
- Adjustment must not erase prior movement history.

## Mutation rules
- Confirmed movements must not be edited in place.
- If a correction is needed, use:
  - an adjustment
  - or a compensating movement
- Avoid destructive updates that make history unreliable.

## Validation rules
Critical movement validation must not rely on client-only checks.

Server-side and/or database-side protection is required for:
- available stock validation
- transfer lifecycle integrity
- privileged operations such as adjustments

## Concurrency policy
Assume concurrent actions are possible.

When implementing stock changes:
- think transactionally
- prevent race-prone stock validation
- preserve consistency first, convenience second

## Audit policy
All meaningful movement actions should be attributable to:
- user
- timestamp
- movement type
- movement identifier
- warehouse context where applicable

## If uncertain
Do not choose the most convenient behavior.
Choose the most auditable and conservative behavior.