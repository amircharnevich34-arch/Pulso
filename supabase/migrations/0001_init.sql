-- Pulso — initial schema, roles and row-level security
-- See docs/plan (or chat history) for the reasoning behind this shape.

-- ============================================================
-- Enums
-- ============================================================
create type public.user_role as enum ('medico', 'entrenador', 'nutriologo', 'deportista', 'admin');
create type public.expert_role as enum ('medico', 'entrenador', 'nutriologo');
create type public.evaluation_type as enum ('medica', 'entrenamiento', 'nutricion');
create type public.pain_zone as enum (
  'cuello', 'hombro_izquierdo', 'hombro_derecho', 'zona_lumbar_cadera',
  'rodilla_izquierda', 'rodilla_derecha', 'tobillo_izquierdo', 'tobillo_derecho'
);
create type public.energy_level as enum ('alta', 'media', 'baja');
create type public.plan_type as enum ('entrenamiento', 'nutricion');
create type public.athlete_status as enum ('active', 'inactive');

-- ============================================================
-- Identity & care team
-- ============================================================
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Keep public.users in sync with new auth signups.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'deportista')
  )
  on conflict (id) do nothing;
  return new;
exception
  when others then
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.athlete_profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  sport text,
  birth_date date,
  status public.athlete_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.athlete_care_team (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles (user_id) on delete cascade,
  expert_id uuid not null references public.users (id) on delete cascade,
  role public.expert_role not null,
  is_active boolean not null default true,
  assigned_at timestamptz not null default now()
);

-- One active expert per role per athlete.
create unique index athlete_care_team_active_role_idx
  on public.athlete_care_team (athlete_id, role)
  where is_active;

create index athlete_care_team_expert_idx on public.athlete_care_team (expert_id) where is_active;

-- ============================================================
-- Helper functions (used by every RLS policy below)
-- ============================================================
create function public.is_self(check_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select auth.uid() = check_user_id;
$$;

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

create function public.is_on_care_team(check_athlete_id uuid, requesting_role public.expert_role default null)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.athlete_care_team
    where athlete_id = check_athlete_id
      and expert_id = auth.uid()
      and is_active
      and (requesting_role is null or role = requesting_role)
  );
$$;

-- ============================================================
-- Domain "current status" (one row per athlete, ficha tabs)
-- ============================================================
create table public.athlete_medical_status (
  athlete_id uuid primary key references public.athlete_profiles (user_id) on delete cascade,
  resting_hr int,
  blood_pressure text,
  active_injury_text text,
  next_checkup_date date,
  pain_zone public.pain_zone,
  pain_severity smallint check (pain_severity between 0 and 10),
  updated_at timestamptz not null default now()
);

create table public.athlete_training_status (
  athlete_id uuid primary key references public.athlete_profiles (user_id) on delete cascade,
  vo2max numeric,
  max_strength text,
  speed_test_result text,
  current_plan_id uuid,
  next_session_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.athlete_nutrition_status (
  athlete_id uuid primary key references public.athlete_profiles (user_id) on delete cascade,
  current_plan_id uuid,
  calorie_target int,
  protein_g int,
  carbs_g int,
  fat_g int,
  next_consult_date date,
  adherence_pct smallint check (adherence_pct between 0 and 100),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- History: evaluations, chat, diaries
-- ============================================================
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles (user_id) on delete cascade,
  author_id uuid not null references public.users (id),
  type public.evaluation_type not null,
  occurred_at timestamptz not null default now(),
  notes text,
  pain_zone public.pain_zone,
  pain_severity smallint check (pain_severity between 0 and 10),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index evaluations_athlete_idx on public.evaluations (athlete_id, occurred_at desc);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles (user_id) on delete cascade,
  author_id uuid not null references public.users (id),
  role_at_time public.user_role not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index chat_messages_athlete_idx on public.chat_messages (athlete_id, created_at);

create table public.diary_pain_entries (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles (user_id) on delete cascade,
  entry_date date not null default (now() at time zone 'America/Mexico_City')::date,
  pain_zone public.pain_zone,
  pain_severity smallint check (pain_severity between 0 and 10),
  energy_level public.energy_level,
  notes text,
  created_at timestamptz not null default now()
);
create index diary_pain_entries_athlete_idx on public.diary_pain_entries (athlete_id, entry_date desc);

create table public.diary_diet_entries (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athlete_profiles (user_id) on delete cascade,
  entry_date date not null default (now() at time zone 'America/Mexico_City')::date,
  notes text not null,
  created_at timestamptz not null default now()
);
create index diary_diet_entries_athlete_idx on public.diary_diet_entries (athlete_id, entry_date desc);

-- ============================================================
-- Plans & daily routine tracking
-- ============================================================
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  type public.plan_type not null,
  name text not null,
  athlete_id uuid not null references public.athlete_profiles (user_id) on delete cascade,
  water_target_ml int,
  notes text,
  expires_at date,
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now()
);
create index plans_athlete_idx on public.plans (athlete_id, type);

alter table public.athlete_training_status
  add constraint athlete_training_status_plan_fk
  foreign key (current_plan_id) references public.plans (id) on delete set null;
alter table public.athlete_nutrition_status
  add constraint athlete_nutrition_status_plan_fk
  foreign key (current_plan_id) references public.plans (id) on delete set null;

create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  position int not null default 0,
  description text not null
);

create table public.routine_completions (
  plan_item_id uuid not null references public.plan_items (id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  completed_at timestamptz not null default now(),
  primary key (plan_item_id, log_date)
);

-- ============================================================
-- Diet: meal slots, food categories, food bank, targets, logs
-- ============================================================
create table public.meal_slots (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  sort_order int not null
);

create table public.food_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  sort_order int not null
);

create table public.food_bank_items (
  id uuid primary key default gen_random_uuid(),
  food_category_id uuid not null references public.food_categories (id) on delete cascade,
  name text not null,
  portion_description text,
  active boolean not null default true,
  unique (food_category_id, name)
);
create index food_bank_items_category_idx on public.food_bank_items (food_category_id) where active;

-- Only a row when a target is actually assigned (target_portions > 0 by convention).
create table public.diet_plan_targets (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  meal_slot_id uuid not null references public.meal_slots (id),
  food_category_id uuid not null references public.food_categories (id),
  target_portions smallint not null check (target_portions > 0),
  unique (plan_id, meal_slot_id, food_category_id)
);

create table public.diet_logs (
  athlete_id uuid not null references public.athlete_profiles (user_id) on delete cascade,
  log_date date not null,
  meal_slot_id uuid not null references public.meal_slots (id),
  food_bank_item_id uuid not null references public.food_bank_items (id),
  portion_count smallint not null default 0 check (portion_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (athlete_id, log_date, meal_slot_id, food_bank_item_id)
);

create table public.water_logs (
  athlete_id uuid not null references public.athlete_profiles (user_id) on delete cascade,
  log_date date not null,
  total_ml int not null default 0 check (total_ml >= 0),
  primary key (athlete_id, log_date)
);

-- ============================================================
-- Public profile view (safe fields only — no email/phone)
-- ============================================================
create view public.public_profiles as
  select id, full_name, role, avatar_url from public.users;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.users enable row level security;
alter table public.athlete_profiles enable row level security;
alter table public.athlete_care_team enable row level security;
alter table public.athlete_medical_status enable row level security;
alter table public.athlete_training_status enable row level security;
alter table public.athlete_nutrition_status enable row level security;
alter table public.evaluations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.diary_pain_entries enable row level security;
alter table public.diary_diet_entries enable row level security;
alter table public.plans enable row level security;
alter table public.plan_items enable row level security;
alter table public.routine_completions enable row level security;
alter table public.meal_slots enable row level security;
alter table public.food_categories enable row level security;
alter table public.food_bank_items enable row level security;
alter table public.diet_plan_targets enable row level security;
alter table public.diet_logs enable row level security;
alter table public.water_logs enable row level security;

-- users: self read/update; admin reads all; public_profiles view covers cross-user display.
create policy users_select_self on public.users for select using (is_self(id) or is_admin());
create policy users_update_self on public.users for update using (is_self(id));

-- athlete_profiles: athlete reads/writes own; care team reads; admin all.
create policy athlete_profiles_select on public.athlete_profiles for select
  using (is_self(user_id) or is_on_care_team(user_id) or is_admin());
create policy athlete_profiles_update_self on public.athlete_profiles for update using (is_self(user_id));
create policy athlete_profiles_admin_write on public.athlete_profiles for insert with check (is_admin());

-- athlete_care_team: athlete + assigned experts can read; only admin manages assignments for now.
create policy care_team_select on public.athlete_care_team for select
  using (is_self(athlete_id) or is_self(expert_id) or is_admin());
create policy care_team_admin_write on public.athlete_care_team for all
  using (is_admin()) with check (is_admin());

-- status tables: athlete reads own; any assigned expert reads/writes (see plan §2 open decision — starting permissive for the pilot).
create policy medical_status_rw on public.athlete_medical_status for select
  using (is_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
create policy medical_status_write on public.athlete_medical_status for all
  using (is_on_care_team(athlete_id) or is_admin()) with check (is_on_care_team(athlete_id) or is_admin());

create policy training_status_rw on public.athlete_training_status for select
  using (is_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
create policy training_status_write on public.athlete_training_status for all
  using (is_on_care_team(athlete_id) or is_admin()) with check (is_on_care_team(athlete_id) or is_admin());

create policy nutrition_status_rw on public.athlete_nutrition_status for select
  using (is_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
create policy nutrition_status_write on public.athlete_nutrition_status for all
  using (is_on_care_team(athlete_id) or is_admin()) with check (is_on_care_team(athlete_id) or is_admin());

-- evaluations: athlete reads own; care team reads + writes.
create policy evaluations_select on public.evaluations for select
  using (is_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
create policy evaluations_write on public.evaluations for insert
  with check (is_on_care_team(athlete_id) or is_admin());

-- chat: athlete + care team read and write.
create policy chat_select on public.chat_messages for select
  using (is_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
create policy chat_write on public.chat_messages for insert
  with check (is_self(author_id) and (is_self(athlete_id) or is_on_care_team(athlete_id)));

-- diaries: athlete writes own; care team reads (closes the feedback loop with experts).
create policy diary_pain_select on public.diary_pain_entries for select
  using (is_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
create policy diary_pain_write on public.diary_pain_entries for insert with check (is_self(athlete_id));

create policy diary_diet_select on public.diary_diet_entries for select
  using (is_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
create policy diary_diet_write on public.diary_diet_entries for insert with check (is_self(athlete_id));

-- plans + items: athlete reads own; care team reads + writes.
create policy plans_select on public.plans for select
  using (is_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
create policy plans_write on public.plans for all
  using (is_on_care_team(athlete_id) or is_admin()) with check (is_on_care_team(athlete_id) or is_admin());

create policy plan_items_select on public.plan_items for select
  using (exists (select 1 from public.plans p where p.id = plan_id
    and (is_self(p.athlete_id) or is_on_care_team(p.athlete_id) or is_admin())));
create policy plan_items_write on public.plan_items for all
  using (exists (select 1 from public.plans p where p.id = plan_id and (is_on_care_team(p.athlete_id) or is_admin())))
  with check (exists (select 1 from public.plans p where p.id = plan_id and (is_on_care_team(p.athlete_id) or is_admin())));

-- routine_completions: athlete writes own via the plan_item's athlete; care team reads.
create policy routine_completions_select on public.routine_completions for select
  using (exists (select 1 from public.plan_items pi join public.plans p on p.id = pi.plan_id
    where pi.id = plan_item_id and (is_self(p.athlete_id) or is_on_care_team(p.athlete_id) or is_admin())));
create policy routine_completions_write on public.routine_completions for all
  using (exists (select 1 from public.plan_items pi join public.plans p on p.id = pi.plan_id
    where pi.id = plan_item_id and is_self(p.athlete_id)))
  with check (exists (select 1 from public.plan_items pi join public.plans p on p.id = pi.plan_id
    where pi.id = plan_item_id and is_self(p.athlete_id)));

-- diet_plan_targets: same visibility as the parent plan.
create policy diet_plan_targets_select on public.diet_plan_targets for select
  using (exists (select 1 from public.plans p where p.id = plan_id
    and (is_self(p.athlete_id) or is_on_care_team(p.athlete_id) or is_admin())));
create policy diet_plan_targets_write on public.diet_plan_targets for all
  using (exists (select 1 from public.plans p where p.id = plan_id and (is_on_care_team(p.athlete_id) or is_admin())))
  with check (exists (select 1 from public.plans p where p.id = plan_id and (is_on_care_team(p.athlete_id) or is_admin())));

-- diet_logs / water_logs: athlete writes own; care team reads.
create policy diet_logs_select on public.diet_logs for select
  using (is_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
create policy diet_logs_write on public.diet_logs for all
  using (is_self(athlete_id)) with check (is_self(athlete_id));

create policy water_logs_select on public.water_logs for select
  using (is_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
create policy water_logs_write on public.water_logs for all
  using (is_self(athlete_id)) with check (is_self(athlete_id));

-- reference data: everyone authenticated can read; only admin manages content.
create policy meal_slots_select on public.meal_slots for select using (auth.uid() is not null);
create policy meal_slots_admin_write on public.meal_slots for all using (is_admin()) with check (is_admin());

create policy food_categories_select on public.food_categories for select using (auth.uid() is not null);
create policy food_categories_admin_write on public.food_categories for all using (is_admin()) with check (is_admin());

create policy food_bank_items_select on public.food_bank_items for select using (auth.uid() is not null);
create policy food_bank_items_admin_write on public.food_bank_items for all
  using (is_admin() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'nutriologo'))
  with check (is_admin() or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'nutriologo'));
