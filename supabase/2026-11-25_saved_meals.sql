-- FitAscend: each user's saved meals (added to the day with one tap).
-- Paste into Supabase > SQL Editor > New query, then click Run. Safe to run again.
alter table public.profiles add column if not exists saved_meals jsonb not null default '[]';
