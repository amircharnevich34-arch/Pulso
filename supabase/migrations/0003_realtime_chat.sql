-- Enable Realtime broadcasts for the team chat table.
alter publication supabase_realtime add table public.chat_messages;
