-- Decouple athlete profiles from requiring an auth account.
-- An expert can now create a profile for a real athlete with just a name;
-- the athlete can "claim" it later by linking their own login.

-- 1) Give athlete_profiles its own identity.
alter table public.athlete_profiles add column id uuid not null default gen_random_uuid();
alter table public.athlete_profiles add column full_name text;

update public.athlete_profiles ap
set full_name = u.full_name
from public.users u
where u.id = ap.user_id;

alter table public.athlete_profiles alter column full_name set not null;

-- 2) Repoint every table that referenced athlete_profiles(user_id) to the new id.
alter table public.athlete_care_team drop constraint if exists athlete_care_team_athlete_id_fkey;
update public.athlete_care_team t set athlete_id = ap.id from public.athlete_profiles ap where ap.user_id = t.athlete_id;

alter table public.athlete_medical_status drop constraint if exists athlete_medical_status_athlete_id_fkey;
update public.athlete_medical_status t set athlete_id = ap.id from public.athlete_profiles ap where ap.user_id = t.athlete_id;

alter table public.athlete_training_status drop constraint if exists athlete_training_status_athlete_id_fkey;
update public.athlete_training_status t set athlete_id = ap.id from public.athlete_profiles ap where ap.user_id = t.athlete_id;

alter table public.athlete_nutrition_status drop constraint if exists athlete_nutrition_status_athlete_id_fkey;
update public.athlete_nutrition_status t set athlete_id = ap.id from public.athlete_profiles ap where ap.user_id = t.athlete_id;

alter table public.evaluations drop constraint if exists evaluations_athlete_id_fkey;
update public.evaluations t set athlete_id = ap.id from public.athlete_profiles ap where ap.user_id = t.athlete_id;

alter table public.chat_messages drop constraint if exists chat_messages_athlete_id_fkey;
update public.chat_messages t set athlete_id = ap.id from public.athlete_profiles ap where ap.user_id = t.athlete_id;

alter table public.diary_pain_entries drop constraint if exists diary_pain_entries_athlete_id_fkey;
update public.diary_pain_entries t set athlete_id = ap.id from public.athlete_profiles ap where ap.user_id = t.athlete_id;

alter table public.diary_diet_entries drop constraint if exists diary_diet_entries_athlete_id_fkey;
update public.diary_diet_entries t set athlete_id = ap.id from public.athlete_profiles ap where ap.user_id = t.athlete_id;

alter table public.plans drop constraint if exists plans_athlete_id_fkey;
update public.plans t set athlete_id = ap.id from public.athlete_profiles ap where ap.user_id = t.athlete_id;

alter table public.diet_logs drop constraint if exists diet_logs_athlete_id_fkey;
update public.diet_logs t set athlete_id = ap.id from public.athlete_profiles ap where ap.user_id = t.athlete_id;

alter table public.water_logs drop constraint if exists water_logs_athlete_id_fkey;
update public.water_logs t set athlete_id = ap.id from public.athlete_profiles ap where ap.user_id = t.athlete_id;

-- 3) Swap the primary key on athlete_profiles from user_id to id, and make
--    the auth link optional ("claimed_user_id").
alter table public.athlete_profiles drop constraint athlete_profiles_pkey;
alter table public.athlete_profiles rename column user_id to claimed_user_id;
alter table public.athlete_profiles alter column claimed_user_id drop not null;
alter table public.athlete_profiles add primary key (id);
alter table public.athlete_profiles add constraint athlete_profiles_claimed_user_id_key unique (claimed_user_id);

-- 4) Re-add the foreign keys, now pointing at athlete_profiles(id).
alter table public.athlete_care_team add constraint athlete_care_team_athlete_id_fkey foreign key (athlete_id) references public.athlete_profiles (id) on delete cascade;
alter table public.athlete_medical_status add constraint athlete_medical_status_athlete_id_fkey foreign key (athlete_id) references public.athlete_profiles (id) on delete cascade;
alter table public.athlete_training_status add constraint athlete_training_status_athlete_id_fkey foreign key (athlete_id) references public.athlete_profiles (id) on delete cascade;
alter table public.athlete_nutrition_status add constraint athlete_nutrition_status_athlete_id_fkey foreign key (athlete_id) references public.athlete_profiles (id) on delete cascade;
alter table public.evaluations add constraint evaluations_athlete_id_fkey foreign key (athlete_id) references public.athlete_profiles (id) on delete cascade;
alter table public.chat_messages add constraint chat_messages_athlete_id_fkey foreign key (athlete_id) references public.athlete_profiles (id) on delete cascade;
alter table public.diary_pain_entries add constraint diary_pain_entries_athlete_id_fkey foreign key (athlete_id) references public.athlete_profiles (id) on delete cascade;
alter table public.diary_diet_entries add constraint diary_diet_entries_athlete_id_fkey foreign key (athlete_id) references public.athlete_profiles (id) on delete cascade;
alter table public.plans add constraint plans_athlete_id_fkey foreign key (athlete_id) references public.athlete_profiles (id) on delete cascade;
alter table public.diet_logs add constraint diet_logs_athlete_id_fkey foreign key (athlete_id) references public.athlete_profiles (id) on delete cascade;
alter table public.water_logs add constraint water_logs_athlete_id_fkey foreign key (athlete_id) references public.athlete_profiles (id) on delete cascade;

-- 5) New RLS helper: "is this the athlete's own claimed account?"
create function public.is_athlete_self(profile_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.athlete_profiles
    where id = profile_id and claimed_user_id = auth.uid()
  );
$$;

-- 6) Athlete profile policies: experts create/manage profiles; athlete can
--    read/update once claimed.
drop policy if exists athlete_profiles_select on public.athlete_profiles;
create policy athlete_profiles_select on public.athlete_profiles for select
  using (is_athlete_self(id) or is_on_care_team(id) or is_admin());

drop policy if exists athlete_profiles_update_self on public.athlete_profiles;
create policy athlete_profiles_update on public.athlete_profiles for update
  using (is_athlete_self(id) or is_on_care_team(id) or is_admin());

drop policy if exists athlete_profiles_admin_write on public.athlete_profiles;
create policy athlete_profiles_insert on public.athlete_profiles for insert
  with check (
    is_admin() or exists (
      select 1 from public.users u where u.id = auth.uid() and u.role in ('medico', 'entrenador', 'nutriologo')
    )
  );

-- 7) An expert can now assign themself to a new athlete's care team
--    (previously admin-only, which blocked coaches from onboarding players).
drop policy if exists care_team_admin_write on public.athlete_care_team;
create policy care_team_write on public.athlete_care_team for all
  using (is_self(expert_id) or is_admin())
  with check (is_self(expert_id) or is_admin());

-- 8) Swap every is_self(athlete_id) check for is_athlete_self(athlete_id) —
--    athlete_id is no longer an auth user id, it's an athlete_profiles.id.
drop policy if exists medical_status_rw on public.athlete_medical_status;
create policy medical_status_rw on public.athlete_medical_status for select
  using (is_athlete_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());

drop policy if exists training_status_rw on public.athlete_training_status;
create policy training_status_rw on public.athlete_training_status for select
  using (is_athlete_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());

drop policy if exists nutrition_status_rw on public.athlete_nutrition_status;
create policy nutrition_status_rw on public.athlete_nutrition_status for select
  using (is_athlete_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());

drop policy if exists evaluations_select on public.evaluations;
create policy evaluations_select on public.evaluations for select
  using (is_athlete_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());

drop policy if exists chat_select on public.chat_messages;
create policy chat_select on public.chat_messages for select
  using (
    (channel = 'equipo' and (is_on_care_team(athlete_id) or is_admin()))
    or
    (channel = 'atleta' and (is_athlete_self(athlete_id) or is_on_care_team(athlete_id) or is_admin()))
  );

drop policy if exists chat_write on public.chat_messages;
create policy chat_write on public.chat_messages for insert
  with check (
    is_self(author_id) and (
      (channel = 'equipo' and is_on_care_team(athlete_id))
      or
      (channel = 'atleta' and (is_athlete_self(athlete_id) or is_on_care_team(athlete_id)))
    )
  );

drop policy if exists diary_pain_select on public.diary_pain_entries;
create policy diary_pain_select on public.diary_pain_entries for select
  using (is_athlete_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
drop policy if exists diary_pain_write on public.diary_pain_entries;
create policy diary_pain_write on public.diary_pain_entries for insert with check (is_athlete_self(athlete_id));

drop policy if exists diary_diet_select on public.diary_diet_entries;
create policy diary_diet_select on public.diary_diet_entries for select
  using (is_athlete_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
drop policy if exists diary_diet_write on public.diary_diet_entries;
create policy diary_diet_write on public.diary_diet_entries for insert with check (is_athlete_self(athlete_id));

drop policy if exists plans_select on public.plans;
create policy plans_select on public.plans for select
  using (is_athlete_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());

drop policy if exists routine_completions_select on public.routine_completions;
create policy routine_completions_select on public.routine_completions for select
  using (exists (select 1 from public.plan_items pi join public.plans p on p.id = pi.plan_id
    where pi.id = plan_item_id and (is_athlete_self(p.athlete_id) or is_on_care_team(p.athlete_id) or is_admin())));
drop policy if exists routine_completions_write on public.routine_completions;
create policy routine_completions_write on public.routine_completions for all
  using (exists (select 1 from public.plan_items pi join public.plans p on p.id = pi.plan_id
    where pi.id = plan_item_id and is_athlete_self(p.athlete_id)))
  with check (exists (select 1 from public.plan_items pi join public.plans p on p.id = pi.plan_id
    where pi.id = plan_item_id and is_athlete_self(p.athlete_id)));

drop policy if exists diet_plan_targets_select on public.diet_plan_targets;
create policy diet_plan_targets_select on public.diet_plan_targets for select
  using (exists (select 1 from public.plans p where p.id = plan_id
    and (is_athlete_self(p.athlete_id) or is_on_care_team(p.athlete_id) or is_admin())));

drop policy if exists diet_logs_select on public.diet_logs;
create policy diet_logs_select on public.diet_logs for select
  using (is_athlete_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
drop policy if exists diet_logs_write on public.diet_logs;
create policy diet_logs_write on public.diet_logs for all
  using (is_athlete_self(athlete_id)) with check (is_athlete_self(athlete_id));

drop policy if exists water_logs_select on public.water_logs;
create policy water_logs_select on public.water_logs for select
  using (is_athlete_self(athlete_id) or is_on_care_team(athlete_id) or is_admin());
drop policy if exists water_logs_write on public.water_logs;
create policy water_logs_write on public.water_logs for all
  using (is_athlete_self(athlete_id)) with check (is_athlete_self(athlete_id));

-- 9) When someone signs up with an email that matches an unclaimed profile's
--    invite, nothing auto-links yet — claiming an existing profile is a
--    manual step for now (see lib/data/roster-actions.ts).
