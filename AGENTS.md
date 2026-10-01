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
- Firebase Authentication
- Cloud Firestore
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

Do not scatter Firestore queries across components.

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

- Never weaken Firestore Security Rules to solve an error.
- Never expose Firebase administrative credentials in frontend code.
- Never put secret keys in `VITE_*` variables.
- Never grant anonymous access to real application documents.
- Never rely on React route guards for database authorization.
- Never allow users to change application ownership.
- Never use real user records for the recruiter demo.
- Never weaken security rules merely to make tests pass.

Firestore Security Rules are the source of truth for ownership enforcement.

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
- Firestore user isolation

Before declaring a feature complete, run the relevant tests.

Before final delivery, run:

```text
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## 13. Database Migration Rules

All database authorization and validation changes must be reproducible in:

```text
firestore.rules
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

The project knowledge store at `docs/solutions/` holds documented solutions to past problems, organized by category with YAML frontmatter (`module`, `tags`, `problem_type`); it is relevant when implementing or debugging an area with a documented solution.

After a solved, verified problem, offer once to invoke the `ce-compound` skill at the completion checkpoint only when the work produced durable project reasoning that is not readily recoverable from the final code, tests, types, comments, or existing documentation, and losing it would plausibly cause recurrence, material risk, or substantial rediscovery. Apply this counterfactual: if the learning document disappeared, would a future engineer reading the final implementation still be likely to repeat the mistake or redo substantial investigation? If not, do not offer. Completion, effort, and diff size alone are not enough. Offer at the checkpoint so a qualifying learning can ship in the PR that produced it, and only where the repository treats captured learnings as tracked, committed knowledge.
Write every report, summary, or handoff to the user through the `ce-noslop` skill. This applies when you are the top-level agent writing to the user, not when you are a subagent reporting to its caller. Do not apply it to code, config, verbatim quotes, or text the user asked to post as written.
## 17. Do Not Invent Results

Do not write fake metrics or impact claims into README/resume content.

Acceptable:

```text
Implemented authenticated CRUD with private Firestore documents and tested security rules.
```

Not acceptable without measurement:

```text
Improved job search efficiency by 80%.
```
