-- Pivot: drop the nutrition domain entirely, add game performance stats,
-- and organize the daily routine into categories (Gimnasio / Calentamiento /
-- Recuperación) instead of one flat exercise list.

-- 1) Clean up nutrition-typed rows before dropping their support tables.
delete from public.evaluations where type = 'nutricion';
delete from public.athlete_care_team where role = 'nutriologo';
delete from public.plans where type = 'nutricion';

drop table if exists public.diet_logs cascade;
drop table if exists public.diet_plan_targets cascade;
drop table if exists public.water_logs cascade;
drop table if exists public.diary_diet_entries cascade;
drop table if exists public.food_bank_items cascade;
drop table if exists public.food_categories cascade;
drop table if exists public.meal_slots cascade;
drop table if exists public.athlete_nutrition_status cascade;

alter table public.plans drop column if exists water_target_ml;

-- 2) Routine categories (Gimnasio / Calentamiento / Recuperación) for the
--    daily training checklist.
create table public.routine_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  sort_order int not null
);

insert into public.routine_categories (key, label, sort_order) values
  ('gimnasio', 'Gimnasio', 1),
  ('calentamiento', 'Calentamiento', 2),
  ('recuperacion', 'Recuperación', 3);

alter table public.routine_categories enable row level security;
create policy routine_categories_select on public.routine_categories for select using (auth.uid() is not null);
create policy routine_categories_admin_write on public.routine_categories for all using (is_admin()) with check (is_admin());

alter table public.plan_items add column routine_category_id uuid references public.routine_categories (id);

-- 3) Game performance: one row per game, one row per athlete per game.
create table public.games (
  id uuid primary key default gen_random_uuid(),
  opponent text,
  played_at date not null,
  location text,
  team_score int,
  opponent_score int,
  notes text,
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now()
);

create table public.game_stats (
  game_id uuid not null references public.games (id) on delete cascade,
  athlete_id uuid not null references public.athlete_profiles (id) on delete cascade,
  minutes_played int,
  points int,
  rebounds int,
  assists int,
  steals int,
  blocks int,
  fouls int,
  turnovers int,
  primary key (game_id, athlete_id)
);
create index game_stats_athlete_idx on public.game_stats (athlete_id);

alter table public.games enable row level security;
alter table public.game_stats enable row level security;

create policy games_select on public.games for select
  using (
    is_admin() or is_self(created_by)
    or exists (
      select 1 from public.game_stats gs
      where gs.game_id = games.id and (is_on_care_team(gs.athlete_id) or is_athlete_self(gs.athlete_id))
    )
  );
create policy games_insert on public.games for insert
  with check (
    is_admin() or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('medico', 'entrenador'))
  );
create policy games_update on public.games for update using (is_admin() or is_self(created_by));
create policy games_delete on public.games for delete using (is_admin() or is_self(created_by));

create policy game_stats_select on public.game_stats for select
  using (is_admin() or is_on_care_team(athlete_id) or is_athlete_self(athlete_id));
create policy game_stats_write on public.game_stats for all
  using (is_admin() or is_on_care_team(athlete_id))
  with check (is_admin() or is_on_care_team(athlete_id));
