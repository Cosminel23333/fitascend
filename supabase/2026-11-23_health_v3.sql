-- FitAscend: health import fixes for the iOS 26 Shortcut (includes everything from v2).
-- 1) sleep lines may carry the sample's value "start|end|value"; "In Bed" / "Awake" are dropped here
-- 2) p_day is optional: when the Shortcut doesn't send it, today's date in Romania is used
-- Paste into Supabase > SQL Editor > New query, then click Run. Safe to run again.

create or replace function private.sleep_minutes(p text) returns numeric
language sql immutable set search_path = '' as $$
  select coalesce(round(extract(epoch from sum(upper(r) - lower(r))) / 60), 0)
  from unnest((
    select range_agg(tstzrange(split_part(l, '|', 1)::timestamptz, split_part(l, '|', 2)::timestamptz))
    from regexp_split_to_table(trim(p), '\s*[\r\n]+\s*') as l
    where l like '%|%'
      -- English and Romanian phone languages
      and split_part(l, '|', 3) !~* '(bed|awake|pat|treaz)'
  )) as r;
$$;
revoke execute on function private.sleep_minutes(text) from public, anon, authenticated;

create or replace function public.ingest_health(p_token text, p_day date default null, p_steps numeric default null, p_sleep text default null) returns json
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid;
  mins numeric;
begin
  select user_id into uid from private.health_tokens
  where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
  if uid is null then raise exception 'invalid token' using errcode = '28000'; end if;
  p_day := coalesce(p_day, (now() at time zone 'Europe/Bucharest')::date);
  if p_day not between current_date - 31 and current_date + 1 then raise exception 'day out of range'; end if;

  if p_steps between 0 and 200000 then perform private.set_single(uid, p_day, 'steps', round(p_steps)); end if;
  if length(p_sleep) between 1 and 20000 then
    mins := private.sleep_minutes(p_sleep);
    if mins between 1 and 1440 then perform private.set_single(uid, p_day, 'sleep', mins); end if;
  end if;
  return json_build_object('day', p_day, 'steps', round(p_steps), 'sleep_min', mins);
end $$;
revoke execute on function public.ingest_health(text, date, numeric, text) from public;
grant execute on function public.ingest_health(text, date, numeric, text) to anon, authenticated;
