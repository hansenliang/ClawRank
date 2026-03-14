-- ClawRank migration v7: user-owned unique agent slugs
-- Idempotent — safe to run multiple times against Neon DB.
-- Run with psql or the Neon console.

BEGIN;

-- ── Step 1: Add username column to users (idempotent) ──────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username TEXT;

-- Give it a temporary default so we can populate it safely
UPDATE users SET username = '' WHERE username IS NULL;

-- ── Step 2: Backfill usernames from linked_accounts GitHub handles ──────────

-- First pass: use GitHub linked account handle (slugified)
UPDATE users u
SET username = LOWER(REGEXP_REPLACE(la.handle, '[^a-z0-9]+', '-', 'gi'))
FROM linked_accounts la
WHERE la.user_id = u.id
  AND la.provider = 'github'
  AND la.handle IS NOT NULL
  AND la.handle <> ''
  AND (u.username IS NULL OR u.username = '');

-- Strip leading/trailing hyphens produced by slugification
UPDATE users
SET username = TRIM(BOTH '-' FROM username)
WHERE username ~ '^-|−$';

-- Second pass: for any still-empty, derive from display_name
UPDATE users u
SET username = LOWER(REGEXP_REPLACE(COALESCE(u.display_name, 'user'), '[^a-z0-9]+', '-', 'gi'))
WHERE u.username IS NULL OR u.username = '';

UPDATE users
SET username = TRIM(BOTH '-' FROM username)
WHERE username ~ '^-|-$';

-- Ensure no empty strings remain
UPDATE users SET username = 'user' WHERE username = '' OR username IS NULL;

-- ── Step 3: Deduplicate usernames (add -2, -3 suffixes for collisions) ─────

DO $$
DECLARE
  rec RECORD;
  suffix INT;
  candidate TEXT;
BEGIN
  -- Find duplicates ordered by created_at (oldest keeps base name)
  FOR rec IN
    SELECT id, username
    FROM users
    WHERE username IN (
      SELECT username FROM users GROUP BY username HAVING COUNT(*) > 1
    )
    ORDER BY created_at ASC, id ASC
  LOOP
    -- Check if this user is NOT the earliest with this username
    IF EXISTS (
      SELECT 1 FROM users
      WHERE username = rec.username
        AND (created_at < (SELECT created_at FROM users WHERE id = rec.id)
             OR (created_at = (SELECT created_at FROM users WHERE id = rec.id) AND id < rec.id))
    ) THEN
      -- Needs a suffix
      suffix := 2;
      LOOP
        candidate := rec.username || '-' || suffix;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE username = candidate);
        suffix := suffix + 1;
        IF suffix > 99 THEN
          RAISE EXCEPTION 'Too many username collisions for %', rec.username;
        END IF;
      END LOOP;
      UPDATE users SET username = candidate WHERE id = rec.id;
    END IF;
  END LOOP;
END $$;

-- ── Step 4: Make username NOT NULL UNIQUE ──────────────────────────────────

-- Drop constraint if it already exists (idempotency)
DO $$
BEGIN
  ALTER TABLE users ALTER COLUMN username SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- ── Step 5: Ensure agents.user_id is populated (create phantom users) ───────

-- For each distinct owner_name among agents with NULL user_id,
-- create a phantom user (no linked_accounts) if one doesn't already exist.
DO $$
DECLARE
  rec RECORD;
  base_username TEXT;
  final_username TEXT;
  suffix INT;
  phantom_id UUID;
BEGIN
  FOR rec IN
    SELECT DISTINCT owner_name FROM agents WHERE user_id IS NULL
  LOOP
    base_username := LOWER(REGEXP_REPLACE(rec.owner_name, '[^a-z0-9]+', '-', 'gi'));
    base_username := TRIM(BOTH '-' FROM base_username);
    IF base_username = '' THEN base_username := 'user'; END IF;

    -- Check if a user with this username already exists
    SELECT id INTO phantom_id FROM users WHERE username = base_username LIMIT 1;

    IF NOT FOUND THEN
      -- Allocate a unique username
      final_username := base_username;
      suffix := 2;
      WHILE EXISTS (SELECT 1 FROM users WHERE username = final_username) LOOP
        final_username := base_username || '-' || suffix;
        suffix := suffix + 1;
        IF suffix > 99 THEN
          RAISE EXCEPTION 'Too many username collisions for %', rec.owner_name;
        END IF;
      END LOOP;

      -- Create phantom user
      INSERT INTO users (display_name, username, created_at, updated_at)
      VALUES (rec.owner_name, final_username, now(), now())
      RETURNING id INTO phantom_id;
    END IF;

    -- Assign this user to all matching agents
    UPDATE agents
    SET user_id = phantom_id, updated_at = now()
    WHERE user_id IS NULL
      AND LOWER(owner_name) = LOWER(rec.owner_name);
  END LOOP;
END $$;

-- ── Step 6: Make agents.user_id NOT NULL ───────────────────────────────────

DO $$
BEGIN
  ALTER TABLE agents ALTER COLUMN user_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── Step 7: Migrate unique constraint on agents from slug alone to (user_id, slug) ──

-- Remove old unique constraint on slug (if it exists under default name)
DO $$
BEGIN
  ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_slug_key;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add composite unique constraint
DO $$
BEGIN
  ALTER TABLE agents ADD CONSTRAINT agents_user_id_slug_unique UNIQUE (user_id, slug);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- ── Step 8: Add composite index ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_agents_user_slug ON agents(user_id, slug);

COMMIT;
