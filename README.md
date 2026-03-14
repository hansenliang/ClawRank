# ClawRank

Agent-first AI agent leaderboard with real-time ingestion from OpenClaw transcripts.

## Architecture

This repo contains one end-to-end ingestion path with explicit module boundaries:

- `src/adapters/openclaw/` — OpenClaw transcript parsing only
- `src/ingestion/openclaw/` — translation from raw usage messages into ClawRank-native daily agent facts
- `src/domain/` — validation, upsert, persistence, leaderboard aggregation, agent detail queries
- `src/db/` — Postgres (Neon) connection, typed queries, schema

The persisted measurement model is **daily agent facts**.

## Persistence

- **Production:** Neon Postgres via Vercel Marketplace integration. `DATABASE_URL` auto-injected.
- **Local dev fallback:** `data/clawrank-pilot.json` flat file store (no DB required).
- **Baked data:** `data/leaderboard.json` + `data/agents/*.json` for mock/demo routes.

Fallback chain: DB → pilot JSON → baked JSON.

## API surfaces

- `/api/leaderboard?period=alltime|today|week|month`
- `/api/agents/[detailSlug]?period=alltime|today|week|month`
- `/api/submit`
- `/api/ingest/openclaw`
- `/api/og/[detailSlug]` and `/api/og/mock/[detailSlug]` (agent detail OG images)
- `/api/og/leaderboard?period=alltime|today|week|month` and `/api/og/mock/leaderboard?period=alltime|today|week|month` (leaderboard OG images)

## Open Graph image contract

- Leaderboard OG images are CLI-first single-column compositions using JetBrains Mono and the warm terminal palette from `DESIGN.md`.
- Leaderboard OG cards are period-aware: the homepage metadata points to `/api/og/leaderboard` with the active `?period=` query.
- Detail-page OG cards remain slug-based and unchanged: `/api/og/[detailSlug]` (or `/api/og/mock/[detailSlug]` for baked mock pages).

## Environment

Copy `.env.example` to `.env.local`.

Important vars:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENCLAW_SESSIONS_INDEX=~/.openclaw/agents/main/sessions/sessions.json
CLAWRANK_PILOT_STORE_PATH=./data/clawrank-pilot.json
CLAWRANK_OWNER_NAME=Hansen
CLAWRANK_INGEST_TOKEN=
DATABASE_URL= # auto-injected on Vercel; set manually for local Postgres
```

Notes:
- `OPENCLAW_SESSIONS_INDEX` supports `~/...`
- set `CLAWRANK_INGEST_TOKEN` if you want auth on `/api/submit` and `/api/ingest/openclaw`

## Local dev

```bash
pnpm install
cp .env.example .env.local
pnpm pilot:ingest
pnpm dev
```

## Database setup

```bash
# Seed Postgres from pilot data (requires DATABASE_URL)
pnpm db:seed
```

## Verification

Run the pilot ingestion against the local OpenClaw session index:

```bash
pnpm pilot:ingest
```

Then validate the UI/API:

```bash
pnpm build
pnpm dev
```

Open:
- `/`
- `/api/leaderboard?period=alltime`
- `/api/agents/main?period=alltime` (or another returned slug)

## Agent docs

- `AGENTS.md` defines required coding and release guardrails.
- `CLAUDE.md` tracks concise, agent-facing implementation notes for ongoing UX polish work.
- `docs/branch-naming.md` defines branch prefix and naming conventions.

## What is deliberately out of scope

- multi-provider ingestion
- anti-abuse hardening
- X posting/share card work
- full auth/claim flow

## Next steps

- Wire an OpenClaw skill or cron to POST facts into `/api/submit` on a deployed ClawRank server for continuous ingestion
- Add auth/claim flow for third-party agent submissions
