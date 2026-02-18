-- ============================================================
-- Migration: Player updates, club history, transfer requests
--
-- 1. Players: status enum, platform_id, parent_guardian_contact
-- 2. New table: player_club_history
-- 3. New table: transfer_requests
-- 4. RLS: remove club admin write on camera-managed tables
-- 5. RLS: add policies for new tables
-- ============================================================

-- ============================================================
-- 1. PLAYER TABLE UPDATES
-- ============================================================

-- 1a. Create player_status enum and convert status column
create type public.player_status as enum ('active', 'free_agent');

alter table public.players
  alter column status drop default,
  alter column status type public.player_status using status::public.player_status,
  alter column status set default 'active';

-- 1b. Add platform_id (unique, auto-generated GFP-XXXXX format)
create sequence public.player_platform_id_seq start with 1;

alter table public.players
  add column platform_id text unique;

-- Backfill existing players with platform IDs (ordered by created_at for determinism)
with numbered as (
  select id, row_number() over (order by created_at, id) as rn
  from public.players
)
update public.players
set platform_id = 'GFP-' || lpad(numbered.rn::text, 5, '0')
from numbered
where players.id = numbered.id;

-- Advance sequence past existing players
select setval('public.player_platform_id_seq', (select count(*) from public.players));

-- Make platform_id NOT NULL now that all rows have values
alter table public.players
  alter column platform_id set not null;

-- Trigger: auto-generate platform_id on insert
create or replace function public.generate_platform_id()
returns trigger as $$
begin
  if new.platform_id is null then
    new.platform_id := 'GFP-' || lpad(nextval('public.player_platform_id_seq')::text, 5, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_player_platform_id
  before insert on public.players
  for each row
  execute function public.generate_platform_id();

-- 1c. Add parent_guardian_contact (nullable, sensitive — app layer must never expose to scouts/public)
alter table public.players
  add column parent_guardian_contact text;

-- ============================================================
-- 2. PLAYER CLUB HISTORY TABLE
-- ============================================================
create table public.player_club_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  joined_at date not null default current_date,
  left_at date
);

create index idx_player_club_history_player on public.player_club_history(player_id);
create index idx_player_club_history_club on public.player_club_history(club_id);

alter table public.player_club_history enable row level security;

-- Public read
create policy "Player club history is publicly viewable"
  on public.player_club_history for select
  using (true);

-- Club admins can insert history for their club
create policy "Club admins can insert club history for their club"
  on public.player_club_history for insert
  with check (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and (public.get_user_club_id() = club_id or public.get_user_role() = 'platform_admin')
  );

-- Club admins can update history for their club
create policy "Club admins can update club history for their club"
  on public.player_club_history for update
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and (public.get_user_club_id() = club_id or public.get_user_role() = 'platform_admin')
  );

-- Backfill: create history rows for all existing players currently at a club
insert into public.player_club_history (player_id, club_id, joined_at)
select id, club_id, created_at::date
from public.players
where club_id is not null;

-- ============================================================
-- 3. TRANSFER REQUESTS TABLE
-- ============================================================
create type public.transfer_status as enum ('pending', 'accepted', 'declined', 'expired');

create table public.transfer_requests (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  from_club_id uuid not null references public.clubs(id) on delete cascade,
  to_club_id uuid not null references public.clubs(id) on delete cascade,
  status public.transfer_status not null default 'pending',
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index idx_transfer_requests_player on public.transfer_requests(player_id);
create index idx_transfer_requests_from_club on public.transfer_requests(from_club_id);
create index idx_transfer_requests_to_club on public.transfer_requests(to_club_id);
create index idx_transfer_requests_status on public.transfer_requests(status);

alter table public.transfer_requests enable row level security;

-- Club admins can SELECT where from_club_id or to_club_id matches their club
create policy "Club admins can view their transfer requests"
  on public.transfer_requests for select
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and (
      public.get_user_club_id() = from_club_id
      or public.get_user_club_id() = to_club_id
      or public.get_user_role() = 'platform_admin'
    )
  );

-- Club admins can INSERT where to_club_id matches their club (request a player TO their club)
create policy "Club admins can create transfer requests to their club"
  on public.transfer_requests for insert
  with check (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and (public.get_user_club_id() = to_club_id or public.get_user_role() = 'platform_admin')
  );

-- Club admins can UPDATE (accept/decline) where from_club_id matches their club
create policy "Club admins can respond to transfer requests from their club"
  on public.transfer_requests for update
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and (public.get_user_club_id() = from_club_id or public.get_user_role() = 'platform_admin')
  );

-- ============================================================
-- 4. REMOVE CLUB ADMIN WRITE PERMISSIONS ON CAMERA-MANAGED TABLES
-- These tables are managed by Pixellot/camera API or platform admins only.
-- ============================================================

-- MATCHES: remove academy_admin insert/update
drop policy if exists "Academy admins can insert matches" on public.matches;
drop policy if exists "Academy admins can update matches" on public.matches;

create policy "Platform admins can insert matches"
  on public.matches for insert
  with check (public.get_user_role() = 'platform_admin');

create policy "Platform admins can update matches"
  on public.matches for update
  using (public.get_user_role() = 'platform_admin');

-- MATCH PLAYER STATS: remove academy_admin insert/update/delete
drop policy if exists "Academy admins can insert match player stats" on public.match_player_stats;
drop policy if exists "Academy admins can update match player stats" on public.match_player_stats;
drop policy if exists "Academy admins can delete match player stats" on public.match_player_stats;

create policy "Platform admins can insert match player stats"
  on public.match_player_stats for insert
  with check (public.get_user_role() = 'platform_admin');

create policy "Platform admins can update match player stats"
  on public.match_player_stats for update
  using (public.get_user_role() = 'platform_admin');

create policy "Platform admins can delete match player stats"
  on public.match_player_stats for delete
  using (public.get_user_role() = 'platform_admin');

-- PLAYER SEASON STATS: remove academy_admin insert/update/delete
drop policy if exists "Academy admins can insert season stats" on public.player_season_stats;
drop policy if exists "Academy admins can update season stats" on public.player_season_stats;
drop policy if exists "Academy admins can delete season stats" on public.player_season_stats;

create policy "Platform admins can insert season stats"
  on public.player_season_stats for insert
  with check (public.get_user_role() = 'platform_admin');

create policy "Platform admins can update season stats"
  on public.player_season_stats for update
  using (public.get_user_role() = 'platform_admin');

create policy "Platform admins can delete season stats"
  on public.player_season_stats for delete
  using (public.get_user_role() = 'platform_admin');

-- PLAYER SKILLS: remove academy_admin insert/update/delete
drop policy if exists "Academy admins can insert player skills" on public.player_skills;
drop policy if exists "Academy admins can update player skills" on public.player_skills;
drop policy if exists "Academy admins can delete player skills" on public.player_skills;

create policy "Platform admins can insert player skills"
  on public.player_skills for insert
  with check (public.get_user_role() = 'platform_admin');

create policy "Platform admins can update player skills"
  on public.player_skills for update
  using (public.get_user_role() = 'platform_admin');

create policy "Platform admins can delete player skills"
  on public.player_skills for delete
  using (public.get_user_role() = 'platform_admin');

-- PLAYER VIDEOS: remove academy_admin insert/update/delete
drop policy if exists "Academy admins can insert player videos" on public.player_videos;
drop policy if exists "Academy admins can update player videos" on public.player_videos;
drop policy if exists "Academy admins can delete player videos" on public.player_videos;

create policy "Platform admins can insert player videos"
  on public.player_videos for insert
  with check (public.get_user_role() = 'platform_admin');

create policy "Platform admins can update player videos"
  on public.player_videos for update
  using (public.get_user_role() = 'platform_admin');

create policy "Platform admins can delete player videos"
  on public.player_videos for delete
  using (public.get_user_role() = 'platform_admin');
