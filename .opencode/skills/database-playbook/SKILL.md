---
name: database-playbook
description: Strict database modeling and integrity guidance for the restaurant inventory MVP
---

# Database playbook

Use this skill whenever the task involves:
- schema design
- migrations
- constraints
- indexes
- transactional logic
- stock calculation
- auditability
- SQL functions or RPC

## Source of truth policy
Supabase Postgres is the source of truth for persisted business data.

Do not design core stock logic as if client state were authoritative.

## Core data modeling guidance
Expected core concepts:
- users
- roles or role representation
- warehouses
- products
- product_variants
- movements
- movement_items
- transfer receipt state or transfer confirmation data
- audit log or equivalent auditability support

Do not invent many extra tables unless required by real functionality.

## Modeling rules
- Separate movement header from movement line items.
- Movement line items must reference product variants.
- Different operational presentations must remain distinct variants.
- Prefer explicit status fields over implicit lifecycle assumptions.
- Preserve traceability in schema design.

## Stock integrity policy
Critical stock-affecting operations should be implemented transactionally.

Protect against:
- stock going negative
- transfer lifecycle inconsistency
- partial writes that corrupt movement history
- race conditions in stock validation

## Auditability policy
Schema should support answering:
- who did it
- when it happened
- what changed
- from where
- to where
- under which movement type/status

If a schema choice weakens auditability, prefer the more auditable option.

## Constraint policy
Use constraints deliberately where they increase safety.

Examples of desirable integrity support:
- not-null where appropriate
- foreign keys
- check constraints for controlled enums or simple invariants
- indexes for common read paths

## Indexing priorities
Likely important indexes:
- movement timestamp
- movement type
- movement status
- warehouse foreign keys
- product_variant foreign keys

Respect existing schema naming and indexing conventions if they already exist.

## Migration policy
- Keep migrations small and reviewable.
- Do not combine unrelated schema changes.
- Do not make destructive changes casually.
- If changing movement semantics, inspect dependent queries and calculations first.

## Derived stock policy
If current stock is represented by:
- a query
- a view
- a materialized pattern
- snapshots
respect the existing approach unless explicitly changing it.

Do not assume the project wants one specific stock computation strategy unless the repo confirms it.

## SQL/RPC policy
If critical stock logic is implemented in SQL functions or RPC:
- keep behavior explicit
- document assumptions in code/comments where appropriate
- prefer correctness over clever compactness

## If uncertain
Choose:
- integrity
- auditability
- transactional safety
over convenience or speed of implementation