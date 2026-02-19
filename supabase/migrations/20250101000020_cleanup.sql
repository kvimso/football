-- ============================================================
-- Database cleanup migration
--
-- 1. Remove platform_admin from all RLS policies
-- 2. Rename pixellot_event_id to external_event_id
-- 3. Scope academy admin profiles SELECT to relevant scouts
-- ============================================================

-- ============================================================
-- 1. REMOVE PLATFORM_ADMIN FROM ALL RLS POLICIES
-- CLAUDE.md: "Do not build platform admin role — not in MVP scope"
-- Camera-managed tables (matches, stats, skills, videos) should
-- have NO write policies — writes come via service role only.
-- ============================================================

-- ================================
-- CLUBS: Drop platform_admin-only policies
-- No user can create/update/delete clubs via RLS — use service role.
-- ================================
drop policy if exists "Platform admins can insert clubs" on public.clubs;
drop policy if exists "Platform admins can update clubs" on public.clubs;
drop policy if exists "Platform admins can delete clubs" on public.clubs;

-- ================================
-- PLAYERS: Simplify INSERT/UPDATE to academy_admin only
-- ================================
drop policy if exists "Academy admins can insert players for their club" on public.players;
drop policy if exists "Academy admins can update players for their club" on public.players;

create policy "Academy admins can insert players for their club"
  on public.players for insert
  with check (
    public.get_user_role() = 'academy_admin'
    and public.get_user_club_id() = club_id
  );

create policy "Academy admins can update players for their club"
  on public.players for update
  using (
    public.get_user_role() = 'academy_admin'
    and public.get_user_club_id() = club_id
  );

-- ================================
-- PLAYER_CLUB_HISTORY: Simplify to academy_admin only
-- ================================
drop policy if exists "Club admins can insert club history for their club" on public.player_club_history;
drop policy if exists "Club admins can update club history for their club" on public.player_club_history;

create policy "Club admins can insert club history for their club"
  on public.player_club_history for insert
  with check (
    public.get_user_role() = 'academy_admin'
    and public.get_user_club_id() = club_id
  );

create policy "Club admins can update club history for their club"
  on public.player_club_history for update
  using (
    public.get_user_role() = 'academy_admin'
    and public.get_user_club_id() = club_id
  );

-- ================================
-- TRANSFER_REQUESTS: Simplify to academy_admin only
-- ================================
drop policy if exists "Club admins can view their transfer requests" on public.transfer_requests;
drop policy if exists "Club admins can create transfer requests to their club" on public.transfer_requests;
drop policy if exists "Club admins can respond to transfer requests from their club" on public.transfer_requests;

create policy "Club admins can view their transfer requests"
  on public.transfer_requests for select
  using (
    public.get_user_role() = 'academy_admin'
    and (
      public.get_user_club_id() = from_club_id
      or public.get_user_club_id() = to_club_id
    )
  );

create policy "Club admins can create transfer requests to their club"
  on public.transfer_requests for insert
  with check (
    public.get_user_role() = 'academy_admin'
    and public.get_user_club_id() = to_club_id
  );

create policy "Club admins can respond to transfer requests from their club"
  on public.transfer_requests for update
  using (
    public.get_user_role() = 'academy_admin'
    and public.get_user_club_id() = from_club_id
  );

-- ================================
-- MATCHES: Drop platform_admin write policies (service role only)
-- ================================
drop policy if exists "Platform admins can insert matches" on public.matches;
drop policy if exists "Platform admins can update matches" on public.matches;
drop policy if exists "Platform admins can delete matches" on public.matches;

-- ================================
-- MATCH_PLAYER_STATS: Drop platform_admin write policies (service role only)
-- ================================
drop policy if exists "Platform admins can insert match player stats" on public.match_player_stats;
drop policy if exists "Platform admins can update match player stats" on public.match_player_stats;
drop policy if exists "Platform admins can delete match player stats" on public.match_player_stats;

-- ================================
-- PLAYER_SEASON_STATS: Drop platform_admin write policies (service role only)
-- ================================
drop policy if exists "Platform admins can insert season stats" on public.player_season_stats;
drop policy if exists "Platform admins can update season stats" on public.player_season_stats;
drop policy if exists "Platform admins can delete season stats" on public.player_season_stats;

-- ================================
-- PLAYER_SKILLS: Drop platform_admin write policies (service role only)
-- ================================
drop policy if exists "Platform admins can insert player skills" on public.player_skills;
drop policy if exists "Platform admins can update player skills" on public.player_skills;
drop policy if exists "Platform admins can delete player skills" on public.player_skills;

-- ================================
-- PLAYER_VIDEOS: Drop platform_admin write policies (service role only)
-- ================================
drop policy if exists "Platform admins can insert player videos" on public.player_videos;
drop policy if exists "Platform admins can update player videos" on public.player_videos;
drop policy if exists "Platform admins can delete player videos" on public.player_videos;

-- ================================
-- PROFILES: Remove platform_admin, scope academy admin SELECT
-- ================================
drop policy if exists "Users can view profiles" on public.profiles;
drop policy if exists "Users can update profiles" on public.profiles;

-- 5.3: Academy admins can only see profiles of scouts who sent
-- contact requests for their club's players (not all profiles)
create policy "Users can view relevant profiles"
  on public.profiles for select
  using (
    (select auth.uid()) = id
    or (
      public.get_user_role() = 'academy_admin'
      and id in (
        select cr.scout_id from public.contact_requests cr
        join public.players p on p.id = cr.player_id
        where p.club_id = public.get_user_club_id()
      )
    )
  );

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ================================
-- CONTACT_REQUESTS: Remove platform_admin branches
-- ================================
drop policy if exists "Users can view contact requests" on public.contact_requests;
drop policy if exists "Admins can update contact requests" on public.contact_requests;

create policy "Users can view contact requests"
  on public.contact_requests for select
  using (
    (select auth.uid()) = scout_id
    or (
      public.get_user_role() = 'academy_admin'
      and exists (
        select 1 from public.players
        where players.id = contact_requests.player_id
          and players.club_id = public.get_user_club_id()
      )
    )
  );

create policy "Academy admins can update contact requests"
  on public.contact_requests for update
  using (
    public.get_user_role() = 'academy_admin'
    and exists (
      select 1 from public.players
      where players.id = contact_requests.player_id
        and players.club_id = public.get_user_club_id()
    )
  );

-- ================================
-- SHORTLISTS: Remove platform_admin from SELECT
-- ================================
drop policy if exists "Users can view shortlists" on public.shortlists;

create policy "Users can view shortlists"
  on public.shortlists for select
  using (
    (select auth.uid()) = scout_id
    or (
      public.get_user_role() = 'academy_admin'
      and exists (
        select 1 from public.players
        where players.id = shortlists.player_id
          and players.club_id = public.get_user_club_id()
      )
    )
  );


-- ============================================================
-- 2. RENAME pixellot_event_id TO external_event_id
-- Camera-agnostic naming per CLAUDE.md
-- ============================================================
alter table public.matches rename column pixellot_event_id to external_event_id;
