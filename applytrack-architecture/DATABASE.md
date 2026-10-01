# ApplyTrack Database Architecture

## 1. Database Scope

ApplyTrack V1 uses one main application table plus Supabase Auth.

```text
Supabase Auth
└── auth.users

public
└── applications
```

Do not add unnecessary profile, analytics, notifications, or audit tables in V1.

## 2. Application Status Enum

```sql
create type public.application_status as enum (
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn'
);
```

## 3. Applications Table

```sql
create table public.applications (
  id uuid primary key default gen_random_uuid(),

  owner_id uuid not null
    default auth.uid()
    references auth.users(id)
    on delete cascade,

  company text not null,
  job_title text not null,
  job_url text,

  status public.application_status
    not null
    default 'saved',

  application_date date,
  follow_up_date date,

  notes text,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint applications_company_not_empty
    check (length(trim(company)) > 0),

  constraint applications_job_title_not_empty
    check (length(trim(job_title)) > 0),

  constraint applications_application_date_required
    check (
      status = 'saved'
      or application_date is not null
    )
);
```

## 4. Field Rules

### Required

- `company`
- `job_title`
- `status`
- `owner_id`

### Optional

- `job_url`
- `application_date` when status is `saved`
- `follow_up_date`
- `notes`

### Application Date Rule

```text
saved        -> application_date optional
applied      -> required
interviewing -> required
offer        -> required
rejected     -> required
withdrawn    -> required
```

## 5. Updated Timestamp

Add a trigger so `updated_at` changes whenever the row changes.

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_set_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();
```

Do not rely on the browser to set `updated_at`.

## 6. Recommended Indexes

```sql
create index applications_owner_updated_idx
on public.applications (
  owner_id,
  updated_at desc
);

create index applications_owner_status_idx
on public.applications (
  owner_id,
  status
);

create index applications_owner_follow_up_idx
on public.applications (
  owner_id,
  follow_up_date
)
where follow_up_date is not null;
```

## 7. Migration Strategy

All schema changes must be reproducible.

Store migrations under:

```text
supabase/migrations/
```

Suggested migration order:

```text
001_create_application_status.sql
002_create_applications.sql
003_create_updated_at_trigger.sql
004_enable_rls_and_policies.sql
005_create_indexes.sql
```

Use the Supabase CLI migration workflow rather than manually changing production without recording migrations.

## 8. Type Generation

Generated Supabase TypeScript types belong in:

```text
src/lib/supabase/database.types.ts
```

The Supabase client should use:

```ts
createClient<Database>(...)
```

Do not maintain a second hand-written copy of the full database schema.

Feature-specific form types are allowed.

## 9. Application DTO

The create/edit form should not control ownership or database-generated metadata.

```ts
export type ApplicationInput = {
  company: string;
  jobTitle: string;
  jobUrl?: string;
  status: ApplicationStatus;
  applicationDate?: string;
  followUpDate?: string;
  notes?: string;
};
```

Do not expose these fields to the form:

- `id`
- `owner_id`
- `created_at`
- `updated_at`

## 10. Query Behavior

Default application list ordering:

```text
updated_at DESC
```

Search in V1 can happen in the frontend against loaded user records.

Do not introduce full-text search until the dataset or product requirements justify it.

## 11. Date Storage

Use PostgreSQL `date` for:

- `application_date`
- `follow_up_date`

Use `timestamptz` for:

- `created_at`
- `updated_at`

Do not convert date-only values through UTC unnecessarily.
