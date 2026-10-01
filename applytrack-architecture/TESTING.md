# ApplyTrack Testing Architecture

## 1. Testing Goal

Tests should verify behavior that matters to a real user and security rules that matter to the application.

Testing layers:

```text
Unit Tests
  ↓
Integration-style feature tests where useful
  ↓
Playwright E2E
  ↓
Direct API / RLS verification
```

## 2. Tooling

Use:

- Vitest for unit tests
- React Testing Library where component behavior deserves isolated testing
- Playwright for browser E2E tests

## 3. Unit Test Scope

Prioritize pure business logic.

### Date Logic

File:

```text
tests/unit/dates.test.ts
```

Cases:

```text
Yesterday -> overdue
Today -> today
Tomorrow -> upcoming
8 days away -> not upcoming
No follow-up -> none
```

Also test month/year boundaries.

### Search and Filters

File:

```text
tests/unit/filters.test.ts
```

Cases:

- Search by company
- Search by title
- Case-insensitive search
- Leading/trailing whitespace
- Status filtering
- Search + status filter together
- Empty search

### Validation

File:

```text
tests/unit/applicationSchema.test.ts
```

Cases:

- Company required
- Job title required
- Company whitespace-only rejected
- Job title whitespace-only rejected
- Invalid URL rejected
- Empty URL allowed
- Saved application can omit application date
- Applied application requires application date
- Valid application accepted

## 4. E2E Test Structure

```text
tests/e2e/
├── authentication.spec.ts
├── applications.spec.ts
├── demo.spec.ts
├── mobile.spec.ts
└── rls.spec.ts
```

## 5. Authentication E2E

Verify:

- Sign in
- Invalid sign-in error
- Sign out
- Protected route redirects signed-out users
- Session survives refresh
- Password recovery route is reachable

## 6. Application CRUD E2E

Main flow:

```text
Sign in
  ↓
Create application
  ↓
Verify it appears
  ↓
Refresh browser
  ↓
Verify it still exists
  ↓
Edit application
  ↓
Change status
  ↓
Set follow-up date
  ↓
Verify dashboard updates
  ↓
Delete application
  ↓
Verify deletion
```

## 7. Search and Filter E2E

Verify:

- Search finds company
- Search finds job title
- Status filter works
- Search and status filter combine correctly
- Clearing filters restores results

## 8. Demo E2E

Verify:

- `/demo` works signed out
- Fictional records are visible
- Demo banner is visible
- Search/filter controls work if enabled
- Create/edit/delete cannot mutate real data
- Demo does not require a database session

## 9. Mobile E2E

Test a mobile viewport.

Verify:

- Navigation is usable
- Applications render as cards
- Form inputs fit viewport
- No unexpected horizontal overflow
- Delete dialog remains usable
- Main actions remain reachable

## 10. RLS Tests

Use two dedicated test accounts.

```text
User A
User B
```

### SELECT isolation

1. User A creates record A.
2. User B attempts to retrieve record A directly.
3. Record A must not be returned.

### UPDATE isolation

1. User B attempts to update record A by ID.
2. No unauthorized change must occur.

### DELETE isolation

1. User B attempts to delete record A by ID.
2. Record A must still exist for User A.

### Ownership transfer

1. User A attempts to change `owner_id` to User B.
2. Database must reject the update.

## 11. Direct API Security Test

RLS verification must bypass the React application.

Use:

```text
Supabase URL
Publishable key
Authenticated user access token
```

Call the Data API directly.

The test verifies that security still holds when an attacker manually makes HTTP requests.

## 12. Test Credentials

Never commit test passwords.

Use environment variables such as:

```text
E2E_USER_A_EMAIL
E2E_USER_A_PASSWORD
E2E_USER_B_EMAIL
E2E_USER_B_PASSWORD
```

Store them in local environment configuration and CI secrets.

## 13. Acceptance Checks

Before V1 is considered complete:

```text
[ ] Refresh persistence works
[ ] Overdue-date handling is correct
[ ] Upcoming dates are correct
[ ] Search behaves correctly
[ ] Status filter behaves correctly
[ ] Save errors are understandable
[ ] Keyboard navigation works
[ ] Mobile layout is usable
[ ] User isolation tests pass
[ ] Build passes
[ ] Type checks pass
[ ] Unit tests pass
[ ] Critical E2E tests pass
```

## 14. Recommended Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Exact scripts may change depending on project configuration.
