---
description: Implement with strict and anti-hallucination rules
agent: build
---

Implement the requested task with strict constraints.

Requirements:
- Follow AGENTS.md and relevant skills.
- Do not invent schema or routes.
- Reuse existing patterns and keep changes minimal, clean, and explicit.
- Protect stock rules server-side/database-side (avoid race-prone client assumptions).
- Maintain documentation integrity: preserve unrelated comments and docstrings.
- Do not use placeholders or write incomplete implementation blocks (avoid comments like "// TODO").

Verification:
- Run `npm run lint` and `npm run build` (or equivalent) to ensure there are no compilation or typing errors.
- Confirm that the changes satisfy all constraints without introducing regressions.

At the end, report:
- files changed (with absolute paths/links)
- verification results (lint & build status)
- assumptions made
- business rules touched
- risks or follow-up work