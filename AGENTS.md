# AGENTS.md

## Mission
Build and maintain a web MVP for restaurant warehouse inventory movement control.

The purpose of this project is NOT to build a full restaurant ERP.
The purpose is to build a reliable inventory movement system with:
- stock by warehouse
- movement traceability
- transfer confirmation between warehouses
- fast operational UX
- basic consultation and administration

## Instruction priority
When making decisions, follow this priority order:
1. Existing code and real database schema
2. This AGENTS.md file
3. Relevant loaded skills
4. The current user task
5. Reasonable assumptions, only if explicitly labeled as assumptions

If any source conflicts with another, prefer the higher-priority source and state the conflict.

## Hard constraints
- Stay within MVP scope unless explicitly told otherwise.
- Do not invent undocumented business rules.
- Do not introduce architecture changes unless explicitly requested.
- Do not add unrelated features “for completeness”.
- Do not silently rename domain concepts.
- Do not replace explicit business rules with generic abstractions.

## Product definition
This is a restaurant inventory movement system for 5 warehouses and 300+ products.

The same conceptual product may exist in multiple operational variants or presentations.
Example:
- base product: Tuna
- variants: Tuna Can 170g, Tuna Can 500g, Tuna Bottle 1kg

Inventory operations work with product variants, not only base products.

## Core business model
Stock must be derived from confirmed inventory movements.

Never treat free manual stock editing as the source of truth.

Movement types in MVP:
- entry
- exit
- transfer
- adjustment

Business meaning:
- entry: increases stock in a warehouse
- exit: decreases stock in a warehouse
- transfer: moves stock from one warehouse to another with dispatch and receipt confirmation
- adjustment: controlled correction, admin-only

Purchases are modeled as entries.
Kitchen dispatches are modeled as exits.
The system does not track stock after a kitchen exit.

## Non-negotiable movement rules
- A confirmed movement must be immutable in practice.
- Corrections must happen through adjustments or compensating movements.
- No exit may reduce stock below available quantity.
- No transfer dispatch may reduce stock below available quantity.
- Transfer origin and destination must be different warehouses.
- Transfer dispatch decreases origin stock.
- Destination stock increases only after receipt confirmation.
- Every confirmed movement must store actor user and timestamp.
- Every movement may contain multiple line items.
- Every line item must reference a product variant.

## Roles
Warehouse operator:
- create entries
- create exits
- create transfers
- confirm incoming transfers
- consult relevant stock and history

Administrator:
- manage warehouses
- manage products and variants
- manage users
- create adjustments
- consult all records

Owner / read-only:
- consultation only

## MVP scope
Allowed in MVP:
1. Authentication
2. Role-based access
3. Warehouse management
4. Product management
5. Product variant management
6. Entry creation
7. Exit creation
8. Transfer creation
9. Transfer receipt confirmation
10. Current stock views
11. Movement history with filters
12. Admin-only adjustments

Not allowed in MVP unless explicitly requested:
- accounting
- recipe costing
- POS integration
- lot tracking
- expiration dates
- native mobile apps
- multi-restaurant support
- advanced analytics
- forecasting
- supplier workflows beyond entry recording
- approval chains beyond transfer confirmation

## UX policy
This project has two UX modes and they must remain distinct.

### Operational UX
For warehouse operators.
Requirements:
- tactile
- fast
- low-friction
- mobile/tablet friendly
- POS-like interaction model
- product search first
- quick quantity editing
- movement summary/cart pattern
- clear primary confirmation action

### Consultation/admin UX
For admins and owners.
Requirements:
- traditional layout
- filterable tables
- detail panels
- status labels
- history and consultation focus

Do not force operators through admin-heavy forms if a faster interaction pattern is possible.

## Technical stack
Official stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Vercel during MVP testing

Do not introduce:
- separate backend service
- microservices
- event buses
- CQRS
- unnecessary repository abstractions
- state machines unless explicitly justified

## Architecture policy
The app must remain a web monolith during MVP.

Preferred boundaries:
- app/: routes and page structure
- components/: UI pieces
- lib/: shared utilities, permissions, validation, auth helpers
- server/: server-side actions, queries, transactional operations
- types/: shared TS types
- db/ or supabase/: DB access and schema-related helpers

Critical stock logic must not rely only on the client.
Protect critical movement rules in server-side logic and/or database functions.

## Data integrity policy
Assume concurrency matters.

When implementing or changing movement logic:
- think transactionally
- avoid race-prone client assumptions
- validate stock on the server
- preserve auditability
- prefer append-only history over destructive mutation

If a change risks data inconsistency, stop and state the risk explicitly.

## Coding policy
- Prefer explicit code over clever abstractions.
- Prefer smaller modules over large mixed-responsibility files.
- Reuse existing patterns before creating new ones.
- Use clear names aligned with domain terms.
- Keep error handling lightweight but real.
- Do not create generic utilities unless there is repeated evidence they are needed.
- Avoid over-engineering.

## Change policy
Before non-trivial implementation, always:
1. restate the goal in concrete terms
2. identify relevant business rules
3. identify affected files/modules
4. identify assumptions
5. keep implementation within current scope

After implementation, always summarize:
- files changed
- business rules touched
- assumptions made
- risks or follow-ups

## Anti-hallucination policy
- Do not invent tables, routes, permissions, or flows that are not present in code, schema, AGENTS.md, or loaded skills.
- If information is missing, say exactly what is missing.
- Label assumptions explicitly.
- Prefer inspecting real files and schema over guessing.
- If unsure whether something already exists, search before creating.
- Do not describe code as implemented unless it is actually implemented.
- Do not claim a migration exists unless it exists in the repo.
- Do not claim a business rule is confirmed unless it is documented.

## Review policy
When asked to review or plan:
- identify mismatches between code and documented rules
- identify MVP scope violations
- identify hidden coupling or data integrity risks
- prefer minimal corrective action over broad rewrites

## Definition of done
A task is done only if:
- it follows business rules
- it stays within MVP scope
- it matches current architecture
- critical stock logic remains consistent
- affected UI and server logic agree
- assumptions are visible