# ApplyTrack Security Architecture

## 1. Security Goal

Every real application record belongs to one authenticated user and must be inaccessible to other users.

The primary security boundary is PostgreSQL Row-Level Security, not React routing or hidden UI controls.

## 2. Security Model

```text
Browser
  ↓
Supabase Auth Session
  ↓
Supabase Data API
  ↓
PostgreSQL RLS
  ↓
User-owned rows only
```

## 3. Enable RLS

```sql
alter table public.applications
enable row level security;
```

## 4. Table Permissions

Real application data must not be accessible to anonymous visitors.

```sql
revoke all
on table public.applications
from anon;
```

Authenticated users need table-level Data API access before RLS can evaluate row access.

```sql
grant select, insert, update, delete
on table public.applications
to authenticated;
```

## 5. SELECT Policy

```sql
create policy "Users can view own applications"
on public.applications
for select
to authenticated
using (
  (select auth.uid()) = owner_id
);
```

## 6. INSERT Policy

```sql
create policy "Users can create own applications"
on public.applications
for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
);
```

The application should normally omit `owner_id` during insert and allow the database default `auth.uid()` to assign ownership.

## 7. UPDATE Policy

```sql
create policy "Users can update own applications"
on public.applications
for update
to authenticated
using (
  (select auth.uid()) = owner_id
)
with check (
  (select auth.uid()) = owner_id
);
```

`USING` controls whether the existing row can be selected for update.

`WITH CHECK` prevents ownership from being changed to another user.

## 8. DELETE Policy

```sql
create policy "Users can delete own applications"
on public.applications
for delete
to authenticated
using (
  (select auth.uid()) = owner_id
);
```

## 9. Frontend Environment Rules

Allowed in frontend environment configuration:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Never expose:

- Supabase service-role key
- Secret key
- Database password
- Direct Postgres connection string
- Test user passwords

## 10. Public Demo Security

The recruiter demo must use local fictional data.

```text
/demo
  ↓
demoApplications.ts
```

It must not require:

- anonymous SELECT permissions
- an anonymous database policy
- a public database table
- a service key

This keeps the real `applications` table private.

## 11. Protected Routes

All `/app/*` routes must require a valid authenticated session.

Route protection is a UX layer only.

It does not replace RLS.

## 12. Ownership Rules

Users must never be allowed to:

- View another user's applications
- Edit another user's applications
- Delete another user's applications
- Insert an application owned by another user
- Change an existing application's `owner_id`

## 13. Security Verification

Create two test accounts:

```text
User A
User B
```

Test sequence:

1. User A creates Application A.
2. User B signs in.
3. User B attempts to SELECT Application A.
4. User B attempts to UPDATE Application A.
5. User B attempts to DELETE Application A.
6. All attempts must fail or return no accessible row.
7. User A attempts to change `owner_id` to User B.
8. The database must reject the ownership change.

## 14. Direct API Verification

Security tests must not rely only on the UI.

Use an authenticated access token to send direct REST requests against Supabase.

```text
Test Runner
  ↓
User Access Token
  ↓
Supabase REST Endpoint
  ↓
RLS
```

This proves users cannot bypass security by calling the API manually.

## 15. Security Development Rules

- Never disable RLS to fix an access problem.
- Never add a permissive anonymous policy to make the demo work.
- Never use `service_role` from browser code.
- Never authorize based on editable user metadata.
- Never use frontend route protection as authorization.
- Never add a `SECURITY DEFINER` function merely to bypass an RLS issue.
- Keep the dependency lockfile committed.
