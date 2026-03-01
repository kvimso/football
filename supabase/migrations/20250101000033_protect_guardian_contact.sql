-- ============================================================
-- Migration: Protect parent_guardian_contact from unauthorized access
--
-- The players table has an open SELECT policy (using true), which means
-- any authenticated user (including scouts) can query parent_guardian_contact
-- directly via the Supabase client. This migration restricts SELECT to
-- specific columns, excluding the sensitive field.
--
-- An RPC function is provided for authorized admins to read the field.
-- ============================================================

-- 1. Revoke table-level SELECT from public roles
REVOKE SELECT ON public.players FROM anon, authenticated;

-- 2. Grant SELECT on all columns EXCEPT parent_guardian_contact
GRANT SELECT (
  id, club_id, name, name_ka, slug, date_of_birth, nationality,
  position, preferred_foot, height_cm, weight_kg, photo_url,
  jersey_number, scouting_report, scouting_report_ka, status,
  is_featured, platform_id, created_at, updated_at
) ON public.players TO anon, authenticated;

-- 3. Create RPC for authorized admin access to parent_guardian_contact
CREATE OR REPLACE FUNCTION public.get_player_guardian_contact(p_player_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
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
