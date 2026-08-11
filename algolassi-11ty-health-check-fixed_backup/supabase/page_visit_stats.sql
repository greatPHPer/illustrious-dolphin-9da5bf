-- Personalized Algolassi page-visit weights for the home search.
-- Run this once in the Supabase SQL Editor for the Algolassi project.

create table if not exists public.page_visit_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  page_path text not null,
  visit_count bigint not null default 0,
  last_visited timestamptz not null default now(),
  primary key (user_id, page_path)
);

create index if not exists page_visit_stats_user_id_idx
  on public.page_visit_stats (user_id);

create index if not exists page_visit_stats_page_path_idx
  on public.page_visit_stats (page_path);

alter table public.page_visit_stats enable row level security;

drop policy if exists "Users can read their own page visits" on public.page_visit_stats;
create policy "Users can read their own page visits"
  on public.page_visit_stats for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own page visits" on public.page_visit_stats;
create policy "Users can insert their own page visits"
  on public.page_visit_stats for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own page visits" on public.page_visit_stats;
create policy "Users can update their own page visits"
  on public.page_visit_stats for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
