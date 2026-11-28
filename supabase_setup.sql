-- Run this in Supabase Project -> SQL Editor -> New Query

-- 1. Table storing real-time student unblock requests with timed permissions
create table if not exists unblock_requests (
  id uuid default gen_random_uuid() primary key,
  ticket_code text not null,
  student_id text not null,
  domain text not null,
  category text default 'Recreational Video Streaming (Rule #104)',
  reason text not null,
  status text default 'pending',
  duration_minutes integer,
  expires_at timestamptz,
  reviewed_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- If table already existed, safely add the new timed columns:
alter table unblock_requests add column if not exists duration_minutes integer;
alter table unblock_requests add column if not exists expires_at timestamptz;

-- 2. Table storing active network moderation rules
create table if not exists policy_rules (
  rule_key text primary key,
  label text not null,
  domains text[] not null,
  is_blocked boolean default true,
  updated_at timestamptz default now()
);

insert into policy_rules (rule_key, label, domains, is_blocked)
values
  ('streaming', 'Recreational Video Streaming (Rule #104)', ARRAY['tiktok.com', 'netflix.com', 'youtube.com'], true),
  ('gaming', 'Gaming & Digital Distribution (Rule #108)', ARRAY['steampowered.com', 'roblox.com', 'discord.com'], true),
  ('phishing', 'Phishing & Malware Threat Feed (Rule #001)', ARRAY['amtso.org'], true)
on conflict (rule_key) do nothing;

-- Enable open read/write for live multi-device testing
alter table unblock_requests enable row level security;
drop policy if exists "Public access unblock_requests" on unblock_requests;
create policy "Public access unblock_requests" on unblock_requests
  for all using (true) with check (true);

alter table policy_rules enable row level security;
drop policy if exists "Public access policy_rules" on policy_rules;
create policy "Public access policy_rules" on policy_rules
  for all using (true) with check (true);