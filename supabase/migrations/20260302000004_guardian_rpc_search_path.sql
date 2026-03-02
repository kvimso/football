-- ============================================================
-- Migration: Add SET search_path to get_player_guardian_contact
--
-- The SECURITY DEFINER function was missing search_path, which could
-- allow schema-shadowing attacks. All other SECURITY DEFINER functions
-- in the codebase already have this set.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_player_guardian_contact(p_player_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.parent_guardian_contact
  FROM public.players p
  JOIN public.profiles pr ON pr.id = auth.uid()
  WHERE p.id = p_player_id
    AND (
      (pr.role = 'academy_admin' AND pr.club_id = p.club_id)
      OR pr.role = 'platform_admin'
    );
$$;
