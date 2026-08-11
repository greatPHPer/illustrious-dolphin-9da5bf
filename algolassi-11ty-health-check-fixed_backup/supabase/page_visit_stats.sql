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

-- Atomic increment used by the website when an authenticated user visits a page.
-- The function derives the user from auth.uid(), so the browser cannot choose
-- another user's user_id. SECURITY DEFINER is used only for this controlled
-- operation and the search_path is pinned to prevent search_path attacks.
create or replace function public.increment_page_visit(p_page_path text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_count bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_page_path is null or length(trim(p_page_path)) = 0 then
    raise exception 'Page path is required';
  end if;

  insert into public.page_visit_stats (user_id, page_path, visit_count, last_visited)
  values (v_user_id, left(trim(p_page_path), 500), 1, now())
  on conflict (user_id, page_path)
  do update set
    visit_count = public.page_visit_stats.visit_count + 1,
    last_visited = now()
  returning visit_count into v_count;

  return v_count;
end;
$$;

revoke all on function public.increment_page_visit(text) from public;
grant execute on function public.increment_page_visit(text) to authenticated;
