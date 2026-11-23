-- FitAscend: each user's own list of supplements (shown as daily checkboxes).
-- Paste into Supabase > SQL Editor > New query, then click Run. Safe to run again.
alter table public.profiles add column if not exists supplements text[] not null default '{}';
