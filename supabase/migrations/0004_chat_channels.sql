-- Split chat_messages into two channels:
-- 'equipo'  -> experts only (existing team chat)
-- 'atleta'  -> athlete <-> experts (new "mural" / Q&A)

create type public.chat_channel as enum ('equipo', 'atleta');

alter table public.chat_messages
  add column channel public.chat_channel not null default 'equipo';

drop policy if exists chat_select on public.chat_messages;
drop policy if exists chat_write on public.chat_messages;

create policy chat_select on public.chat_messages for select
  using (
    (channel = 'equipo' and (is_on_care_team(athlete_id) or is_admin()))
    or
    (channel = 'atleta' and (is_self(athlete_id) or is_on_care_team(athlete_id) or is_admin()))
  );

create policy chat_write on public.chat_messages for insert
  with check (
    is_self(author_id) and (
      (channel = 'equipo' and is_on_care_team(athlete_id))
      or
      (channel = 'atleta' and (is_self(athlete_id) or is_on_care_team(athlete_id)))
    )
  );
