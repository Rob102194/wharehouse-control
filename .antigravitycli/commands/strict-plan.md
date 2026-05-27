---
description: Plan a task using repo evidence only
agent: plan
---

Plan this task strictly from project evidence.

Rules:
1. Inspect existing files, schema, and documented rules first.
2. Verify if the requested task violates the MVP scope or constraints documented in AGENTS.md. If it does, warn the user explicitly.
3. Do not assume missing architecture, routes, or database tables.
4. Struct your plan to include:
   - **Goal**: Clear description of the objective.
   - **Business Rules involved**: Core rules to respect.
   - **Open Questions / User Review Required**: Design decisions or clarifications needed from the user.
   - **Proposed Changes**: Exact files/modules affected (using absolute paths/links).
   - **Verification Plan**: Commands or manual steps required to verify the implementation.
5. If critical information or code context is missing, say so clearly.

Do not write code yet.