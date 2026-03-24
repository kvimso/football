-- Platform Pivot Session 1: is_approved + security hardening
-- Single migration, single transaction for atomicity

BEGIN;

-- 7a. Add is_approved column (zero-lockout pattern)
-- Step 1: DEFAULT true — existing rows instantly read as true (PG11+ catalog-only, no table rewrite)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true;
-- Step 2: Change default to false — new signups get false
ALTER TABLE public.profiles ALTER COLUMN is_approved SET DEFAULT false;

-- 7b. Column-level GRANT restrictions (CRITICAL security fix)
-- Prevents users from self-escalating role or is_approved via browser console
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, organization, email, phone, country) ON public.profiles TO authenticated;
-- Note: platform admin uses service role client which bypasses GRANTs entirely

-- 7c. Rewrite handle_new_user() trigger (invite-aware + is_approved)
-- Fixes regression from migration 39 which always set role='scout'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  _role text;
  _club_id uuid;
  _is_approved boolean;
  _club_exists boolean;
BEGIN
  -- Read role and club_id from invitation metadata (set by admin-invite.ts)
  _role := coalesce(new.raw_user_meta_data->>'role', 'scout');
  _club_id := nullif(trim(coalesce(new.raw_user_meta_data->>'club_id', '')), '')::uuid;

  -- Validate: if academy_admin, club must exist
  IF _role = 'academy_admin' AND _club_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.clubs WHERE id = _club_id) INTO _club_exists;
    IF _club_exists THEN
      _is_approved := true;  -- Invited academy admins are pre-approved
    ELSE
      -- Invalid club_id in metadata — fall back to scout
      _role := 'scout';
      _club_id := NULL;
      _is_approved := false;
    END IF;
  ELSE
    -- Default: scouts need approval
    _is_approved := false;
    IF _role != 'scout' AND _role != 'platform_admin' THEN
      _role := 'scout';  -- Only allow known roles
    END IF;
    _club_id := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, organization, country, role, club_id, is_approved)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'organization', ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'country', '')), ''),
    _role,
    _club_id,
    _is_approved
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
