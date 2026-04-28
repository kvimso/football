-- Phase 7 redesign: paid-tier ranking + customizable club page fields.
-- See docs/plans/2026-04-28-phase-7-redesign-master-plan.md (Track 1).
-- Replaces the trigger-based tier protection with column-level GRANTs (3-layer
-- defense) so academy admins cannot mutate tier, slug, name, id even via
-- direct PostgREST calls.

------------------------------------------------------------------------
-- 1. Schema additions
------------------------------------------------------------------------

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS tier integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hero_photo_url text,
  ADD COLUMN IF NOT EXISTS history_text text,
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.clubs.tier IS
  'Paid tier for /clubs directory ordering. Higher = ranked higher. 0 = unpaid/default. Platform-admin-only via column-level GRANT.';
COMMENT ON COLUMN public.clubs.hero_photo_url IS
  'Full-bleed banner image for club detail page. Optional.';
COMMENT ON COLUMN public.clubs.history_text IS
  'Long-form club history shown on detail page. Plain text, paragraph-split on \n\n.';
COMMENT ON COLUMN public.clubs.gallery_urls IS
  'Ordered list of club photo URLs (≤12). text[] for v1; upgrade to jsonb for alt text in v1.5.';

------------------------------------------------------------------------
-- 2. Data integrity CHECK constraints
------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clubs_tier_range') THEN
    ALTER TABLE public.clubs ADD CONSTRAINT clubs_tier_range
      CHECK (tier >= 0 AND tier <= 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clubs_gallery_size') THEN
    ALTER TABLE public.clubs ADD CONSTRAINT clubs_gallery_size
      CHECK (cardinality(gallery_urls) <= 12);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clubs_hero_url_format') THEN
    ALTER TABLE public.clubs ADD CONSTRAINT clubs_hero_url_format
      CHECK (hero_photo_url IS NULL OR hero_photo_url ~ '^https?://');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clubs_slug_format') THEN
    ALTER TABLE public.clubs ADD CONSTRAINT clubs_slug_format
      CHECK (slug ~ '^[a-z0-9-]+$');
  END IF;
END$$;

------------------------------------------------------------------------
-- 3. Tier-ordered index for /clubs directory
------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS clubs_tier_name_idx
  ON public.clubs (tier DESC, name ASC);

------------------------------------------------------------------------
-- 4. Academy admin UPDATE policy (RLS — first defense layer)
------------------------------------------------------------------------

DROP POLICY IF EXISTS "Academy admin updates own club" ON public.clubs;
CREATE POLICY "Academy admin updates own club" ON public.clubs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'academy_admin'
        AND profiles.club_id = clubs.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'academy_admin'
        AND profiles.club_id = clubs.id
    )
  );

------------------------------------------------------------------------
-- 5. Column-level GRANT (second defense layer — schema-level guarantee)
--
-- Even with the RLS policy above, PostgREST would otherwise let an academy
-- admin mutate `tier`, `slug`, `name`, `id` via a direct UPDATE call. By
-- revoking the table-level UPDATE and granting only the specific columns,
-- we guarantee at the schema level that those columns cannot be touched
-- by an authenticated user. Service role bypasses GRANTs.
------------------------------------------------------------------------

REVOKE UPDATE ON public.clubs FROM authenticated, anon;
GRANT UPDATE (
  logo_url,
  hero_photo_url,
  history_text,
  gallery_urls,
  description,
  website,
  city,
  region,
  updated_at
) ON public.clubs TO authenticated;

------------------------------------------------------------------------
-- 6. Storage bucket: club-assets (logos, hero photos, gallery images)
------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'club-assets',
  'club-assets',
  true,
  10485760,                                              -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public            = EXCLUDED.public,
      file_size_limit   = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

------------------------------------------------------------------------
-- 7. Storage policies (per-slug folder isolation for academy admins)
--
-- Path convention: club-assets/<club-slug>/{logo,hero,gallery/<uuid>}.<ext>
-- The slug regex CHECK on clubs.slug prevents path traversal via slug.
------------------------------------------------------------------------

-- Note: no SELECT policy on storage.objects for the club-assets bucket.
-- Public buckets serve objects directly by URL via Supabase Storage API,
-- so the policy is redundant. Adding one would allow clients to enumerate
-- all files via the LIST endpoint, which exposes internal paths
-- (Supabase advisor 0025 — public_bucket_allows_listing).
DROP POLICY IF EXISTS "Anyone can view club assets" ON storage.objects;
DROP POLICY IF EXISTS "Academy admin manages own club assets" ON storage.objects;
DROP POLICY IF EXISTS "Academy admin inserts own club assets" ON storage.objects;
DROP POLICY IF EXISTS "Academy admin updates own club assets" ON storage.objects;
DROP POLICY IF EXISTS "Academy admin deletes own club assets" ON storage.objects;

CREATE POLICY "Academy admin inserts own club assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'club-assets'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.clubs c ON c.id = p.club_id
      WHERE p.id = auth.uid()
        AND p.role = 'academy_admin'
        AND (storage.foldername(name))[1] = c.slug
    )
  );

CREATE POLICY "Academy admin updates own club assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'club-assets'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.clubs c ON c.id = p.club_id
      WHERE p.id = auth.uid()
        AND p.role = 'academy_admin'
        AND (storage.foldername(name))[1] = c.slug
    )
  );

CREATE POLICY "Academy admin deletes own club assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'club-assets'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.clubs c ON c.id = p.club_id
      WHERE p.id = auth.uid()
        AND p.role = 'academy_admin'
        AND (storage.foldername(name))[1] = c.slug
    )
  );

------------------------------------------------------------------------
-- 8. Reload PostgREST schema cache so new columns surface immediately
------------------------------------------------------------------------

NOTIFY pgrst, 'reload schema';
