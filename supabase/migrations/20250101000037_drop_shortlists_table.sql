-- Drop the old shortlists table now that all data has been migrated to the watchlist system.
-- Migration 000036 already migrated existing shortlist entries to the watchlist table.
-- All code references have been updated from shortlists → watchlist.

DROP TABLE IF EXISTS public.shortlists;
