# ApplyTrack Architecture

## 1. Project Overview

ApplyTrack is a full-stack personal job application tracker built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

The goal is to build a deployable application that can be used for real job applications and demonstrated to recruiters.

Core capabilities:

- Email/password authentication
- Password recovery
- Protected application routes
- Job application CRUD
- Application status tracking
- Search and filtering
- Dashboard statistics
- Follow-up tracking
- Responsive desktop table and mobile card layouts
- Public read-only recruiter demo
- PostgreSQL Row-Level Security
- Automated unit and end-to-end testing
- Vercel deployment

## 2. Scope

### Included in V1

- Authentication
- Applications CRUD
- Status management
- Search
- Status filtering
- Updated-date sorting
- Dashboard counts
- Follow-up reminders inside the app
- Public fictional demo
- Accessibility basics
- Error, loading, empty, and confirmation states
- Unit testing
- E2E testing
- RLS verification

### Excluded from V1

- AI features
- Job scraping
- Email reminders
- Calendar integrations
- Resume uploads
- Browser extensions
- Team accounts
- Job recommendations
- Custom Node/Express backend

Do not add excluded features unless the architecture is explicitly updated.

## 3. High-Level System Architecture

```text
Browser
  |
  v
React + TypeScript + Vite
  |
  +-- React Router
  +-- React Hook Form + Zod
  +-- TanStack Query
  +-- Tailwind CSS
  |
  v
Typed Data Layer
  |
  v
Supabase JavaScript Client
  |
  +-- Supabase Auth
  +-- Supabase Data API
          |
          v
      PostgreSQL
          |
          v
          RLS
```

There is no custom application server in V1.

## 4. Architectural Principles

1. Keep UI, business logic, server state, and database access separate.
2. Supabase RLS is the authorization boundary.
3. React must never be relied on to enforce data ownership.
4. Real application data must never be exposed publicly.
5. Demo data must be fictional and local to the frontend.
6. Database access must go through a typed data module.
7. Reusable business rules must live in pure utility functions.
8. Feature folders should own their components, hooks, schemas, and API code.
9. Every async screen must support loading, error, empty, and success states.
10. Every destructive action must require confirmation.

## 5. Recommended Folder Structure

```text
applytrack/
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── EmptyState.tsx
│   │   └── layout/
│   │       ├── AppShell.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── MobileNavigation.tsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── AuthProvider.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── applications/
│   │   │   ├── api/
│   │   │   │   └── applications.ts
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schemas/
│   │   │   ├── utils/
│   │   │   └── types.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   └── utils/
│   │   │
│   │   └── demo/
│   │       ├── DemoDashboard.tsx
│   │       ├── DemoBanner.tsx
│   │       └── demoApplications.ts
│   │
│   ├── pages/
│   │   ├── SignInPage.tsx
│   │   ├── SignUpPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── UpdatePasswordPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ApplicationsPage.tsx
│   │   ├── NewApplicationPage.tsx
│   │   ├── EditApplicationPage.tsx
│   │   ├── DemoPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── database.types.ts
│   │   ├── dates.ts
│   │   └── constants.ts
│   │
│   ├── styles/
│   │   └── globals.css
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── supabase/
│   ├── config.toml
│   └── migrations/
│
├── tests/
│   ├── unit/
│   └── e2e/
│
├── .env.example
├── .gitignore
├── AGENTS.md
├── ARCHITECTURE.md
├── DATABASE.md
├── SECURITY.md
├── UI_UX.md
├── TESTING.md
├── IMPLEMENTATION_PLAN.md
├── README.md
├── playwright.config.ts
├── vitest.config.ts
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## 6. Routing Architecture

```text
/
└── redirect to /demo

/demo
/sign-in
/sign-up
/forgot-password
/update-password

/app
├── /app/dashboard
├── /app/applications
├── /app/applications/new
└── /app/applications/:id/edit
```

All `/app/*` routes must be protected.

```text
Router
├── Public Routes
│   ├── Demo
│   ├── Sign In
│   ├── Sign Up
│   └── Password Recovery
│
└── ProtectedRoute
    └── AppShell
        ├── Dashboard
        ├── Applications
        ├── New Application
        └── Edit Application
```

## 7. Data Flow

### Read

```text
Page
  ↓
Feature Hook
  ↓
Feature API Module
  ↓
Supabase Client
  ↓
Supabase Data API
  ↓
RLS
  ↓
PostgreSQL
```

### Mutation

```text
Form
  ↓
Zod Validation
  ↓
Mutation Hook
  ↓
Feature API Module
  ↓
Supabase
  ↓
RLS
  ↓
PostgreSQL
  ↓
Invalidate Query
  ↓
UI Refresh
```

## 8. State Management

### Remote State

Use TanStack Query for:

- Applications
- Application detail
- Create mutations
- Update mutations
- Delete mutations
- Status changes

Suggested query key:

```ts
['applications', userId]
```

Do not add Redux for V1.

### Local UI State

Use local React state or URL parameters for:

- Modal visibility
- Search text
- Selected status
- Confirmation dialog state
- Temporary form state

Recommended application filters URL:

```text
/app/applications?status=interviewing&search=react
```

## 9. Application Data Module

All application database operations should live in:

```text
src/features/applications/api/applications.ts
```

Expected interface:

```ts
getApplications()
getApplicationById(id)
createApplication(input)
updateApplication(id, input)
deleteApplication(id)
updateApplicationStatus(id, status)
```

Large Supabase queries must not be placed directly inside page components.

## 10. Dashboard Architecture

```text
Dashboard
├── Summary Cards
│   ├── Total
│   ├── Applied
│   ├── Interviewing
│   ├── Offers
│   └── Rejected
├── Upcoming Follow-ups
└── Overdue Follow-ups
```

Dashboard data should be derived from the user's applications. Do not create a separate dashboard table.

## 11. Demo Architecture

The public demo must not read the real `applications` table.

```text
Recruiter
  ↓
/demo
  ↓
DemoDashboard
  ↓
demoApplications.ts
```

The demo must use fictional local TypeScript data.

The demo must:

- Work without authentication
- Be labeled as demo mode
- Allow searching/filtering if desired
- Disable create/edit/delete/status mutation actions
- Never access production user records

## 12. Definition of Done

ApplyTrack V1 is complete when:

- Authentication works
- Password recovery works
- Protected routes work
- CRUD works
- Data survives refresh
- Status updates work
- Search works
- Status filtering works
- Dashboard counts are correct
- Follow-up logic is correct
- Desktop table works
- Mobile cards work
- Demo works without authentication
- RLS prevents cross-user access
- Direct API security tests pass
- Unit tests pass
- E2E tests pass
- Type checks pass
- Production build passes
- Vercel deployment works
- README documents setup, security, testing, and architecture
