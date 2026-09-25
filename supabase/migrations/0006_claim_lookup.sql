-- Lets an expert link an athlete_profiles row to an existing login by email,
-- without exposing auth.users (or the public.users table) for browsing.
create function public.find_user_id_by_email(lookup_email text)
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from auth.users where email = lookup_email limit 1;
$$;
