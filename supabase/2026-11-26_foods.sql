-- FitAscend: products added by users when a scanned barcode is in no public database.
-- Shared: every signed-in user can read them (the next scan of that code finds it), only the author can change them.
-- Paste into Supabase > SQL Editor > New query, then click Run. Safe to run again.
create table if not exists public.foods (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  barcode    text not null check (barcode ~ '^[0-9]{6,14}$'),
  name       text not null check (char_length(name) between 1 and 80),
  kcal       numeric not null check (kcal between 0 and 950),      -- all values per 100 g
  protein    numeric check (protein between 0 and 100),
  carbs      numeric check (carbs between 0 and 100),
  fat        numeric check (fat between 0 and 100),
  serving_g  numeric check (serving_g > 0 and serving_g <= 3000),
  created_at timestamptz not null default now()
);

create index if not exists foods_barcode on public.foods (barcode, created_at desc);
create index if not exists foods_user on public.foods (user_id);

alter table public.foods enable row level security;
drop policy if exists foods_read on public.foods;
drop policy if exists own_insert on public.foods;
drop policy if exists own_update on public.foods;
drop policy if exists own_delete on public.foods;
create policy foods_read on public.foods for select to authenticated using (true);
create policy own_insert on public.foods for insert to authenticated with check ((select auth.uid()) = user_id);
create policy own_update on public.foods for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy own_delete on public.foods for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.foods from anon;
grant select, insert, update, delete on public.foods to authenticated;
