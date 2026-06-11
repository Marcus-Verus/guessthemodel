-- Migration 005: Allow meta + opinion categories
--
-- types.ts has had 'meta' and 'opinion' for a while, but the battles
-- CHECK constraint was never widened — inserting battles in those
-- categories fails. The daily rotation now leans on them, so fix it.
--
-- Run in the Supabase SQL editor.

ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_category_check;
ALTER TABLE battles ADD CONSTRAINT battles_category_check
  CHECK (category IN ('coding', 'career', 'writing', 'research', 'roast', 'creator', 'meta', 'opinion'));
