# ApplyTrack Architecture

ApplyTrack uses React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Firebase Authentication, and Cloud Firestore. Firebase replaced Supabase because the user's free project slots were occupied.

## System and boundaries

Browser → React UI → feature hooks → typed data module → Firebase web SDK → Authentication / Firestore → Firestore Security Rules. There is no custom server. Rules enforce ownership even when requests bypass React.

- `src/features/auth/`: account operations, auth state, protected routes.
- `src/features/applications/`: forms, storage operations, validation, search, filtering.
- `src/features/dashboard/`: counts, due/upcoming selectors, local-day updates, review dialog.
- `src/features/demo/`: fictional local data; no real application requests.
- `src/lib/firebase/client.ts`: validated configuration and development emulators.
- `src/app/`: providers and routes.

Public routes: `/demo`, `/sign-in`, `/sign-up`, `/forgot-password`, `/update-password`. Protected routes: `/app/dashboard`, `/app/applications`, `/app/applications/new`, `/app/applications/:id/edit`. The root redirects to the demo; signed-out protected visits redirect to sign-in.

## Authentication and cache

Firebase persists the browser session; `onAuthStateChanged` initializes identity. Query keys include UID. Identity changes cancel queries and clear the cache. Data functions receive an explicit owner UID, verify the current account, use server-confirmed reads, validate documents, and check cancellation before returning.

Password recovery uses Firebase's default hosted handler or the optional `/update-password` page, which validates the action code and confirms the reset. Configure the email template action URL before using the custom handler on a deployed website.

## Data and conflicts

Applications live at `users/{uid}/applications/{id}`. Calendar dates stay strings; creation/update and review times are committed Firestore timestamps converted to ISO strings for display. A separate client revision preserves update timestamp seconds and nanoseconds. See [DATABASE.md](DATABASE.md) and [SECURITY.md](SECURITY.md).

Review and ordinary-edit transactions compare the revision loaded with the draft against the current document. Missing or changed records are rejected without overwriting data. Background query refresh cannot silently adopt a newer revision for an existing draft. Status changes also use transactions because the application date depends on the stored record.

Single-field updated-date ordering uses Firestore's default index. Search and status filters operate on fetched records, matching the personal-tracker scope.

## Finite follow-up review

Due work includes Saved, Applied, and Interviewing records dated on or before local today, ordered by date, company, then ID. Upcoming work is separate: after today through seven days ahead. Undated and terminal-status records are excluded.

Review changes only the schedule, latest review metadata, and update timestamp. Reviewed and Waiting consume the due date and allow a blank or strictly future next date. Stop following up clears the date. Hiring stage and application details remain unchanged; no outcome implies that a message was sent. An explicit date entered later creates another obligation, including after Stop. There is no review history or stored daily completion flag.

Commit acknowledgment settles a review or ordinary-edit save before background query refresh. A dashboard receipt identifies the acknowledged application and its old revision, disabling repeat review until fresh data arrives. Refresh failure gets separate feedback without inviting another write or claiming verified completion. Completion requires a successful current list with zero due work and no pending save or refresh.

The dashboard is keyed by UID. Account changes clear drafts, selections, receipts, and success messages; late callbacks check identity. `useLocalToday` updates at local midnight and on focus/visibility restoration. Review validation recomputes today at submission. Scheduling never converts calendar dates into UTC timestamps.

## Scope

No AI, scraping, email reminders, uploads, calendar integration, custom backend, activity timeline, offline review queue, periodic polling, or new route is included. The portfolio remains independent. The original Supabase architecture bundle and SQL remain historical; current root documentation governs Firebase.

This feature is locally verified. Hosted rule publication and frontend deployment remain separate work.
