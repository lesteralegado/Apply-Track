create type public.application_status as enum ('saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn');
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company text not null,
  job_title text not null,
  job_url text,
  status public.application_status not null default 'saved',
  application_date date,
  follow_up_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_company_not_empty check (length(trim(company)) > 0),
  constraint applications_job_title_not_empty check (length(trim(job_title)) > 0),
  constraint applications_application_date_required check (status = 'saved' or application_date is not null),
  constraint applications_job_url_http check (job_url is null or job_url ~* '^https?://')
);
create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger applications_set_updated_at before update on public.applications
for each row execute function public.set_updated_at();
create index applications_owner_updated_idx on public.applications (owner_id, updated_at desc);
create index applications_owner_status_idx on public.applications (owner_id, status);
create index applications_owner_follow_up_idx on public.applications (owner_id, follow_up_date) where follow_up_date is not null;
alter table public.applications enable row level security;
revoke all on table public.applications from public, anon, authenticated;
grant select, insert, update, delete on table public.applications to authenticated;
create policy "Users can view own applications" on public.applications for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Users can create own applications" on public.applications for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Users can update own applications" on public.applications for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Users can delete own applications" on public.applications for delete to authenticated using ((select auth.uid()) = owner_id);
