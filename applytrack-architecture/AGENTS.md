# ApplyTrack Agent Instructions

This file defines how AI coding agents such as Codex should work inside the ApplyTrack repository.

## 1. Read Before Coding

Before making significant changes, read:

1. `ARCHITECTURE.md`
2. `DATABASE.md`
3. `SECURITY.md`
4. `UI_UX.md`
5. `TESTING.md`
6. `IMPLEMENTATION_PLAN.md`

Do not implement features that contradict these files.

## 2. Project Goal

Build a secure, polished, deployable personal job application tracker using:

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- PostgreSQL
- React Router
- TanStack Query
- React Hook Form
- Zod
- Vitest
- Playwright

## 3. Scope Rule

V1 does not include:

- AI
- Job scraping
- Email reminders
- Calendar integrations
- Resume uploads
- Browser extensions
- Team accounts
- Custom Node/Express backend

Do not add these unless explicitly requested.

## 4. Repository Rule

ApplyTrack is independent from the existing portfolio.

Never modify the portfolio repository while implementing ApplyTrack unless explicitly instructed.

## 5. Architecture Rules

### Feature ownership

Use feature-based structure.

```text
features/
├── auth/
├── applications/
├── dashboard/
└── demo/
```

### Database access

Do not scatter Supabase queries across components.

Application data access belongs in:

```text
src/features/applications/api/applications.ts
```

### Server state

Use TanStack Query.

Do not add Redux without a documented need.

### Validation

Use React Hook Form + Zod for application forms.

Database constraints must still protect data integrity.

## 6. Security Rules

These rules are mandatory.

- Never disable RLS to solve an error.
- Never expose `service_role` in frontend code.
- Never put secret keys in `VITE_*` variables.
- Never grant anonymous access to the real `applications` table.
- Never rely on React route guards for database authorization.
- Never allow users to change application ownership.
- Never use real user records for the recruiter demo.
- Never weaken policies merely to make tests pass.

RLS is the source of truth for ownership enforcement.

## 7. Public Demo Rule

The demo page must read from local fictional data such as:

```text
src/features/demo/demoApplications.ts
```

The demo must not query the real applications table.

## 8. UI Rules

Build a clean, light, professional SaaS-style interface.

Desktop:

- Sidebar
- Header
- Table for applications

Mobile:

- Mobile navigation
- Application cards
- No unusable horizontal table scrolling

Do not add excessive gradients, glass effects, animations, or visual clutter.

## 9. Accessibility Rules

All new interactive UI must consider:

- Keyboard access
- Visible focus
- Labels
- Semantic elements
- Accessible dialogs
- Understandable validation messages
- Color-independent status meaning

## 10. Error Handling Rules

Never expose raw database errors directly to users.

Provide clear messages such as:

```text
We couldn't save this application. Please try again.
```

Keep technical errors available for development debugging where appropriate.

## 11. Loading and Empty States

Every async screen should explicitly handle:

```text
loading
error
empty
success
```

Do not leave unexplained blank areas while waiting for data.

## 12. Testing Rules

When changing business logic, update or add tests.

Important test areas:

- Follow-up dates
- Validation
- Search
- Filters
- CRUD
- Authentication
- RLS isolation

Before declaring a feature complete, run the relevant tests.

Before final delivery, run:

```text
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## 13. Database Migration Rules

All schema changes must be reproducible through migrations under:

```text
supabase/migrations/
```

Do not depend on undocumented dashboard-only database changes.

## 14. Implementation Style

Prefer:

- Small focused components
- Explicit types
- Reusable pure utility functions
- Clear naming
- Simple data flow
- Minimal abstractions

Avoid:

- Premature architecture layers
- Generic utility dumping grounds
- Huge components
- Duplicate business logic
- `any`
- Unnecessary dependencies
- Overengineering

## 15. Completion Rule

Do not claim a feature is complete merely because code was generated.

A feature is complete only when:

1. It works in the browser.
2. Errors are handled.
3. Responsive behavior is acceptable.
4. Relevant tests pass.
5. Type checks pass.
6. Security behavior remains correct.

## 16. Change Workflow

For each major task:

```text
1. Read relevant architecture files
2. Inspect existing implementation
3. Make the smallest coherent change
4. Run type checks/tests
5. Fix regressions
6. Summarize what changed
7. Mention remaining limitations
```

## 17. Do Not Invent Results

Do not write fake metrics or impact claims into README/resume content.

Acceptable:

```text
Implemented authenticated CRUD with RLS-protected PostgreSQL records.
```

Not acceptable without measurement:

```text
Improved job search efficiency by 80%.
```
