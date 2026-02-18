-- Create match_player_stats table (individual performance per match)
create table public.match_player_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  minutes_played int,
  goals int default 0,
  assists int default 0,
  pass_accuracy numeric(5,2),
  shots int default 0,
  shots_on_target int default 0,
  tackles int default 0,
  interceptions int default 0,
  distance_km numeric(5,2),
  sprints int default 0,
  top_speed_kmh numeric(4,1),
  heat_map_data jsonb,
  rating numeric(3,1),
  source text default 'manual',
  created_at timestamptz default now(),
  unique(match_id, player_id)
);

-- Indexes
create index idx_match_stats_player on public.match_player_stats(player_id);

-- RLS
alter table public.match_player_stats enable row level security;

-- Anyone can view match player stats
create policy "Match player stats are publicly viewable"
  on public.match_player_stats for select
  using (true);
