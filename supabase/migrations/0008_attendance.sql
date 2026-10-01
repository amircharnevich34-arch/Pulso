-- Attendance: recurring practice schedule (Lunes 19:00-21:00,
-- Miércoles 07:00-09:00, Sábado 08:00-10:00) and per-athlete attendance
-- tracking per session.

create table public.practices (
  id uuid primary key default gen_random_uuid(),
  practice_date date not null unique,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices (id) on delete cascade,
  athlete_id uuid not null references public.athlete_profiles (id) on delete cascade,
  status text not null check (status in ('presente', 'ausente')),
  marked_by uuid references public.users (id),
  marked_at timestamptz not null default now(),
  unique (practice_id, athlete_id)
);
create index attendance_practice_idx on public.attendance (practice_id);
create index attendance_athlete_idx on public.attendance (athlete_id);

-- Generate the recurring schedule through the end of the year, starting
-- from the next upcoming session (this week's Lunes/Miércoles already passed).
insert into public.practices (practice_date, start_time, end_time)
select
  d::date,
  case extract(dow from d)::int
    when 1 then time '19:00'
    when 3 then time '07:00'
    when 6 then time '08:00'
  end,
  case extract(dow from d)::int
    when 1 then time '21:00'
    when 3 then time '09:00'
    when 6 then time '10:00'
  end
from generate_series('2026-10-03'::date, '2026-12-31'::date, interval '1 day') d
where extract(dow from d)::int in (1, 3, 6)
on conflict (practice_date) do nothing;

alter table public.practices enable row level security;
alter table public.attendance enable row level security;

create policy practices_select on public.practices for select using (auth.uid() is not null);
create policy practices_write on public.practices for all
  using (is_admin() or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('medico', 'entrenador')))
  with check (is_admin() or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('medico', 'entrenador')));

create policy attendance_select on public.attendance for select
  using (
    is_admin()
    or is_athlete_self(athlete_id)
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('medico', 'entrenador'))
  );
create policy attendance_write on public.attendance for all
  using (is_admin() or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('medico', 'entrenador')))
  with check (is_admin() or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('medico', 'entrenador')));
