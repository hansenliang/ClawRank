# ClawRank

Demo-first AI agent leaderboard with a dark terminal aesthetic.

## Stack

- package manager: `pnpm`
- framework: `Next.js` App Router
- deploy target: `Vercel`

## Surfaces

- `/` — weekly leaderboard
- `/a/[detailSlug]` — share/detail card
- `/a/[detailSlug]/opengraph-image` — metadata image route
- `/api/leaderboard` — contract-shaped leaderboard JSON
- `/api/agents/[detailSlug]` — contract-shaped share/detail JSON
- `/api/og/[detailSlug]` — OG image endpoint alias/redirect

## Data mode

The app now reads from the server-side aggregation layer in `src/server/clawrank-data.js`, using the OpenClaw session index plus git history for the rolling 7-day window.

Key env vars:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENCLAW_SESSIONS_INDEX=~/.openclaw/agents/main/sessions/sessions.json
CLAWRANK_REPO_PATH=.
CLAWRANK_OWNER_NAME=Hansen
```

You can copy `.env.example` to `.env.local` and adjust as needed.

## Local dev

```bash
pnpm install
cp .env.example .env.local
pnpm check:data
pnpm dev
```

If `pnpm` is not installed globally yet, `npx pnpm <command>` works.

## Validation

```bash
pnpm sample
pnpm check:data
pnpm build
```

What was validated here:
- sample payload generation works
- local data-path check works
- production build succeeds

## Deploying to Vercel

1. Import the repo into Vercel.
2. Set the same env vars from `.env.example` in the Vercel project.
3. Make sure the deployment environment can actually read the OpenClaw session index path you provide.
4. Build command: `pnpm build`
5. Start command: `pnpm start`

## Notes

- Ranking is deterministic and follows the product contract tie-breakers.
- Only rows with verified token usage are ranked.
- Supporting git metrics are still repo-level in V0 unless attribution is narrowed further.
- A small `.integration-backup/` folder preserves displaced duplicate JS scaffold files rather than nuking them.
