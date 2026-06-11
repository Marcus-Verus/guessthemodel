-- Migration 004: Match-the-model daily game
--
-- The game changed from "pick the better of two" to "tag all five responses
-- with the model you think wrote each". Votes now store the full guess map
-- and the resulting score.
--
-- Run in the Supabase SQL editor.

-- Full guess map, keyed by canonical slot: { "A": "claude", "B": "grok", ... }
ALTER TABLE votes ADD COLUMN IF NOT EXISTS guesses jsonb;

-- Number of correct tags (0..5). NULL for legacy votes from the old game.
ALTER TABLE votes ADD COLUMN IF NOT EXISTS score int;

-- choice continues to store the player's favorite response (canonical slot).
