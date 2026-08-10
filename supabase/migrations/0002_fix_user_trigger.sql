-- Make the auth.users -> public.users sync trigger idempotent and
-- non-blocking, and back-fill any auth users missing their profile row
-- (covers accounts created before this fix, e.g. via the dashboard).

create or replace function public.handle_new_user()
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

-- Back-fill: pick up any existing auth user without a public.users row.
insert into public.users (id, full_name, role)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', u.email), 'deportista'
from auth.users u
left join public.users pu on pu.id = u.id
where pu.id is null
on conflict (id) do nothing;
