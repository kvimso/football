-- Create contact_requests table (scout → player)
create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid references public.profiles(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  message text not null,
  status text default 'pending',
  responded_at timestamptz,
  responded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Indexes
create index idx_contact_requests_scout on public.contact_requests(scout_id);
create index idx_contact_requests_player on public.contact_requests(player_id);

-- RLS
alter table public.contact_requests enable row level security;

-- Scouts can view their own contact requests (no profiles subquery)
create policy "Scouts can view their own requests"
  on public.contact_requests for select
  using (auth.uid() = scout_id);
