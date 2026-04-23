---
name: architecture-guidelines
description: Strict architecture constraints and implementation boundaries for the MVP
---

# Architecture guidelines

Use this skill whenever the task involves:
- project structure
- routes
- modules
- server logic
- data access
- refactoring
- new feature placement

## Official stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Vercel during MVP testing

Do not replace or expand this stack unless explicitly requested.

## Architectural goal
Maintain a simple, reliable web monolith for MVP.

The project should optimize for:
- clarity
- speed of iteration
- maintainability
- consistency with business rules

The project should not optimize for:
- architectural novelty
- premature extensibility
- distributed complexity

## Hard architectural constraints
Do not introduce:
- microservices
- separate backend service
- event buses
- CQRS
- heavy repository layers
- generic enterprise abstractions
- complex plugin architectures
- unnecessary state machines

## Preferred boundaries
- `app/` for routes and page composition
- `components/` for reusable UI
- `lib/` for shared utilities, auth, validation, permissions
- `server/` for server-side actions, queries, transactional business logic
- `types/` for shared type definitions
- `db/` or `supabase/` for database-facing helpers and clients

If the repo already uses a slightly different structure, respect the existing structure unless the user asks for reorganization.

## Placement rules
- Put critical stock logic near the server and/or database boundary.
- Do not bury business rules in UI components.
- Do not make client components the source of truth for movement integrity.
- Keep UI composition separate from stock transaction logic.

## Refactor policy
Do not refactor broadly while implementing a narrow task.
Only refactor if:
- necessary for correctness
- necessary for maintainability of the current change
- small enough to review safely

## File design policy
Prefer:
- small files
- explicit naming
- narrow responsibility
- visible business logic

Avoid:
- giant mixed-responsibility files
- deeply indirect abstractions
- generic helpers created for one use only

## Implementation policy
Before non-trivial implementation:
1. identify current pattern in repo
2. reuse it where reasonable
3. state assumptions
4. make the smallest correct change

## Anti-drift policy
Do not silently drift away from:
- documented stack
- documented architecture
- documented business rules