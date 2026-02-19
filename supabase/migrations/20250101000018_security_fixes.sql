-- ============================================================
-- Security & data integrity fixes
--
-- 1. Drop DELETE policy on players (preserve history, never delete)
-- 2. Fix source columns: NOT NULL, drop default, add CHECK constraint
-- 3. Add role check to shortlist INSERT policy
-- 4. Add player active status check to contact request INSERT
-- 5. Add missing index on players.status
-- 6. Change ON DELETE CASCADE to SET NULL on history/transfer FKs
-- ============================================================

-- ============================================================
-- 1. DROP DELETE POLICY ON PLAYERS
-- CLAUDE.md: "Do not delete player data — set status to free_agent"
-- ============================================================
drop policy if exists "Academy admins can delete players for their club" on public.players;

-- ============================================================
-- 2. FIX SOURCE COLUMNS
-- Source must always be a camera source, never 'manual'.
-- First update any existing 'manual' rows, then add constraints.
-- ============================================================

-- Fix any existing 'manual' source values before adding constraints
update public.player_season_stats set source = 'pixellot' where source = 'manual';
update public.match_player_stats set source = 'pixellot' where source = 'manual';

-- player_season_stats: make source NOT NULL, drop default, add CHECK
alter table public.player_season_stats alter column source set not null;
alter table public.player_season_stats alter column source drop default;
alter table public.player_season_stats add constraint chk_season_stats_source
  check (source in ('pixellot', 'zone14'));

-- match_player_stats: make source NOT NULL, drop default, add CHECK
alter table public.match_player_stats alter column source set not null;
alter table public.match_player_stats alter column source drop default;
alter table public.match_player_stats add constraint chk_match_stats_source
  check (source in ('pixellot', 'zone14'));

-- ============================================================
-- 3. ADD ROLE CHECK TO SHORTLIST INSERT POLICY
-- Currently any authenticated user can insert — should be scouts only.
-- ============================================================
drop policy if exists "Scouts can add to their shortlist" on public.shortlists;

create policy "Scouts can add to their shortlist"
  on public.shortlists for insert
  with check (
    (select auth.uid()) = scout_id
    and public.get_user_role() = 'scout'
  );

-- ============================================================
-- 4. ADD PLAYER ACTIVE STATUS CHECK TO CONTACT REQUEST INSERT
-- Scouts should only be able to contact active players (not free agents).
-- ============================================================
drop policy if exists "Scouts can create contact requests" on public.contact_requests;

create policy "Scouts can create contact requests"
  on public.contact_requests for insert
  with check (
    (select auth.uid()) = scout_id
    and public.get_user_role() = 'scout'
    and exists (
      select 1 from public.players where id = player_id and status = 'active'
    )
  );

-- ============================================================
-- 5. ADD MISSING INDEX
-- ============================================================
create index if not exists idx_players_status on public.players(status);

-- ============================================================
-- 6. CHANGE ON DELETE CASCADE TO SET NULL ON HISTORY/TRANSFER FKs
-- Preserves audit trail when a club is deleted.
-- ============================================================

-- player_club_history: club_id should SET NULL on club delete
alter table public.player_club_history drop constraint if exists player_club_history_club_id_fkey;
alter table public.player_club_history alter column club_id drop not null;
alter table public.player_club_history add constraint player_club_history_club_id_fkey
  foreign key (club_id) references public.clubs(id) on delete set null;

-- transfer_requests: from_club_id should SET NULL on club delete
alter table public.transfer_requests drop constraint if exists transfer_requests_from_club_id_fkey;
alter table public.transfer_requests alter column from_club_id drop not null;
alter table public.transfer_requests add constraint transfer_requests_from_club_id_fkey
  foreign key (from_club_id) references public.clubs(id) on delete set null;

-- transfer_requests: to_club_id should SET NULL on club delete
alter table public.transfer_requests drop constraint if exists transfer_requests_to_club_id_fkey;
alter table public.transfer_requests alter column to_club_id drop not null;
alter table public.transfer_requests add constraint transfer_requests_to_club_id_fkey
  foreign key (to_club_id) references public.clubs(id) on delete set null;
