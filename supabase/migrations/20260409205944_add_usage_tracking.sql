-- Create table to track AI usage per user per day
create table if not exists public.user_ai_usage (
  user_id uuid references auth.users not null,
  usage_date date default current_date not null,
  call_count int default 0 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, usage_date)
);

-- Enable RLS
alter table public.user_ai_usage enable row level security;

-- Policiess
create policy "Users can view their own usage" on public.user_ai_usage
  for select using (auth.uid() = user_id);

-- NOTE: We don't add insert/update policies for users because we want
-- usage tracking to be handled exclusively by the Edge Functions using 
-- the Service Role to prevent tampering.
