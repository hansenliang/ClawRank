-- Migration v5: Add date_precision to daily_agent_facts
-- Tracks whether a fact represents a true daily data point or a cumulative estimate.
-- 'day' = genuine daily-granular data (from skill ingestion)
-- 'cumulative' = vague lifetime total (from manual seeding, X scrapes, etc.)
--
-- Period-filtered views (7 days, 30 days) only include 'day' facts.
-- 'All time' includes everything.

ALTER TABLE daily_agent_facts
  ADD COLUMN IF NOT EXISTS date_precision TEXT NOT NULL DEFAULT 'day'
  CHECK (date_precision IN ('day', 'cumulative'));
