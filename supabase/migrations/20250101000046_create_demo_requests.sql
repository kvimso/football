-- Platform Pivot Session 3: Demo requests table for lead capture
-- Single migration for atomicity

BEGIN;

-- 1a. Create demo_requests table
create table if not exists demo_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  organization text not null,
  role text not null check (role in ('Scout', 'Club Sporting Director', 'Agent', 'Academy Director', 'Other')),
  country text not null,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'demo_done', 'converted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1b. Defense-in-depth: enable RLS even though we use REVOKE
-- Zero policies = no rows returned even if REVOKE is accidentally reversed
alter table demo_requests enable row level security;

-- 1c. REVOKE direct access from anon, authenticated, AND public roles
revoke all on demo_requests from anon, authenticated, public;

-- 1d. Single index: user_id partial (only index needed at <50 rows)
create index if not exists idx_demo_requests_user_id on demo_requests(user_id) where user_id is not null;

-- 1e. Reuse existing generic updated_at trigger (from migration 000011)
drop trigger if exists trg_demo_requests_updated_at on demo_requests;
create trigger trg_demo_requests_updated_at
  before update on demo_requests
  for each row execute function public.update_updated_at_column();

-- 1f. PL/pgSQL function for safe single-row backfill (JS .limit(1) on UPDATE is a no-op)
create or replace function public.backfill_demo_request(p_user_id uuid, p_email text)
returns void as $$
begin
  update demo_requests
  set user_id = p_user_id
  where id = (
    select id from demo_requests
    where user_id is null and lower(email) = lower(p_email)
    order by created_at desc
    limit 1
    for update skip locked
  );
end;
$$ language plpgsql security definer;

COMMIT;
