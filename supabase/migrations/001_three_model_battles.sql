-- Migration 001: Switch to 3-model battles (Claude / ChatGPT / Gemini)
--
-- Run this in Supabase SQL editor if you have existing data.
-- For a fresh database just use schema.sql instead.

-- Update votes.choice constraint to support C and all_bad
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_choice_check;
ALTER TABLE votes ADD CONSTRAINT votes_choice_check
  CHECK (choice IN ('A', 'B', 'C', 'all_bad'));

-- Rename any legacy 'both_bad' votes to 'all_bad' (safe no-op if none exist)
UPDATE votes SET choice = 'all_bad' WHERE choice = 'both_bad';
