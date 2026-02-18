-- Create shortlists table (scout saves players)
create table public.shortlists (
  id uuid primary key default gen_random_uuid(),
  scout_id uuid references public.profiles(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  notes text,
  created_at timestamptz default now(),
  unique(scout_id, player_id)
);

-- Indexes
create index idx_shortlists_scout on public.shortlists(scout_id);

-- RLS
alter table public.shortlists enable row level security;

-- Scouts can view their own shortlist
create policy "Scouts can view their own shortlist"
  on public.shortlists for select
  using (auth.uid() = scout_id);

-- Scouts can add to their own shortlist
create policy "Scouts can add to their shortlist"
  on public.shortlists for insert
  with check (auth.uid() = scout_id);

-- Scouts can update their own shortlist entries (notes)
create policy "Scouts can update their shortlist"
  on public.shortlists for update
  using (auth.uid() = scout_id)
  with check (auth.uid() = scout_id);

-- Scouts can remove from their own shortlist
create policy "Scouts can delete from their shortlist"
  on public.shortlists for delete
  using (auth.uid() = scout_id);
