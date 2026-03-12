/**
 * Seed the Postgres database from data/clawrank-pilot.json
 * Usage: DATABASE_URL=... pnpm tsx scripts/seed-db.ts
 */
import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import type { ClawRankStore } from '../src/contracts/clawrank-domain';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const pilotPath = path.join(process.cwd(), 'data', 'clawrank-pilot.json');
if (!fs.existsSync(pilotPath)) {
  console.error(`Pilot data not found: ${pilotPath}`);
  process.exit(1);
}

const store: ClawRankStore = JSON.parse(fs.readFileSync(pilotPath, 'utf8'));

async function createTables() {
  console.log('Creating tables...');

  await sql`CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id     TEXT,
    github_username TEXT,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS agents (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID REFERENCES users(id),
    slug                  TEXT NOT NULL UNIQUE,
    agent_name            TEXT NOT NULL,
    owner_name            TEXT NOT NULL,
    state                 TEXT NOT NULL DEFAULT 'estimated' CHECK (state IN ('live', 'verified', 'estimated')),
    primary_github_username TEXT,
    x_handle              TEXT,
    bio                   TEXT,
    avatar_url            TEXT,
    source_of_truth       TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_submission_at    TIMESTAMPTZ
  )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug)`;

  await sql`CREATE TABLE IF NOT EXISTS daily_agent_facts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id            UUID NOT NULL REFERENCES agents(id),
    date                DATE NOT NULL,
    total_tokens        BIGINT NOT NULL DEFAULT 0,
    input_tokens        BIGINT,
    output_tokens       BIGINT,
    cache_read_tokens   BIGINT,
    cache_write_tokens  BIGINT,
    session_count       INTEGER,
    longest_run_seconds INTEGER,
    most_active_hour    SMALLINT CHECK (most_active_hour IS NULL OR (most_active_hour >= 0 AND most_active_hour <= 23)),
    top_model           TEXT,
    estimated_cost_usd  NUMERIC(12, 4),
    source_type         TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('skill', 'manual', 'x_scrape')),
    source_adapter      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(agent_id, date)
  )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_daily_agent_facts_agent_date ON daily_agent_facts(agent_id, date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_daily_agent_facts_date ON daily_agent_facts(date)`;

  console.log('Tables created.');
}

async function seed() {
  await createTables();

  console.log(`Seeding ${store.agents.length} agents...`);
  for (const agent of store.agents) {
    await sql`
      INSERT INTO agents (id, user_id, slug, agent_name, owner_name, state, primary_github_username, x_handle, bio, avatar_url, source_of_truth, created_at, updated_at, last_submission_at)
      VALUES (
        ${agent.id}::uuid, ${agent.userId ?? null}, ${agent.slug}, ${agent.agentName}, ${agent.ownerName}, ${agent.state},
        ${agent.primaryGithubUsername ?? null}, ${agent.xHandle ?? null}, ${agent.bio ?? null}, ${agent.avatarUrl ?? null},
        ${agent.sourceOfTruth ?? null}, ${agent.createdAt}, ${agent.updatedAt}, ${agent.lastSubmissionAt ?? null}
      )
      ON CONFLICT (slug) DO UPDATE SET
        agent_name = EXCLUDED.agent_name,
        owner_name = EXCLUDED.owner_name,
        state = EXCLUDED.state,
        updated_at = EXCLUDED.updated_at,
        last_submission_at = EXCLUDED.last_submission_at
    `;
    console.log(`  ✓ ${agent.slug}`);
  }

  console.log(`Seeding ${store.dailyAgentFacts.length} daily facts...`);
  for (const fact of store.dailyAgentFacts) {
    await sql`
      INSERT INTO daily_agent_facts (
        id, agent_id, date, total_tokens, input_tokens, output_tokens,
        cache_read_tokens, cache_write_tokens, session_count, longest_run_seconds,
        most_active_hour, top_model, estimated_cost_usd, source_type, source_adapter,
        created_at, updated_at
      ) VALUES (
        ${fact.id}::uuid, ${fact.agentId}::uuid, ${fact.date}::date, ${fact.totalTokens}, ${fact.inputTokens ?? null}, ${fact.outputTokens ?? null},
        ${fact.cacheReadTokens ?? null}, ${fact.cacheWriteTokens ?? null}, ${fact.sessionCount ?? null}, ${fact.longestRunSeconds ?? null},
        ${fact.mostActiveHour ?? null}, ${fact.topModel ?? null}, ${fact.estimatedCostUsd ?? null}, ${fact.sourceType}, ${fact.sourceAdapter ?? null},
        ${fact.createdAt}, ${fact.updatedAt}
      )
      ON CONFLICT (agent_id, date) DO UPDATE SET
        total_tokens = EXCLUDED.total_tokens,
        input_tokens = EXCLUDED.input_tokens,
        output_tokens = EXCLUDED.output_tokens,
        session_count = EXCLUDED.session_count,
        updated_at = EXCLUDED.updated_at
    `;
    console.log(`  ✓ ${fact.date} (${fact.totalTokens} tokens)`);
  }

  console.log('Done! Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
