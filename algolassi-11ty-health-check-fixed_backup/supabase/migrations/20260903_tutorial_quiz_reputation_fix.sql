-- Algolassi 11.0: fix tutorial quiz reputation RPC
-- Run this after 20260903_tutorial_quiz_reputation.sql in Supabase SQL Editor.

create or replace function public.award_tutorial_quiz_reputation(
    p_quiz_key text,
    p_points integer default 1
)
returns table (awarded boolean, reputation integer)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid := auth.uid();
    v_awarded boolean := false;
    v_reputation integer := 0;
begin
    if v_user_id is null then
        raise exception 'Authentication required';
    end if;

    if coalesce(length(trim(p_quiz_key)), 0) = 0 then
        raise exception 'Quiz key is required';
    end if;

    if coalesce(p_points, 0) <= 0 or p_points > 10 then
        raise exception 'Invalid quiz points';
    end if;

    insert into public.tutorial_quiz_rewards(user_id, quiz_key, points)
    values (v_user_id, trim(p_quiz_key), p_points)
    on conflict (user_id, quiz_key) do nothing;

    if found then
        update public.profiles as p
        set reputation = coalesce(p.reputation, 0) + p_points,
            updated_at = now()
        where p.user_id = v_user_id
        returning p.reputation into v_reputation;
        v_awarded := true;
    else
        select p.reputation into v_reputation
        from public.profiles as p
        where p.user_id = v_user_id;
    end if;

    return query select v_awarded, coalesce(v_reputation, 0);
end;
$$;

revoke all on function public.award_tutorial_quiz_reputation(text, integer) from public;
grant execute on function public.award_tutorial_quiz_reputation(text, integer) to authenticated;
