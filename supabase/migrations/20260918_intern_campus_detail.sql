-- Intern campus detail page: account credentials + Instagram review log,
-- plus RLS for the pre-existing but previously policy-less goals_tasks table.
--
-- Reused without changes: campuses.goals_notes, goals_tasks, prospects
-- (prospects.instagram_handle / prospects.found_by already exist).

-- ── campus_credentials ──────────────────────────────────────────────
-- One shared account password per campus (e.g. Instagram login).
create table if not exists campus_credentials (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null unique references campuses(id) on delete cascade,
  password text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

alter table campus_credentials enable row level security;

drop policy if exists "campus_credentials_intern_select" on campus_credentials;
create policy "campus_credentials_intern_select" on campus_credentials
  for select
  using (
    exists (
      select 1 from campus_assignments ca
      where ca.campus_id = campus_credentials.campus_id
        and ca.intern_id = auth.uid()
    )
  );

drop policy if exists "campus_credentials_intern_insert" on campus_credentials;
create policy "campus_credentials_intern_insert" on campus_credentials
  for insert
  with check (
    exists (
      select 1 from campus_assignments ca
      where ca.campus_id = campus_credentials.campus_id
        and ca.intern_id = auth.uid()
    )
  );

drop policy if exists "campus_credentials_intern_update" on campus_credentials;
create policy "campus_credentials_intern_update" on campus_credentials
  for update
  using (
    exists (
      select 1 from campus_assignments ca
      where ca.campus_id = campus_credentials.campus_id
        and ca.intern_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from campus_assignments ca
      where ca.campus_id = campus_credentials.campus_id
        and ca.intern_id = auth.uid()
    )
  );

drop policy if exists "campus_credentials_staff_all" on campus_credentials;
create policy "campus_credentials_staff_all" on campus_credentials
  for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('manager', 'developer'))
  )
  with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('manager', 'developer'))
  );

-- ── instagram_review_log ────────────────────────────────────────────
-- Append-only log of Add-to-follow-list / Skip decisions an intern makes
-- while manually reviewing handles copied from a followers/likes list on
-- Instagram itself. Never scrapes or automates Instagram.
create table if not exists instagram_review_log (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references campuses(id) on delete cascade,
  intern_id uuid not null references profiles(id),
  handle text not null,
  decision text not null check (decision in ('added', 'skipped')),
  created_at timestamptz not null default now()
);

alter table instagram_review_log enable row level security;

drop policy if exists "review_log_intern_select" on instagram_review_log;
create policy "review_log_intern_select" on instagram_review_log
  for select
  using (intern_id = auth.uid());

drop policy if exists "review_log_intern_insert" on instagram_review_log;
create policy "review_log_intern_insert" on instagram_review_log
  for insert
  with check (
    intern_id = auth.uid()
    and exists (
      select 1 from campus_assignments ca
      where ca.campus_id = instagram_review_log.campus_id
        and ca.intern_id = auth.uid()
    )
  );

drop policy if exists "review_log_staff_all" on instagram_review_log;
create policy "review_log_staff_all" on instagram_review_log
  for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('manager', 'developer'))
  )
  with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('manager', 'developer'))
  );

-- ── goals_tasks: add RLS (table already existed, unused, no policies) ──
alter table goals_tasks enable row level security;

drop policy if exists "goals_tasks_intern_all" on goals_tasks;
create policy "goals_tasks_intern_all" on goals_tasks
  for all
  using (intern_id = auth.uid())
  with check (intern_id = auth.uid());

drop policy if exists "goals_tasks_staff_all" on goals_tasks;
create policy "goals_tasks_staff_all" on goals_tasks
  for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('manager', 'developer'))
  )
  with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('manager', 'developer'))
  );
