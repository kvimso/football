BEGIN;

-- Add terms acceptance timestamp
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

-- Backfill existing users (they implicitly accepted by using the platform)
UPDATE public.profiles SET terms_accepted_at = created_at WHERE terms_accepted_at IS NULL;

-- Update handle_new_user() — ALSO fixes critical security issue:
-- Old trigger allowed platform_admin role from signup metadata.
-- New trigger only allows 'scout' and 'academy_admin' from metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  _role text;
  _club_id uuid;
  _is_approved boolean;
  _club_exists boolean;
BEGIN
  _role := coalesce(new.raw_user_meta_data->>'role', 'scout');
  _club_id := nullif(trim(coalesce(new.raw_user_meta_data->>'club_id', '')), '')::uuid;

  IF _role = 'academy_admin' AND _club_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.clubs WHERE id = _club_id) INTO _club_exists;
    IF _club_exists THEN
      _is_approved := true;
    ELSE
      _role := 'scout';
      _club_id := NULL;
      _is_approved := false;
    END IF;
  ELSE
    _is_approved := false;
    -- SECURITY FIX: only allow known safe roles from metadata
    -- platform_admin must NEVER come from signup — only manual DB assignment
    IF _role NOT IN ('scout', 'academy_admin') THEN
      _role := 'scout';
    END IF;
    _club_id := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, organization, country, role, club_id, is_approved, terms_accepted_at)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'organization', ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'country', '')), ''),
    _role,
    _club_id,
    _is_approved,
    -- Server-authoritative timestamp: use now() when metadata key exists.
    -- Never trust client-provided timestamps for legal consent records.
    -- The key's presence signals checkbox was checked; server stamps when.
    CASE WHEN new.raw_user_meta_data ? 'terms_accepted_at' THEN now() ELSE NULL END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
