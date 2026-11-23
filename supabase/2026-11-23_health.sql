-- FitAscend: receive steps and sleep from the iOS Shortcut that reads Apple Health.
-- Paste into Supabase > SQL Editor > New query, then click Run. Safe to run again.
--
-- How it works: the app asks for a personal key (create_health_token). The Shortcut sends that key
-- with the data to ingest_health. Only a hash of the key is stored, and making a new key revokes the old one.

create schema if not exists private; -- not exposed through the API

create table if not exists private.health_tokens (
  user_id    uuid primary key references auth.users on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now()
);

-- one value per day for steps / sleep: update it if present, otherwise insert
create or replace function private.set_single(uid uuid, d date, k text, v numeric) returns void
language sql set search_path = '' as $$
  with upd as (
    update public.entries set value = v, data = '{"source":"health"}'::jsonb
    where user_id = uid and day = d and kind = k
    returning 1
  )
  insert into public.entries (id, user_id, day, kind, value, data)
  select gen_random_uuid(), uid, d, k, v, '{"source":"health"}'::jsonb
  where not exists (select 1 from upd);
$$;

-- sleep arrives as lines "start|end" (ISO 8601); overlapping samples (watch + phone) are merged before summing
create or replace function private.sleep_minutes(p text) returns numeric
language sql immutable set search_path = '' as $$
  select coalesce(round(extract(epoch from sum(upper(r) - lower(r))) / 60), 0)
  from unnest((
    select range_agg(tstzrange(split_part(l, '|', 1)::timestamptz, split_part(l, '|', 2)::timestamptz))
    from regexp_split_to_table(trim(p), '\s*[\r\n]+\s*') as l
    where l like '%|%'
  )) as r;
$$;

-- called from the app by a signed-in user: returns a new key, shown once
create or replace function public.create_health_token() returns text
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  tok text;
begin
  if uid is null then raise exception 'not signed in'; end if;
  tok := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into private.health_tokens (user_id, token_hash)
  values (uid, encode(sha256(convert_to(tok, 'UTF8')), 'hex'))
  on conflict (user_id) do update set token_hash = excluded.token_hash, created_at = now();
  return tok;
end $$;

-- called by the Shortcut (no login, only the key): writes that user's steps and sleep for one day
create or replace function public.ingest_health(p_token text, p_day date, p_steps numeric default null, p_sleep text default null) returns json
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid;
  mins numeric;
begin
  select user_id into uid from private.health_tokens
  where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
  if uid is null then raise exception 'invalid token' using errcode = '28000'; end if;
  if p_day is null or p_day not between current_date - 31 and current_date + 1 then raise exception 'day out of range'; end if;

  if p_steps between 0 and 200000 then perform private.set_single(uid, p_day, 'steps', round(p_steps)); end if;
  if length(p_sleep) between 1 and 20000 then
    mins := private.sleep_minutes(p_sleep);
    if mins between 1 and 1440 then perform private.set_single(uid, p_day, 'sleep', mins); end if;
  end if;
  return json_build_object('day', p_day, 'steps', round(p_steps), 'sleep_min', mins);
end $$;

-- functions are executable by everyone by default: narrow it down
revoke all on schema private from public, anon, authenticated;
revoke execute on function private.set_single(uuid, date, text, numeric) from public, anon, authenticated;
revoke execute on function private.sleep_minutes(text) from public, anon, authenticated;
revoke execute on function public.create_health_token() from public, anon;
grant execute on function public.create_health_token() to authenticated;
revoke execute on function public.ingest_health(text, date, numeric, text) from public;
grant execute on function public.ingest_health(text, date, numeric, text) to anon, authenticated;
