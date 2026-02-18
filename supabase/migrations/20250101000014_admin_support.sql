-- ============================================================
-- Admin Support: Additional RLS policies for academy admin panel
-- ============================================================

-- Academy admins can view shortlists for their club's players (read-only)
-- This lets the admin dashboard show "X scouts have saved your players"
create policy "Academy admins can view shortlists for their club players"
  on public.shortlists for select
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.players
      where players.id = shortlists.player_id
        and players.club_id = public.get_user_club_id()
    )
  );
