-- FitAscend: a short title per workout (cardio activity such as "run", or a name for a HIIT session).
-- Paste into Supabase > SQL Editor > New query, then click Run. Safe to run again.
alter table public.workouts add column if not exists title text check (char_length(title) <= 60);
