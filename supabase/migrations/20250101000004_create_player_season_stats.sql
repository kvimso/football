-- Create player_season_stats table
create table public.player_season_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  season text not null,
  matches_played int default 0,
  goals int default 0,
  assists int default 0,
  minutes_played int default 0,
  pass_accuracy numeric(5,2),
  shots_on_target int default 0,
  tackles int default 0,
  interceptions int default 0,
  clean_sheets int default 0,
  distance_covered_km numeric(6,2),
  sprints int default 0,
  source text default 'manual',
  created_at timestamptz default now(),
  unique(player_id, season)
);

-- RLS
alter table public.player_season_stats enable row level security;

-- Anyone can view season stats
create policy "Season stats are publicly viewable"
  on public.player_season_stats for select
  using (true);
