---
title: Starlive Camera Integration (Phase 7)
type: feature
status: ready-for-planning
date: 2026-03-19
approach: Hybrid relational + JSONB (Approach B)
next-step: Create implementation plan using /superpowers:writing-plans, then execute in ~4 sessions
---

# Starlive Camera Integration — Design Spec

## Current Status

**This spec is complete and approved. Next step: create an implementation plan.**

- Brainstorming: done (2026-03-19)
- Spec review: done (2 rounds, 27 issues found and fixed)
- Data mappings: verified against real Starlive JSON samples
- Feature development sessions 3-6 (comparison, filtering, dashboard, performance) are **paused** — they depend on the old data model. Do camera integration first, then revisit them.
- Starlive sample JSON files are at: `/mnt/c/Users/kvims/OneDrive/Pictures/Saved Pictures/index.json` (player), `index-2.json` (heatmap), `index-3.json` (match report)
- Questions for Starlive's developer: `docs/starlive-questions-for-developer.md`

### What We Have Now

- 3 sample JSON files from Starlive (stats only — **no video, no live API, no credentials**)
- These samples contain: per-player match stats + ratings + fitness, heatmap coordinates, full match team reports
- No API endpoint, no webhook, no auth credentials — all TBD with Starlive

### What We're Building

Everything that can work with JSON data alone. The API connection layer is a thin wrapper added later when Starlive provides credentials. Manual JSON upload is the entry point for now.

### Implementation Constraints

- **Performance**: List pages (player directory, match list) must query real columns only — NEVER fetch JSONB columns (`events`, `indexes`, `fitness`, `team_stats`, `widgets`, `intervals`). JSONB is for detail pages only.
- **Test data**: Seed the new schema with the 3 sample Starlive JSON files during development. Build manual upload first → push sample data through → verify on UI.
- **No video**: `player_videos` table stays but won't be populated. Webhook route scaffolded but not called. Video features deferred.
- **Session budget**: ~120-140k tokens per implementation session, ~4 sessions total.

## Overview

Integrate Starlive's Pixellot camera data into the Georgian Football Talent Platform. This replaces all demo/manually-seeded stats with real, camera-verified player statistics, match reports, and heatmaps. All three Starlive data types — player stats, heatmaps, and match reports — ship together as a single release.

## Data Sources

Starlive provides three JSON data structures (delivery method TBD — see `docs/starlive-questions-for-developer.md`):

### Source 1: Player Profile Data (per player, across all matches)

**Shape:** One JSON object per player containing:

```
{
  player_data: { id, first_name, last_name, teams, avatar, jersey[], teammates[] }
  activities: [{ id, kind, home_team__name, guest_team__name, activity_date, home_team_goals?, guest_team_goals, home_team_color, guest_team_color }]
  events: { [match_date]: { [event_type]: { success?: {sum, per_minute}, fail?: {sum, per_minute}, neutral?: {sum, per_minute} }, activity_id } }
  indexes: { [match_date]: { attack: {forward_play, possession, dribling, shooting, set_piece, total}, defence: {tackling, positioning, duels, pressing, goalkeeing, total}, fitness: {distance, intensity, speed, total}, overall, activity_id } }
  fitness: { [match_date]: { distance, small_distance, middle_distance, big_distance, sprints_distance, sprints_count, speed_avg, intense_running, ..._per_minute variants, activity_id } }
  player_stats: { [match_date]: { playing_time: { minutes }, activity_id } }
}
```

**57 unique event types** including: pass, pass_forward, pass_back, pass_sideways, short_pass, middle_pass, long_pass, progressive_pass, pass_to_final_third, pass_into_pen_area, pass_end_in_pen_area, pass_with_packing, pass_with_xA, pass_in_1_third, pass_in_2_third, pass_in_3_third, pass_in_own_half, pass_in_opposite_half, key_pass, cross, throwing, corner, free_kick, shot, shot_with_xG, shot_assist, shot_on_target_assist, goal, assist, second_assist, third_assist, dribble, dribble_with_packing, tackle, sliding_tackle, interception, duel, recovery, return, return_on_opp_half, lost_ball, lost_ball_own_half, ball_control, pressing, contrpressing, progressive_run, sprint, sprint_forward, sprint_back, distance, interval, entries_in_penalty_area, into_pen_area, in_pen_area, blocked, foul, technical_mistake.

**Each event has 3 possible outcomes:** `success`, `fail`, `neutral` — each with `sum` (count) and `per_minute` (rate).

**Index ratings** on a 1-10 scale. Sub-categories can be `null` (e.g. `goalkeeing` is null for outfield players, `set_piece` is null if player took no set pieces).

**Note on spellings:** Starlive uses `dribling` (not `dribbling`) and `goalkeeing` (not `goalkeeping`). Our system stores raw Starlive data in JSONB as-is but uses correct English in our own column names and UI labels.

### Source 2: Heatmap Data (per player, per match)

**Shape:** One JSON object per player per match:

```
{
  [player_key]: {
    fps: 25,
    field_step: 200,
    coords: { [grid_key]: frame_count, ... }
  }
}
```

- `player_key`: string (player or jersey ID)
- `grid_key`: 4-character string encoding (x, y) position on pitch grid
- `frame_count`: integer — number of frames (at 25fps) the player was at that position
- Higher frame counts = more time spent there
- 854 grid cells in the sample data, frame counts range 1–1827

### Source 3: Match Report (per match, both teams)

**Shape:** One JSON object per match:

```
{
  result: {
    teams_data: { [team_id]: { [stat_category]: { count, count_accurate, percent, value?, events: { success: [], fail: [], neutral: [] } } } }
    widgets: { [team_id]: { possession, attacks_direction, weighted_position, lines_distance, pressing, ppda, opda, breakthroughs, shots_zones, duels_zones, tackles_recoveries_zones, recoveries_zones, interceptions_zones, clearances_zones, yellow_cards_zones, red_cards_zones } }
    intervals_team_stats: { [minute]: { [team_id]: { ...same stat categories as teams_data } } }
    intervals_widgets: { [minute]: { [team_id]: { ...same widget categories } } }
  }
}
```

- **~70 team stat categories** including: xG, penalty, goals, yellow_cards, red_cards, shots, shots_on_target, shots_against, shots_blocked, shots_from_box, touches_in_box, passes, passes_to_final_third, progressive_passes, short/middle/long/forward/backward/sideways_passes, through_passes, key_passes, assists, shot_assists, passes_to_penalty_area, passes_per_minute, corners, corners_with_shots, free_kicks, free_kicks_with_shots, crosses, crosses_left_flank, crosses_right_flank, offsides, recoveries, returns, duels, tackles, tackles_recoveries, sliding_tackles, interceptions, ball_losses, fouls, fouls_against, dribbles, dribbles_against, open_play_possessions (+ first/second/third_third), progressive_runs, pressing, contrpressing, clearances, throw_ins, goal_kicks, aerial_duels, average_shot_distance, plus zone breakdowns: ball_losses/returns/recoveries/tackles_recoveries each with _first_third/_second_third/_third_third variants
- **Each stat category** has **either** `success`/`fail` event arrays (e.g. shots, passes, goals) **or** a single `neutral` array (e.g. yellow_cards, recoveries, interceptions) — never all three together.
- **Each event object** has: `id`, `timestamp`, `success` (boolean), `thumbnail`, `extra` (containing `player`, `video_start`, `video_end`, `event_end`, `coords_start`, `coords_finish`, `additional_events`, `training_part_id`), `super_track` (alternate player identification), `player`. The `extra.player` can be `null` when tracking cannot identify the player. The `extra.additional_events` contains contextual data like `xG` (float per-shot), `save`, `goal`, `in_pen_area`, `by_head`, `free_kick`.
- **xG stat** has a `value` field (float, e.g. `6.1` for cumulative team xG) in addition to `count` (number of xG events). The UI should display `value`, not `count`, for expected goals. Individual per-shot xG values are in `extra.additional_events.xG` on each shot event.
- **Time intervals**: `intervals_team_stats` has 19 intervals (5, 10, 15 ... 95), `intervals_widgets` has 18 intervals (5, 10, 15 ... 90). The difference suggests the 95th-minute interval only has team stats, not widget data.
- **Widget data** includes: possession (time + %), attacks_direction (attack/defense/counterattacks/positional_attacks), weighted_position, lines_distance (attack/midfield/defense), pressing, ppda (per-interval), average_ppda (scalar, separate top-level key), opda (per-interval), average_opda (scalar, separate top-level key), breakthroughs, shots_zones, shots_on_target_zones, duels_zones, tackles_recoveries_zones, tackles_line (per-interval), recoveries_zones, interceptions_zones, clearances_zones, yellow_cards_zones, red_cards_zones
- **Match report team IDs** (`"1"` and `"2"`) are positional: `"1"` = home team, `"2"` = away team. These are NOT the same as `starlive_team_id` values from player data. The UI maps them using the match's `home_club_id` / `away_club_id`.

## Known Data Quirks

These edge cases were discovered in the sample data and must be handled:

1. **Dual activity ID system**: `activities[].id` uses global IDs (54, 55, 56, 57) while `events`/`indexes`/`fitness`/`player_stats` sections reference local sequential `activity_id` values (1, 2, 3, 4). The match date string is the reliable link between them.
2. **Missing fields**: First activity is missing `home_team_goals` — field is optional, default to `null`.
3. **Date format inconsistency**: Activities use `2025-11-11T00:00:00Z`, events use `2025-11-11 00:00:00+00:00`. Must normalize during sync.
4. **Null index sub-scores**: `goalkeeing`, `set_piece`, `pressing` can be `null` in indexes. UI must handle gracefully (show "N/A" or omit from radar).
5. **Starlive spellings**: `dribling` (not `dribbling`), `goalkeeing` (not `goalkeeping`), `contrpressing`. Store raw in JSONB, display corrected in UI.
6. **Event types vary per match**: Not all 57 event types appear in every match. The set of events depends on what happened in the match. Sync and UI must handle missing event types.
7. **Null player in match report events**: Some events in `teams_data` have `"player": null` in the `extra` field when the tracking system cannot identify the player. Sync must handle gracefully.
8. **`player_data.teams` inconsistency**: The player's `teams` field (e.g. `"Test Team Alpha"`) may differ from the team names in `activities[].home_team__name` / `guest_team__name`. Use activity-level team names for club mapping, not `player_data.teams`.
9. **Heatmap has no match identifier**: The heatmap JSON (Source 2) contains only a player key and coordinates — no match ID, date, or activity reference. The match association must be provided externally (as a parameter in the API call or webhook payload). This is a question for Starlive's developer (added to `docs/starlive-questions-for-developer.md`).
10. **Player transfers between clubs**: A player may appear in matches for different clubs across a season. The `starlive_player_map` stores the current club, but per-match club context comes from the match's home/away club IDs, not from the player mapping.

## Database Schema

### Approach: Hybrid Relational + JSONB

Key queryable fields (ratings, goals, assists, distance) are real columns for fast filtering, sorting, and comparison queries. Full Starlive data preserved in JSONB columns for detailed views. This gives scouts fast search while keeping 100% of the camera data.

### Tables Being Replaced

#### `matches` (redesigned)

```sql
-- Alter match_date from date to timestamptz (Starlive includes time: "2026-03-08T15:08:00Z")
alter table public.matches
  alter column match_date type timestamptz using match_date::timestamptz;

-- Drop old columns, add new ones
alter table public.matches
  add column starlive_activity_id int unique,
  add column home_team_color text,
  add column away_team_color text,
  add column team_stats jsonb,            -- full teams_data from match report
  add column widgets jsonb,               -- full widgets from match report
  add column intervals jsonb,             -- full intervals_team_stats from match report
  add column intervals_widgets jsonb,     -- full intervals_widgets from match report
  add column source text default 'pixellot',
  drop column if exists match_report,
  drop column if exists match_report_ka,
  drop column if exists highlights_url,
  drop column if exists camera_source,
  drop column if exists pixellot_event_id;
```

**`match_date` type change**: Altered from `date` to `timestamptz` because Starlive's `activity_date` includes time information (e.g. `"2026-03-08T15:08:00Z"`). Multiple matches can occur on the same date — the time component plus `starlive_activity_id` differentiates them.

Existing columns kept: `id`, `home_club_id`, `away_club_id`, `slug`, `home_score`, `away_score`, `match_date` (now timestamptz), `competition`, `venue`, `video_url`, `created_at`.

#### `match_player_stats` (redesigned — drop and recreate)

```sql
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
  events jsonb,      -- full events object for this match
  indexes jsonb,     -- full indexes (attack/defence/fitness breakdown)
  fitness jsonb,     -- full fitness object (distance breakdown, speed, sprints)

  source text default 'pixellot',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(match_id, player_id)
);

create index idx_mps_player on public.match_player_stats(player_id);
create index idx_mps_match on public.match_player_stats(match_id);
create index idx_mps_rating on public.match_player_stats(overall_rating desc);
create index idx_mps_goals on public.match_player_stats(goals desc);

-- updated_at trigger (reuse existing trigger function from migration 000011)
create trigger set_match_player_stats_updated_at
  before update on public.match_player_stats
  for each row execute function public.set_updated_at();
```

#### `player_skills` (redesigned — drop and recreate)

Aggregated from match indexes. Recalculated on every sync.

```sql
create table public.player_skills (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade not null,

  -- Averaged from indexes across all matches (1-10 scale)
  attack numeric(3,1),
  defence numeric(3,1),
  fitness numeric(3,1),
  overall numeric(3,1),

  -- Attack sub-scores (averaged)
  forward_play numeric(3,1),
  possession numeric(3,1),
  dribbling numeric(3,1),
  shooting numeric(3,1),
  set_piece numeric(3,1),

  -- Defence sub-scores (averaged)
  tackling numeric(3,1),
  positioning numeric(3,1),
  duels numeric(3,1),
  pressing numeric(3,1),
  goalkeeping numeric(3,1),

  -- Fitness sub-scores (averaged)
  fitness_distance numeric(3,1),
  fitness_intensity numeric(3,1),
  fitness_speed numeric(3,1),

  matches_counted int default 0,
  last_updated timestamptz default now(),
  unique(player_id)
);
```

#### `player_season_stats` (dropped)

No longer needed. Season aggregations are computed from `match_player_stats` via SQL queries:

```sql
-- Example: season stats for a player
select
  extract(year from m.match_date) as season,
  count(*) as matches_played,
  sum(mps.goals) as goals,
  sum(mps.assists) as assists,
  sum(mps.minutes_played) as minutes_played,
  avg(mps.pass_success_rate) as avg_pass_accuracy,
  sum(mps.shots_on_target) as shots_on_target,
  sum(mps.tackles) as tackles,
  sum(mps.interceptions) as interceptions,
  avg(mps.distance_m) as avg_distance_m,
  sum(mps.sprints_count) as sprints
from match_player_stats mps
join matches m on m.id = mps.match_id
where mps.player_id = $1
group by extract(year from m.match_date);
```

### New Tables

#### `match_heatmaps`

```sql
create table public.match_heatmaps (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade not null,
  player_id uuid references public.players(id) on delete cascade not null,
  coords jsonb not null,     -- { "grid_key": frame_count, ... }
  fps int default 25,
  field_step int default 200,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(match_id, player_id)
);

create index idx_heatmaps_player on public.match_heatmaps(player_id);
create index idx_heatmaps_match on public.match_heatmaps(match_id);

create trigger set_match_heatmaps_updated_at
  before update on public.match_heatmaps
  for each row execute function public.set_updated_at();
```

#### `starlive_player_map`

Maps Starlive's player IDs to our player UUIDs. Required for automated sync.

```sql
create table public.starlive_player_map (
  id uuid primary key default gen_random_uuid(),
  starlive_player_id int not null unique,
  player_id uuid references public.players(id) on delete cascade not null,
  starlive_team_id int,
  club_id uuid references public.clubs(id),
  jersey_number text,
  mapped_by uuid references public.profiles(id),  -- who created this mapping
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_spm_player on public.starlive_player_map(player_id);
```

#### `starlive_club_map`

Maps Starlive's team names to our club UUIDs.

```sql
create table public.starlive_club_map (
  id uuid primary key default gen_random_uuid(),
  starlive_team_name text not null unique,
  starlive_team_id int unique,
  club_id uuid references public.clubs(id) on delete cascade not null,
  created_at timestamptz default now()
);
```

#### `sync_logs`

Audit trail for every sync operation.

```sql
create table public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_type text not null,      -- 'player', 'match_report', 'heatmap', 'full'
  starlive_id text,             -- text intentionally: stores player IDs, activity IDs, or composite keys
  status text not null,         -- 'success', 'partial', 'failed'
  records_synced int default 0,
  records_skipped int default 0,
  errors jsonb,                 -- array of error messages
  triggered_by text,            -- 'webhook', 'manual', 'cron'
  triggered_by_user uuid references public.profiles(id),
  duration_ms int,
  created_at timestamptz default now()
);

create index idx_sync_logs_date on public.sync_logs(created_at desc);
create index idx_sync_logs_status on public.sync_logs(status);
```

#### `player_videos` (kept, modified)

Keep existing table. Add `starlive_event_id` column for linking to specific match events when video delivery is clarified:

```sql
alter table public.player_videos
  add column starlive_event_id int,
  add column video_timestamp_start text,  -- "0:23:01" format from Starlive
  add column video_timestamp_end text;
```

### RLS Policies

| Table | SELECT | INSERT/UPDATE/DELETE |
|-------|--------|----------------------|
| `matches` | public read (`using (true)`) | service role only |
| `match_player_stats` | public read (`using (true)`) | service role only |
| `player_skills` | public read (`using (true)`) | service role only |
| `match_heatmaps` | public read (`using (true)`) | service role only |
| `player_videos` | public read (`using (true)`) | service role only |

| `starlive_player_map` | platform_admin only | platform_admin + service role |
| `starlive_club_map` | platform_admin only | platform_admin + service role |
| `sync_logs` | platform_admin only | service role only |

Note: SELECT policies use `using (true)` consistent with existing RLS patterns in the codebase (matches, players, clubs all use public read). Authentication is enforced at the middleware/layout level, not RLS.

All camera-sourced tables are write-protected at the DB level. Only the service role (used by the sync process) can insert or update stats. No academy admin, no scout. This enforces the "camera only" rule.

## Data Sync Architecture

### Design Principle

The sync layer is delivery-method-agnostic. Three entry points feed the same core sync logic:

```
Webhook POST ──────►┐
                     │   ┌──────────────┐     ┌─────────────┐     ┌──────────┐
API poll (future) ──►├──►│ SyncService  │────►│  Transform  │────►│  Upsert  │
                     │   │  validate()  │     │  + extract  │     │  to DB   │
Manual trigger ─────►┘   └──────────────┘     └─────────────┘     └──────────┘
                              │                                        │
                              ▼                                        ▼
                         sync_logs                              Recalculate
                                                              player_skills
```

### Entry Points (API Routes)

```
POST /api/camera/webhook          — receives push data from Starlive (service key auth)
POST /api/camera/sync             — manual trigger by platform_admin
GET  /api/camera/sync-logs        — view sync history (platform_admin)
```

### Player Matching Strategy

1. **Mapping table**: `starlive_player_map` links Starlive player IDs to our UUIDs
2. **Initial setup**: Platform admin maps players through admin UI at `/platform/camera/mappings`
3. **On sync**: Look up `starlive_player_id` in mapping table → get our `player_id`
4. **Unmatched players**: Log warning in `sync_logs` with starlive player details, skip that player's data (never crash). Platform admin reviews unmatched players and creates mappings.

### Club Matching Strategy

1. **Mapping table**: `starlive_club_map` links Starlive team names to our club UUIDs
2. Starlive uses team names like `"Test Home Team 1"` — we map these to our clubs
3. Same admin UI for managing club mappings

### Sync Flow: Player Data (Source 1)

Input: Player profile JSON (index.json shape)

1. Look up player mapping: `starlive_player_id` → `player_id`
2. If unmapped → log warning, skip
3. For each match date in `events`/`indexes`/`fitness`/`player_stats`:
   a. Match `activity_date` from `activities[]` to find the corresponding `activities[].id` (global ID)
   b. Find or create `matches` row by `starlive_activity_id` (global) or `match_date + clubs`
   c. Extract key stats from events into real columns:
      - `goals` ← `events[date].goal.neutral.sum` (default 0)
      - `assists` ← `events[date].assist.neutral.sum` (default 0)
      - `key_passes` ← `events[date].key_pass.neutral.sum` (default 0)
      - `shots` ← `events[date].shot.success.sum + events[date].shot.fail.sum` (default 0)
      - `shots_on_target` ← `events[date].shot.success.sum` (default 0)
      - `passes_total` ← `events[date].pass.success.sum + events[date].pass.fail.sum` (default 0)
      - `passes_successful` ← `events[date].pass.success.sum` (default 0)
      - `pass_success_rate` ← calculated from above
      - `tackles` ← `events[date].tackle.success.sum + events[date].tackle.fail.sum` (default 0)
      - `interceptions` ← `events[date].interception.neutral.sum` (default 0)
      - `dribbles_success` ← `events[date].dribble.success.sum` (default 0)
      - `dribbles_fail` ← `events[date].dribble.fail.sum` (default 0)
   d. Extract fitness: `distance_m`, `sprints_count`, `speed_avg`
   e. Extract rating: `indexes[date].overall`
   f. Extract minutes: `player_stats[date].playing_time.minutes`
   g. Store full `events[date]`, `indexes[date]`, `fitness[date]` as JSONB
   h. Upsert into `match_player_stats` (unique on match_id + player_id)
4. Recalculate `player_skills` for this player:
   - Average all non-null `indexes.attack.total` across matches → `attack`
   - Average all non-null `indexes.defence.total` → `defence`
   - Average all non-null `indexes.fitness.total` → `fitness`
   - Average all non-null `indexes.overall` → `overall`
   - Same for all sub-scores (skip nulls in average)
   - `matches_counted` = number of matches with index data
5. Log result in `sync_logs`

### Sync Flow: Heatmap Data (Source 2)

Input: Heatmap JSON (index-2.json shape)

1. Parse player key from JSON root
2. Look up player mapping
3. Determine which match (will need match_id passed as parameter or derived from context)
4. Upsert into `match_heatmaps` with `coords`, `fps`, `field_step`
5. Log result

### Sync Flow: Match Report (Source 3)

Input: Match report JSON (index-3.json shape)

1. Identify match (by starlive_activity_id or match_date + teams)
2. Store `result.teams_data` → `matches.team_stats` JSONB
3. Store `result.widgets` → `matches.widgets` JSONB
4. Store `result.intervals_team_stats` → `matches.intervals` JSONB
5. Store `result.intervals_widgets` → `matches.intervals_widgets` JSONB
6. Log result

### Error Handling

- **Unmapped player**: Skip, log warning with full starlive player details (id, name, jersey, team)
- **Unmapped club**: Skip match creation, log error
- **Missing fields**: Use defaults (0 for counts, null for ratings). Never crash on missing data.
- **Duplicate sync**: Upsert semantics — re-syncing the same data overwrites safely
- **Partial failure**: If some matches sync but others fail, commit what succeeded, log failures as `partial` status

## UI Features

### 4a. Player Profile — Camera Stats

On `/players/[slug]`, replace current stats section:

**Overall Rating Badge**
- Large rating number (e.g. "6.9") with 1-10 scale context
- "Verified by Pixellot" badge with camera icon
- Color coded: <5.5 red, 5.5-6.5 amber, 6.5-7.5 green, >7.5 bright green

**Match History Table**
- Sortable/expandable list of matches the player appeared in
- Each row shows: date, opponent, score, minutes played, overall rating, goals, assists
- Click to expand → full stat breakdown for that match

**Match Detail Expansion**
- All event stats organized by category:
  - **Attacking**: goals, assists, key_passes, shots (on target / off target), dribbles (success/fail), entries in penalty area
  - **Passing**: total passes (success/fail), forward/back/sideways split, short/middle/long split, progressive passes, crosses, pass accuracy %
  - **Defending**: tackles (success/fail), interceptions, recoveries, duels (success/fail), pressing, sliding tackles
  - **Physical**: distance (m), sprints, avg speed, intense running
- Each stat shows both `sum` and `per_minute` rate
- Success/fail events show success rate percentage

**Performance Radar Chart**
- Replace FIFA hexagon (pace/shooting/passing/dribbling/defending/physical) with camera data
- 6-axis radar: forward_play, possession, dribbling, shooting (from attack indexes) + tackling, positioning (from defence indexes)
- Or 3-axis simplified: attack total, defence total, fitness total
- Scale: 1-10, averaged across all matches
- Null sub-scores omitted from radar

**Trend Line Chart**
- X-axis: match dates, Y-axis: overall rating (1-10)
- Line connecting ratings across matches — shows player form trajectory
- Optional: overlay attack/defence/fitness trends

**Season Aggregation**
- Computed from match_player_stats: total goals, assists, matches played, minutes, avg pass accuracy, total distance, etc.
- Replaces the old player_season_stats table data

### 4b. Player Profile — Heatmap

**Pitch Visualization**
- SVG football pitch (standard proportions)
- Color-intensity overlay from heatmap coordinate data
- Color scale: blue (low) → green → yellow → orange → red (high frame count)
- Grid cell size determined by `field_step` parameter

**Controls**
- Match selector dropdown (if player has heatmap data for multiple matches)
- Opponent name and date shown above pitch

### 4c. Match Page — Full Report

On `/matches/[slug]`, replace current basic view:

**Match Header**
- Score, date, teams with colors, venue, competition

**Team Comparison Stats**
- Side-by-side horizontal bars for key metrics:
  - Possession %
  - xG (expected goals)
  - Shots / Shots on target
  - Total passes / Pass accuracy %
  - Tackles / Interceptions
  - Corners / Free kicks
  - Fouls

**Shot Map**
- SVG pitch showing shot locations from `shots_zones` data
- Color: goals (green), on target (yellow), off target (red), blocked (gray)

**Attack Direction**
- Visual showing left / center / right attack distribution for each team
- Include counterattacks vs positional attacks breakdown

**PPDA / OPDA Timeline**
- Pressing intensity over time from `ppda` widget intervals
- Line chart with 5-minute intervals

**Stat Intervals Timeline**
- Key stats plotted over 5-minute match intervals
- Shows which team dominated which periods

**Player Ratings Table**
- All players who appeared in the match
- Columns: jersey, name, position, minutes, overall rating, goals, assists, key passes
- Sorted by overall rating descending
- Clickable → links to player profile

### 4d. Comparison Tool Update

Update existing player comparison feature:

- Replace FIFA-style skills with camera indexes (attack, defence, fitness, overall)
- Radar chart overlay with real camera sub-scores
- Side-by-side per-match averages: goals/match, pass accuracy, avg distance, dribble success rate
- Side-by-side heatmaps (if both players have heatmap data for comparable matches)

### 4e. Platform Admin — Camera Management

New pages under `/platform/camera/`:

**Player Mappings** (`/platform/camera/mappings`)
- Table of all starlive_player_map entries
- Search/filter by club
- Add new mapping: select our player → enter Starlive player ID
- Bulk import from CSV

**Club Mappings** (`/platform/camera/clubs`)
- Table of starlive_club_map entries
- Add new mapping: select our club → enter Starlive team name/ID

**Sync Dashboard** (`/platform/camera/sync`)
- Manual sync trigger button
- Sync log history table: timestamp, type, status, records synced, errors
- Expandable error details

**Unmatched Players** view
- Filtered sync_logs showing unmapped player warnings
- Quick-action: create mapping directly from the warning

### What Stays Unchanged

- Player card design and filters — same components, fed by real data from `match_player_stats` aggregations
- Watchlist / shortlist functionality
- Chat / messaging system
- Club pages — same structure, match data now richer
- "Verified by Pixellot" badge on all camera-sourced data (already planned in CLAUDE.md)

## Migration Strategy

### Step 1: Create new tables

Add new tables in a single migration: `match_heatmaps`, `starlive_player_map`, `starlive_club_map`, `sync_logs`.

### Step 2: Alter existing tables

- `matches`: alter `match_date` from `date` to `timestamptz`, add new columns (`starlive_activity_id`, `home_team_color`, `away_team_color`, `team_stats`, `widgets`, `intervals`, `intervals_widgets`, `source`), drop obsolete columns (`match_report`, `match_report_ka`, `highlights_url`, `camera_source`, `pixellot_event_id`)
- `player_videos`: add `starlive_event_id`, `video_timestamp_start`, `video_timestamp_end`

### Step 3: Drop and recreate stats tables

- Drop `match_player_stats` (old schema with limited columns)
- Drop `player_skills` (old FIFA-style 1-100 ratings)
- Drop `player_season_stats` (replaced by computed aggregations)
- Create new `match_player_stats` (hybrid schema with JSONB)
- Create new `player_skills` (camera-derived 1-10 ratings)

### Step 4: Delete seed/demo data

- Remove seeded match data from `matches` table
- All data going forward comes from camera sync only

### Step 5: Update RLS policies

- Remove old policies on dropped/recreated tables
- Add new policies per the RLS table above
- Camera data tables: service role write only

### Seed Data Handling

Current database has 5 matches, 12 match_player_stats, 12 player_skills, 12 season_stats — all demo data. This will be deleted during migration. The platform will show "No camera data yet" states until first sync with real Starlive data.

## Dependencies and Blockers

### Blocked on Starlive

- **API endpoint details** — needed to build the actual HTTP client
- **Authentication method** — needed for webhook verification and API auth
- **Video delivery** — needed to populate player_videos with real URLs
- **Player ID mapping** — need their real player IDs for the clubs they cover

### Can Build Now (Without Starlive API)

1. Database migration (schema redesign)
2. SyncService core logic (transform + upsert functions)
3. All UI components (player stats, heatmaps, match reports)
4. Platform admin mapping UI
5. Sync logging infrastructure
6. Manual JSON upload as temporary sync entry point

### Deferred to Video Delivery Clarification

- Video player integration on match pages
- Highlight clip generation from timestamps
- Player video gallery with camera clips

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20250101000041_camera_integration.sql` | Schema migration |
| `src/lib/camera/types.ts` | TypeScript types for Starlive JSON structures |
| `src/lib/camera/transform.ts` | Transform Starlive JSON → our DB shape |
| `src/lib/camera/sync.ts` | SyncService: validate, transform, upsert |
| `src/app/api/camera/webhook/route.ts` | Webhook endpoint |
| `src/app/api/camera/sync/route.ts` | Manual sync trigger |
| `src/app/api/camera/sync-logs/route.ts` | Sync log viewer API |
| `src/components/player/CameraStats.tsx` | Player match history + stats |
| `src/components/player/PerformanceRadar.tsx` | Camera-data radar chart |
| `src/components/player/TrendChart.tsx` | Rating trend over matches |
| `src/components/player/Heatmap.tsx` | Pitch heatmap visualization |
| `src/components/match/MatchReport.tsx` | Full match report (team comparison) |
| `src/components/match/ShotMap.tsx` | Shot location visualization |
| `src/components/match/AttackDirection.tsx` | Attack direction widget |
| `src/components/match/StatsTimeline.tsx` | 5-min interval stats |
| `src/app/platform/camera/mappings/page.tsx` | Player mapping admin |
| `src/app/platform/camera/clubs/page.tsx` | Club mapping admin |
| `src/app/platform/camera/sync/page.tsx` | Sync dashboard |

### Modified Files

| File | Change |
|------|--------|
| `src/app/(platform)/players/[slug]/page.tsx` | Replace stats with camera stats, heatmap, radar |
| `src/app/(platform)/players/page.tsx` | Update queries (remove player_season_stats joins) |
| `src/app/(platform)/players/compare/page.tsx` | Update to camera indexes |
| `src/app/(platform)/matches/[slug]/page.tsx` | Add full match report |
| `src/app/(platform)/clubs/[slug]/page.tsx` | Update player stats queries |
| `src/app/api/players/route.ts` | Remove player_season_stats queries |
| `src/app/api/players/[id]/route.ts` | Replace player_skills + season_stats with camera data |
| `src/app/api/players/[id]/pdf/route.ts` | Update PDF export to camera stats |
| `src/app/api/players/ai-search/route.ts` | Update search queries |
| `src/app/api/clubs/[slug]/route.ts` | Remove player_season_stats references |
| `src/app/api/matches/[slug]/route.ts` | Update to new match_player_stats schema |
| `src/components/player/RadarChart.tsx` | Adapt to 1-10 camera indexes (replace FIFA hexagon) |
| `src/components/player/StatsTable.tsx` | Use new match_player_stats data |
| `src/components/player/CompareView.tsx` | Use camera indexes + heatmaps |
| `src/lib/database.types.ts` | Regenerate after migration |
| `src/lib/translations.ts` | Add camera/stats translation keys |
| `src/lib/constants.ts` | Add stat thresholds, rating color scales |
| `supabase/seed.sql` | Remove old demo stats data |
| Navigation components | Add camera admin links for platform_admin |

**Note:** The old `match_player_stats.heat_map_data` JSONB column is replaced by the new `match_heatmaps` table (proper separation of concerns).

### Deleted Files/Data

| What | Why |
|------|-----|
| Seed data in matches, match_player_stats, player_skills, player_season_stats | Replaced by camera data |
| `player_season_stats` table | Replaced by computed aggregations from match_player_stats |

### Full Blast Radius of `player_season_stats` Removal

Files currently referencing `player_season_stats` that must be updated:

- `src/app/(platform)/players/[slug]/page.tsx`
- `src/app/(platform)/players/page.tsx`
- `src/app/(platform)/clubs/[slug]/page.tsx`
- `src/app/(platform)/players/compare/page.tsx`
- `src/app/api/players/route.ts`
- `src/app/api/players/[id]/route.ts`
- `src/app/api/players/[id]/pdf/route.ts`
- `src/app/api/players/ai-search/route.ts`
- `src/app/api/clubs/[slug]/route.ts`

## Key TypeScript Interfaces

Outline of types for `src/lib/camera/types.ts` (full implementation during build):

```typescript
// Event outcome shape (success/fail/neutral)
interface StarliveEventOutcome {
  sum: number
  per_minute: number
}

// Single event type (e.g. "pass", "dribble")
interface StarliveEvent {
  success?: StarliveEventOutcome
  fail?: StarliveEventOutcome
  neutral?: StarliveEventOutcome
}

// Per-match events keyed by event type name
interface StarliveMatchEvents {
  [eventType: string]: StarliveEvent | number  // number for activity_id
}

// Performance indexes
interface StarliveIndexes {
  attack: { forward_play: number | null, possession: number | null, dribling: number | null, shooting: number | null, set_piece: number | null, total: number }
  defence: { tackling: number | null, positioning: number | null, duels: number | null, pressing: number | null, goalkeeing: number | null, total: number }
  fitness: { distance: number | null, intensity: number | null, speed: number | null, total: number }
  overall: number
  activity_id: number
}

// Fitness data
interface StarliveFitness {
  distance: number, sprints_count: number, sprints_distance: number, speed_avg: number
  small_distance: number, middle_distance: number, big_distance: number, intense_running: number
  // ... _per_minute variants for each
  activity_id: number
}

// Activity (match) in player profile
interface StarliveActivity {
  id: number, kind: string
  home_team__name: string, guest_team__name: string
  activity_date: string
  home_team_goals?: number, guest_team_goals?: number
  home_team_color?: string, guest_team_color?: string
}

// Full player profile response (Source 1)
interface StarlivePlayerProfile {
  player_data: { id: number, first_name: string, last_name: string, teams: string, avatar: string, jersey: string[], teammates: StarliveTeammate[] }
  activities: StarliveActivity[]
  events: Record<string, StarliveMatchEvents>
  indexes: Record<string, StarliveIndexes>
  fitness: Record<string, StarliveFitness>
  player_stats: Record<string, { playing_time: { minutes: number }, activity_id: number }>
}

// Heatmap response (Source 2)
interface StarliveHeatmap {
  [playerKey: string]: { fps: number, field_step: number, coords: Record<string, number> }
}

// Match report response (Source 3)
interface StarliveMatchReport {
  result: {
    teams_data: Record<string, Record<string, StarliveTeamStat>>
    widgets: Record<string, StarliveWidgets>
    intervals_team_stats: Record<string, Record<string, Record<string, StarliveTeamStat>>>
    intervals_widgets: Record<string, Record<string, StarliveWidgets>>
  }
}
```

## Open Questions (Saved for Starlive Developer)

Full list in `docs/starlive-questions-for-developer.md`. Key blockers:

1. API delivery method (webhook vs poll vs both)
2. Authentication mechanism
3. Video file delivery and hosting
4. Player/team ID stability and mapping approach
5. Data freshness and correction timeline
6. Which Georgian clubs are currently covered
