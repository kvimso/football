-- Add photo_url, season_start, season_end columns to leagues table
-- Plus CHECK constraints for data integrity and security

BEGIN;

-- New columns
ALTER TABLE public.leagues ADD COLUMN photo_url text;
ALTER TABLE public.leagues ADD COLUMN season_start date;
ALTER TABLE public.leagues ADD COLUMN season_end date;

-- CHECK constraints
ALTER TABLE public.leagues ADD CONSTRAINT leagues_photo_url_https
  CHECK (photo_url IS NULL OR photo_url ~ '^https://');
ALTER TABLE public.leagues ADD CONSTRAINT leagues_photo_url_length
  CHECK (photo_url IS NULL OR length(photo_url) <= 2048);
ALTER TABLE public.leagues ADD CONSTRAINT leagues_season_dates_check
  CHECK (
    (season_start IS NULL AND season_end IS NULL)
    OR (season_start IS NOT NULL AND season_end IS NOT NULL AND season_start < season_end)
  );

-- Fix existing gap: logo_url lacks HTTPS constraint
ALTER TABLE public.leagues ADD CONSTRAINT leagues_logo_url_https
  CHECK (logo_url IS NULL OR logo_url ~ '^https://');

-- Seed existing leagues with placeholder dates
UPDATE public.leagues SET season_start = '2025-09-01', season_end = '2026-05-31'
  WHERE age_group = 'U19';
UPDATE public.leagues SET season_start = '2025-09-01', season_end = '2026-04-30'
  WHERE age_group = 'U17';
UPDATE public.leagues SET season_start = '2025-10-01', season_end = '2026-04-30'
  WHERE age_group = 'U15';

COMMIT;
