> Historical delivery plan: Supabase was replaced with Firebase at the user's request. Current backend contracts and test commands are in ARCHITECTURE.md, DATABASE.md, SECURITY.md, and TESTING.md. The original plan below is retained for reference.

# ApplyTrack Seven-Day Implementation Plan

## Goal

Complete ApplyTrack V1 in one week at approximately 3–4 focused hours per day.

The goal is not maximum feature count. The goal is a polished, secure, explainable, deployed project.

---

# Day 1 — Foundation

## Objective

Create the project foundation, Supabase database, and responsive shell.

## Tasks

### Project setup

- Create `C:\applytrack`
- Initialize Git repository
- Create React + TypeScript + Vite project
- Install Tailwind CSS
- Install React Router
- Install Supabase client
- Install TanStack Query
- Install React Hook Form
- Install Zod
- Install Vitest
- Install Playwright

### Project architecture

Create the main folders from `ARCHITECTURE.md`.

### Supabase

- Create a dedicated Supabase project
- Create migrations
- Create application status enum
- Create `applications` table
- Add indexes
- Add `updated_at` behavior
- Enable RLS
- Add ownership policies

### UI

Build:

- `AppShell`
- `Sidebar`
- `Header`
- `MobileNavigation`
- Basic button/input/select components

## End-of-Day Acceptance

```text
[ ] App launches
[ ] Routing works
[ ] Supabase connection works
[ ] Database migration is reproducible
[ ] RLS is enabled
[ ] Layout works on desktop and mobile
```

---

# Day 2 — Authentication

## Objective

Complete account flows and route protection.

## Build

- AuthProvider
- `useAuth`
- Sign Up
- Sign In
- Sign Out
- ProtectedRoute
- Forgot Password
- Update Password

## Verify

```text
[ ] User can sign up
[ ] User can sign in
[ ] User can sign out
[ ] Session survives refresh
[ ] Signed-out user cannot access /app/*
[ ] Password recovery flow works
[ ] Production redirect strategy is documented
```

Do not move on until protected routes behave correctly.

---

# Day 3 — Application CRUD

## Objective

Make the application useful for real job tracking.

## Build

### Data layer

Implement:

- `getApplications`
- `getApplicationById`
- `createApplication`
- `updateApplication`
- `deleteApplication`
- `updateApplicationStatus`

### Form

Build reusable `ApplicationForm`.

Fields:

- Company
- Job title
- Job URL
- Status
- Application date
- Follow-up date
- Notes

### Screens

Build:

- Applications page
- New application page
- Edit application page
- Desktop table
- Initial mobile card layout

### Destructive action

Add delete confirmation.

## Verify

```text
[ ] Create works
[ ] Edit works
[ ] Delete works
[ ] Status change works
[ ] Refresh persistence works
[ ] Validation works
[ ] Save error keeps user's form data
```

---

# Day 4 — Organization and Dashboard

## Objective

Make application data easy to understand and act on.

## Applications page

Add:

- Search by company/title
- Status filter
- Default updated-date sorting
- Empty search state

## Dashboard

Add:

- Total count
- Applied count
- Interviewing count
- Offer count
- Rejected count
- Overdue follow-ups
- Today's follow-ups
- Upcoming follow-ups

## Utilities

Create reusable logic for:

- Date calculations
- Search
- Filtering
- Sorting
- Dashboard statistics

## Unit tests

Add Vitest coverage for:

- Date rules
- Filters
- Search
- Validation

## End-of-Day Acceptance

```text
[ ] Search works
[ ] Status filter works
[ ] Dashboard counts match records
[ ] Overdue logic is correct
[ ] Upcoming logic is correct
[ ] Unit tests pass
```

---

# Day 5 — Demo and Polish

## Objective

Make ApplyTrack presentable to recruiters.

## Public demo

Create `/demo` with fictional local data.

Requirements:

- No authentication required
- Clearly labeled Demo Mode
- No real database access
- Search/filter may work
- Editing disabled
- CTA to create account

## UX polish

Add:

- Loading states
- Error states
- Empty states
- Skeletons
- Toast/feedback patterns if used
- Better focus states
- Improved validation messages
- Consistent spacing
- Mobile layout cleanup

## Accessibility

Verify:

- Keyboard navigation
- Labels
- Focus visibility
- Dialog behavior
- Status not communicated only by color

## End-of-Day Acceptance

```text
[ ] Demo works signed out
[ ] Demo is visibly fictional/read-only
[ ] Mobile layout is comfortable
[ ] Loading states exist
[ ] Error states exist
[ ] Empty states exist
[ ] Delete confirmation is accessible
```

---

# Day 6 — Verification

## Objective

Prove functionality and security.

## Playwright

Implement tests for:

- Authentication
- CRUD
- Refresh persistence
- Search
- Status filter
- Status changes
- Demo access
- Mobile layout

## RLS verification

Use two users.

Verify:

- User A cannot expose records to User B
- User B cannot SELECT User A data
- User B cannot UPDATE User A data
- User B cannot DELETE User A data
- User A cannot transfer ownership

## Direct API verification

Test RLS through Supabase Data API rather than only through the UI.

## Quality checks

Run:

```text
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## End-of-Day Acceptance

```text
[ ] Critical E2E tests pass
[ ] RLS tests pass
[ ] Direct API checks pass
[ ] Unit tests pass
[ ] Type checks pass
[ ] Production build passes
```

---

# Day 7 — Deployment and Documentation

## Objective

Ship the project.

## Vercel

- Create Vercel project
- Add environment variables
- Configure SPA routing
- Deploy

## Supabase Auth

Configure:

- Production site URL
- Redirect URLs
- Password recovery URL

## Production verification

Manually test deployed app:

```text
[ ] Sign up
[ ] Sign in
[ ] Sign out
[ ] Password recovery
[ ] Create
[ ] Edit
[ ] Delete
[ ] Status update
[ ] Refresh persistence
[ ] Dashboard
[ ] Search
[ ] Filters
[ ] Demo
[ ] Mobile
[ ] Direct protected route refresh
```

## Documentation

Finish README with:

- Overview
- Problem
- Features
- Tech stack
- Architecture
- Database
- Security/RLS
- Testing
- Local setup
- Environment variables
- Migrations
- Deployment
- Screenshots
- Future improvements

## Resume

Only after functionality is implemented and verified, use a bullet such as:

> Built and deployed a job application tracker using React, TypeScript, and Supabase, with authenticated application management, follow-up tracking, PostgreSQL row-level security, and automated end-to-end tests.

---

# Development Priority Rule

When time becomes limited, prioritize in this order:

```text
1. Security
2. Correctness
3. Core CRUD
4. Persistence
5. Responsive usability
6. Testing
7. Documentation
8. Visual polish
9. Optional enhancements
```

Do not sacrifice RLS or core reliability to add decorative features.
