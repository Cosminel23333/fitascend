-- FitAscend: database schema.
-- Paste the whole file into Supabase > SQL Editor > New query, then click Run.
-- Safe to run again: it only creates what is missing.

-- one row per user: onboarding answers + chosen calorie goal
create table if not exists public.profiles (
  user_id      uuid primary key default auth.uid() references auth.users on delete cascade,
  name         text,
  sex          text check (sex in ('m', 'f')),
  birth_date   date,
  height_cm    numeric check (height_cm between 100 and 250),
  weight_kg    numeric check (weight_kg between 30 and 300),
  body_fat_pct numeric check (body_fat_pct between 3 and 60),
  activity     text check (activity in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal         text check (goal in ('cut_aggressive', 'cut', 'maintain', 'lean_bulk', 'bulk')),
  level        text check (level in ('beginner', 'intermediate', 'advanced')),
  lang         text default 'ro' check (lang in ('ro', 'en')),
  supplements  text[] not null default '{}',
  updated_at   timestamptz not null default now()
);

create table if not exists public.workouts (
  id           uuid primary key,
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  day          date not null,
  kind         text not null check (kind in ('strength', 'cardio', 'hiit')),
  title        text check (char_length(title) <= 60),
  duration_min numeric check (duration_min >= 0),
  distance_km  numeric check (distance_km >= 0),
  rounds       int check (rounds >= 0),
  notes        text,
  created_at   timestamptz not null default now()
);

create table if not exists public.workout_sets (
  id            uuid primary key,
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  workout_id    uuid not null references public.workouts on delete cascade,
  exercise_id   text not null,
  exercise_name text not null,
  set_no        int not null check (set_no > 0),
  reps          int check (reps >= 0),
  weight_kg     numeric check (weight_kg >= 0),
  created_at    timestamptz not null default now()
);

-- everything logged during a day, one row per entry (water can be logged many times a day)
create table if not exists public.entries (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  day        date not null,
  kind       text not null check (kind in ('water', 'meal', 'sleep', 'steps', 'screen', 'weight', 'supplement')),
  value      numeric,
  data       jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_exercises (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  muscles    text[],
  created_at timestamptz not null default now()
);

create index if not exists workouts_user_day on public.workouts (user_id, day);
create index if not exists workout_sets_workout on public.workout_sets (workout_id);
create index if not exists workout_sets_user on public.workout_sets (user_id);
create index if not exists entries_user_day on public.entries (user_id, day);
create index if not exists custom_exercises_user on public.custom_exercises (user_id);

-- Row Level Security: every user sees and changes only their own rows
do $$
declare t text;
begin
  foreach t in array array['profiles', 'workouts', 'workout_sets', 'entries', 'custom_exercises'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists own_select on public.%I', t);
    execute format('drop policy if exists own_insert on public.%I', t);
    execute format('drop policy if exists own_update on public.%I', t);
    execute format('drop policy if exists own_delete on public.%I', t);
    execute format('create policy own_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy own_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy own_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy own_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
    -- new projects no longer expose tables to the API automatically; signed-in users only, never anon
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- a set may only point at a workout owned by the same user
create or replace function public.check_set_owner() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.workouts w where w.id = new.workout_id and w.user_id = new.user_id) then
    raise exception 'workout does not belong to user';
  end if;
  return new;
end $$;

drop trigger if exists workout_sets_owner on public.workout_sets;
create trigger workout_sets_owner before insert or update on public.workout_sets
  for each row execute function public.check_set_owner();
