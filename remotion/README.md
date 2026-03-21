# ClawRank sizzle reel (Remotion)

Video production for social / marketing. Lives in the **ClawRank** repo on a **dedicated branch** so the Next.js app on `main` stays unchanged.

## Branch workflow

| Rule | Why |
|------|-----|
| **Do not merge this branch into `main`** | Remotion, extra deps, and render output are video-only. |
| **Merge or rebase `main` into this branch** when you want updated UI tokens, `globals.css`, or copy. |
| **Commit and push here** for normal source control on compositions and timing. |

Suggested branch name: `feat/sizzle-reel` (or `production/sizzle`).

## Run

```bash
cd remotion
npm install
npx remotion studio
# npx remotion render SizzleReel out/sizzle.mp4 --scale=2
```

## Production leaderboard data (Neon)

Compositions read **`VIDEO_ROWS`** from `src/video-rows.ts`: if `src/video-leaderboard.generated.ts` is non-empty (from a bake), that data is used; otherwise **`mock-data.ts`** fallback.

From **repo root** (not `remotion/`), with **`DATABASE_URL` non-empty** (Neon pooled connection string from [Vercel project → Storage](https://vercel.com/docs/storage) or [Neon console](https://console.neon.tech)). Put it in **this worktree’s** `.env.local` or the **main ClawRank** repo’s `.env.local` (the bake script checks both for `.claude/worktrees/...` layouts).

```bash
pnpm remotion:bake-data
```

Optional: `REMOTION_LEADERBOARD_PERIOD=week|month|alltime|today` (default **`week`**, matches the 7-day leaderboard).

This runs `getLeaderboardData('live', …)` and overwrites `remotion/src/video-leaderboard.generated.ts`. Re-run before a render when you want a fresh snapshot.

### Without DB: saved HTML from clawrank.dev

Save the leaderboard page from the browser, then:

```bash
node remotion/scripts/import-clawrank-html-snapshot.mjs ~/Downloads/page.html
```

Parses the top **10** rows (`<span class="sr-only">` + pills + links). Lines added/removed are not on that table — the script fills plausible values for the agent-detail shot only.

**Git:** The generated file is committed as an empty stub by default. After baking, either commit the snapshot for reproducible renders or `git restore remotion/src/video-leaderboard.generated.ts` before pushing if you do not want production rows in the repo.

Agent-oriented notes: `CURSOR_CONTEXT.md`.
