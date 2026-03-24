-- Platform Pivot Session 2: Create leagues table
-- Single migration, single transaction for atomicity

BEGIN;

-- 1a. Create leagues table
CREATE TABLE IF NOT EXISTS public.leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ka text NOT NULL,
  age_group text NOT NULL CHECK (age_group IN ('U13', 'U15', 'U17', 'U19', 'U21', 'Senior')),
  season text NOT NULL CHECK (season ~ '^\d{4}-\d{2}$'),
  starlive_url text NOT NULL CHECK (starlive_url ~ '^https://'),
  description text,
  description_ka text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, age_group, season)
);

-- 1b. updated_at trigger (reuse existing function from migration 011)
CREATE TRIGGER update_leagues_updated_at
  BEFORE UPDATE ON public.leagues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 1c. Index for active leagues queries
CREATE INDEX idx_leagues_active ON public.leagues (is_active, display_order);

-- 1d. RLS
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

-- Public can view active leagues (uses cached auth.uid() pattern)
CREATE POLICY "Public can view active leagues"
  ON public.leagues FOR SELECT
  USING (is_active = true);

-- 1e. REVOKE write access from authenticated role
-- Platform admin uses createAdminClient() (service role) which bypasses both RLS and GRANTs
REVOKE INSERT, UPDATE, DELETE ON public.leagues FROM authenticated;

COMMIT;
