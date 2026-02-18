-- Create player_skills table (1-100 ratings for radar chart)
create table public.player_skills (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  pace int check (pace between 1 and 100),
  shooting int check (shooting between 1 and 100),
  passing int check (passing between 1 and 100),
  dribbling int check (dribbling between 1 and 100),
  defending int check (defending between 1 and 100),
  physical int check (physical between 1 and 100),
  updated_at timestamptz default now(),
  unique(player_id)
);

-- RLS
alter table public.player_skills enable row level security;

-- Anyone can view skills
create policy "Player skills are publicly viewable"
  on public.player_skills for select
  using (true);
