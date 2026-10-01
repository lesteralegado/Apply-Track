# ApplyTrack Architecture Pack

This folder contains the architecture documents for building ApplyTrack.

## Files

### `ARCHITECTURE.md`

Main system architecture, folder structure, routing, data flow, state management, and definition of done.

### `DATABASE.md`

Database schema, field rules, indexes, migrations, generated types, and date-storage decisions.

### `SECURITY.md`

Supabase RLS policies, ownership rules, environment security, recruiter demo isolation, and direct API verification.

### `UI_UX.md`

Responsive layout rules, dashboard structure, table/card behavior, forms, states, accessibility, and demo UI.

### `TESTING.md`

Vitest, Playwright, CRUD tests, date/filter tests, mobile tests, and direct RLS/API verification.

### `IMPLEMENTATION_PLAN.md`

Seven-day delivery plan with daily objectives and acceptance checks.

### `AGENTS.md`

Rules for Codex or another coding agent working inside the repository.

## Recommended Repository Placement

Copy the files to the root of:

```text
C:\portfolio\applytrack\
```

Recommended root:

```text
applytrack/
├── AGENTS.md
├── ARCHITECTURE.md
├── DATABASE.md
├── SECURITY.md
├── UI_UX.md
├── TESTING.md
├── IMPLEMENTATION_PLAN.md
└── README.md
```

Keep `AGENTS.md` in the repository root so Codex can easily discover the project instructions.

## Recommended Codex Starting Prompt

```text
Read AGENTS.md and all referenced architecture files before making changes.

We are building ApplyTrack from scratch according to IMPLEMENTATION_PLAN.md.
Start with Day 1 only.

Before coding:
1. Inspect the repository.
2. Compare the current state with Day 1 requirements.
3. Implement only the missing Day 1 foundation work.
4. Follow ARCHITECTURE.md, DATABASE.md, SECURITY.md, UI_UX.md, and TESTING.md.
5. Do not implement Day 2+ features yet unless they are strictly required for the Day 1 foundation.
6. Run the relevant type/build checks after implementation.
7. Summarize the files changed, architecture decisions made, commands to run, and any remaining Day 1 work.

Never disable Supabase RLS, never expose secret/service-role keys, and do not modify my existing portfolio repository.
```
