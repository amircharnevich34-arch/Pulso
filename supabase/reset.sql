-- Limpia cualquier resto de un intento anterior, sin tocar lo que Supabase necesita.
drop table if exists public.diet_logs cascade;
drop table if exists public.diet_plan_targets cascade;
drop table if exists public.water_logs cascade;
drop table if exists public.food_bank_items cascade;
drop table if exists public.food_categories cascade;
drop table if exists public.meal_slots cascade;
drop table if exists public.routine_completions cascade;
drop table if exists public.plan_items cascade;
drop table if exists public.plans cascade;
drop table if exists public.diary_diet_entries cascade;
drop table if exists public.diary_pain_entries cascade;
drop table if exists public.chat_messages cascade;
drop table if exists public.evaluations cascade;
drop table if exists public.athlete_nutrition_status cascade;
drop table if exists public.athlete_training_status cascade;
drop table if exists public.athlete_medical_status cascade;
drop table if exists public.athlete_care_team cascade;
drop table if exists public.athlete_profiles cascade;
drop view if exists public.public_profiles cascade;
drop table if exists public.users cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user cascade;
drop function if exists public.is_on_care_team cascade;
drop function if exists public.is_admin cascade;
drop function if exists public.is_self cascade;

drop type if exists public.athlete_status cascade;
drop type if exists public.plan_type cascade;
drop type if exists public.energy_level cascade;
drop type if exists public.pain_zone cascade;
drop type if exists public.evaluation_type cascade;
drop type if exists public.expert_role cascade;
drop type if exists public.user_role cascade;
