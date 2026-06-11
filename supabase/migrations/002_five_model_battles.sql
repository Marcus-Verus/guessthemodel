-- Migration 002: Expand to 5-model battles (add Grok + Perplexity)
--
-- Run in Supabase SQL editor if you have existing data.
-- For a fresh database just use schema.sql instead.

-- Expand votes.choice constraint to allow D and E positions
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_choice_check;
ALTER TABLE votes ADD CONSTRAINT votes_choice_check
  CHECK (choice IN ('A', 'B', 'C', 'D', 'E', 'all_bad'));

-- battles.outputs is JSONB — no schema change needed.
-- New battles will have modelD and modelE keys; existing battles remain valid.
