-- ============================================================
-- Camera Integration Schema Migration
--
-- The single largest schema change in the project.
-- Replaces demo/FIFA-style stats with real Starlive camera data.
--
-- 6 steps in strict order (FK constraints require this):
-- 1. Drop old stats tables (CASCADE removes their RLS/triggers)
-- 2. Clear FK refs and delete seeded match data
-- 3. Create new tables (heatmaps, mappings, sync logs)
-- 4. Alter existing tables (matches, player_videos)
-- 5. Recreate stats tables with camera schema
-- 6. RLS policies, indexes, triggers
-- ============================================================

-- ============================================================
-- STEP 1: Drop old stats tables
-- CASCADE removes RLS policies, triggers, and FK constraints
-- ============================================================

drop table if exists public.match_player_stats cascade;
drop table if exists public.player_skills cascade;
drop table if exists public.player_season_stats cascade;

-- ============================================================
-- STEP 2: Clear FK references and delete seeded match data
-- player_videos.match_id FK has no ON DELETE CASCADE,
-- so we must null it before deleting matches.
-- ============================================================

update public.player_videos set match_id = null where match_id is not null;
delete from public.matches;

-- ============================================================
-- STEP 3: Create new tables
-- ============================================================

-- 3a. match_heatmaps — player per-match position data
create table public.match_heatmaps (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade not null,
  player_id uuid references public.players(id) on delete cascade not null,
  coords jsonb not null,
  fps int default 25,
  field_step int default 200,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(match_id, player_id)
);

-- 3b. starlive_player_map — Starlive player ID -> our player UUID
create table public.starlive_player_map (
  id uuid primary key default gen_random_uuid(),
  starlive_player_id int not null unique,
  player_id uuid references public.players(id) on delete cascade not null,
  starlive_team_id int,
  club_id uuid references public.clubs(id) on delete set null,
  jersey_number text,
  mapped_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3c. starlive_club_map — Starlive team name -> our club UUID
create table public.starlive_club_map (
  id uuid primary key default gen_random_uuid(),
  starlive_team_name text not null unique,
  starlive_team_id int unique,
  club_id uuid references public.clubs(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- 3d. sync_logs — audit trail for every sync operation
create table public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_type text not null,
  starlive_id text,
  status text not null,
  records_synced int default 0,
  records_skipped int default 0,
  errors jsonb,
  triggered_by text,
  triggered_by_user uuid references public.profiles(id),
  duration_ms int,
  created_at timestamptz default now()
);

-- ============================================================
-- STEP 4: Alter existing tables
-- ============================================================

-- 4a. matches — alter match_date type, add camera columns, drop old columns
alter table public.matches
  alter column match_date type timestamptz using match_date::timestamptz;

alter table public.matches
  add column starlive_activity_id int unique,
  add column home_team_color text,
  add column away_team_color text,
  add column team_stats jsonb,
  add column widgets jsonb,
  add column intervals jsonb,
  add column intervals_widgets jsonb,
  add column source text default 'pixellot';

alter table public.matches
  drop column if exists match_report,
  drop column if exists match_report_ka,
  drop column if exists highlights_url,
  drop column if exists camera_source,
  drop column if exists external_event_id;

-- Defensively drop old write policies (all were removed by migrations 000016/000020,
-- but IF EXISTS ensures clean state regardless)
drop policy if exists "Academy admins can insert matches" on public.matches;
drop policy if exists "Academy admins can update matches" on public.matches;
drop policy if exists "Academy admins can delete matches" on public.matches;
drop policy if exists "Platform admins can insert matches" on public.matches;
drop policy if exists "Platform admins can update matches" on public.matches;
drop policy if exists "Platform admins can delete matches" on public.matches;

-- 4b. player_videos — add Starlive columns
alter table public.player_videos
  add column starlive_event_id int,
  add column video_timestamp_start text,
  add column video_timestamp_end text;

-- ============================================================
-- STEP 5: Recreate stats tables with camera schema
-- ============================================================

-- 5a. match_player_stats — hybrid: 17 real columns + 3 JSONB
create table public.match_player_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade not null,
  player_id uuid references public.players(id) on delete cascade not null,
  starlive_player_id int,

  -- Key queryable stats (extracted from JSONB for fast filtering)
  minutes_played int,
  overall_rating numeric(3,1),
  goals int default 0,
  assists int default 0,
  key_passes int default 0,
  shots int default 0,
  shots_on_target int default 0,
  passes_total int default 0,
  passes_successful int default 0,
  pass_success_rate numeric(5,2),
  tackles int default 0,
  interceptions int default 0,
  dribbles_success int default 0,
  dribbles_fail int default 0,
  distance_m numeric(10,2),
  sprints_count int default 0,
  speed_avg numeric(6,4),

  -- Full Starlive data (JSONB — preserves all 57 event types + details)
  events jsonb,
  indexes jsonb,
  fitness jsonb,

  source text default 'pixellot',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(match_id, player_id)
);

-- 5b. player_skills — camera-derived 1-10 scale
create table public.player_skills (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade not null,

  -- Category totals (averaged from indexes across all matches, 1-10)
  attack numeric(3,1),
  defence numeric(3,1),
  fitness numeric(3,1),
  overall numeric(3,1),

  -- Attack sub-scores
  forward_play numeric(3,1),
  possession numeric(3,1),
  dribbling numeric(3,1),
  shooting numeric(3,1),
  set_piece numeric(3,1),

  -- Defence sub-scores
  tackling numeric(3,1),
  positioning numeric(3,1),
  duels numeric(3,1),
  pressing numeric(3,1),
  goalkeeping numeric(3,1),

  -- Fitness sub-scores
  fitness_distance numeric(3,1),
  fitness_intensity numeric(3,1),
  fitness_speed numeric(3,1),

  matches_counted int default 0,
  last_updated timestamptz default now(),
  unique(player_id)
);

-- CHECK constraints on 1-10 scale columns (prevent transform bugs)
alter table public.player_skills
  add constraint chk_attack check (attack is null or (attack >= 0 and attack <= 10)),
  add constraint chk_defence check (defence is null or (defence >= 0 and defence <= 10)),
  add constraint chk_fitness check (fitness is null or (fitness >= 0 and fitness <= 10)),
  add constraint chk_overall check (overall is null or (overall >= 0 and overall <= 10)),
  add constraint chk_forward_play check (forward_play is null or (forward_play >= 0 and forward_play <= 10)),
  add constraint chk_possession check (possession is null or (possession >= 0 and possession <= 10)),
  add constraint chk_dribbling check (dribbling is null or (dribbling >= 0 and dribbling <= 10)),
  add constraint chk_shooting check (shooting is null or (shooting >= 0 and shooting <= 10)),
  add constraint chk_set_piece check (set_piece is null or (set_piece >= 0 and set_piece <= 10)),
  add constraint chk_tackling check (tackling is null or (tackling >= 0 and tackling <= 10)),
  add constraint chk_positioning check (positioning is null or (positioning >= 0 and positioning <= 10)),
  add constraint chk_duels check (duels is null or (duels >= 0 and duels <= 10)),
  add constraint chk_pressing check (pressing is null or (pressing >= 0 and pressing <= 10)),
  add constraint chk_goalkeeping check (goalkeeping is null or (goalkeeping >= 0 and goalkeeping <= 10)),
  add constraint chk_fitness_distance check (fitness_distance is null or (fitness_distance >= 0 and fitness_distance <= 10)),
  add constraint chk_fitness_intensity check (fitness_intensity is null or (fitness_intensity >= 0 and fitness_intensity <= 10)),
  add constraint chk_fitness_speed check (fitness_speed is null or (fitness_speed >= 0 and fitness_speed <= 10));

-- CHECK constraint on match_player_stats rating
alter table public.match_player_stats
  add constraint chk_mps_rating check (overall_rating is null or (overall_rating >= 0 and overall_rating <= 10));

-- ============================================================
-- STEP 6: RLS, indexes, triggers
-- ============================================================

-- 6a. Enable RLS on ALL new and recreated tables
alter table public.match_player_stats enable row level security;
alter table public.player_skills enable row level security;
alter table public.match_heatmaps enable row level security;
alter table public.starlive_player_map enable row level security;
alter table public.starlive_club_map enable row level security;
alter table public.sync_logs enable row level security;

-- 6b. RLS policies — camera data (public read, service role write)
create policy "Camera stats are publicly viewable"
  on public.match_player_stats for select
  using (true);

create policy "Player skills are publicly viewable"
  on public.player_skills for select
  using (true);

create policy "Heatmaps are publicly viewable"
  on public.match_heatmaps for select
  using (true);

-- 6c. RLS policies — admin-only tables (use get_user_role() to avoid RLS recursion)
create policy "Platform admins can view player mappings"
  on public.starlive_player_map for select
  using (public.get_user_role() = 'platform_admin');

create policy "Platform admins can insert player mappings"
  on public.starlive_player_map for insert
  with check (public.get_user_role() = 'platform_admin');

create policy "Platform admins can update player mappings"
  on public.starlive_player_map for update
  using (public.get_user_role() = 'platform_admin');

create policy "Platform admins can delete player mappings"
  on public.starlive_player_map for delete
  using (public.get_user_role() = 'platform_admin');

create policy "Platform admins can view club mappings"
  on public.starlive_club_map for select
  using (public.get_user_role() = 'platform_admin');

create policy "Platform admins can insert club mappings"
  on public.starlive_club_map for insert
  with check (public.get_user_role() = 'platform_admin');

create policy "Platform admins can update club mappings"
  on public.starlive_club_map for update
  using (public.get_user_role() = 'platform_admin');

create policy "Platform admins can delete club mappings"
  on public.starlive_club_map for delete
  using (public.get_user_role() = 'platform_admin');

create policy "Platform admins can view sync logs"
  on public.sync_logs for select
  using (public.get_user_role() = 'platform_admin');

-- No INSERT/UPDATE/DELETE policies on sync_logs — service role only

-- 6d. Indexes
create index idx_mps_player on public.match_player_stats(player_id);
create index idx_mps_match on public.match_player_stats(match_id);
create index idx_mps_player_match on public.match_player_stats(player_id, match_id);
create index idx_mps_rating on public.match_player_stats(overall_rating desc);
create index idx_mps_goals on public.match_player_stats(goals desc);
create index idx_heatmaps_player on public.match_heatmaps(player_id);
create index idx_heatmaps_match on public.match_heatmaps(match_id);
create index idx_spm_player on public.starlive_player_map(player_id);
create index idx_sync_logs_date on public.sync_logs(created_at desc);
create index idx_sync_logs_status on public.sync_logs(status);

-- 6e. Updated_at triggers (reuse existing function from migration 000011)
create trigger update_match_player_stats_updated_at
  before update on public.match_player_stats
  for each row execute function public.update_updated_at_column();

create trigger update_match_heatmaps_updated_at
  before update on public.match_heatmaps
  for each row execute function public.update_updated_at_column();
