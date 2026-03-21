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

From the **repo root** (the folder that contains `remotion/`):

```bash
cd remotion
pnpm install   # or npm install
npx remotion studio
# Master, 1280×720 (entry must be the file that calls registerRoot):
# npx remotion render src/index.ts SizzleReel out/sizzle.mp4
```

**3840×2160 HEVC (max quality CRF 0):** from `remotion/`, with Chrome set if Headless Shell download fails (see below):

```bash
pnpm run render:4k-hevc
# → out/clawrank-sizzle-3840x2160-hevc.mp4  (gitignored)
```

Uses **`--scale 3`** (720×3 = 2160p), **`--codec h265`**, **`--crf 0`**, and **`--concurrency 2`** so **Google Chrome** as `REMOTION_BROWSER_EXECUTABLE` stays stable under parallel tabs.

### Chrome download fails (`unable to get local issuer certificate`)

Remotion downloads **Chrome Headless Shell** over HTTPS. If Node’s TLS trust fails (common behind SSL-inspecting proxies), either:

1. **Point Node at a real CA bundle** — `NODE_EXTRA_CA_CERTS` must be an **existing** `.pem` file (not a placeholder path). IT often provides this; on macOS you can export roots from Keychain Access to PEM.
2. **Skip the download** — install **Google Chrome** normally, then set **`REMOTION_BROWSER_EXECUTABLE`** to the executable (shell or `.env`, not committed):

   ```bash
   export REMOTION_BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
   cd remotion && npx remotion studio
   ```

   `remotion/remotion.config.ts` reads this env var and calls `Config.setBrowserExecutable` when set.

**Soundtrack:** Master length **34.102s** (**1023f** @ 30fps; matches **`remotion/public/ghost-in-the-kernel-edit.mp3`**). The file includes **`SOUNDTRACK_HOOK_PREFIX_SEC`** (**1.846s**) before the original downbeat — **Hook** is that much longer; **`FIRST_BEAT_AT_SEC`** and **`MASTER_HOOK_GRID_FRAMES`** shift together so **detail / zoom / CTA** stay on the same beats (**`CLOSEUP_POSTROLL_FRAMES`** unchanged). Three **~7.38s** blocks + **CTA** (derived in `beat-sync.ts`). See **`CURSOR_CONTEXT.md`**.

**Music file:** **`ghost-in-the-kernel-edit.mp3`** in **`remotion/public/`** (e.g. from repo-root *Ghost in the Kernel (Edit) (1).mp3*). **`SizzleReel`** mounts **`<Audio src={staticFile(SIZZLE_AUDIO_PUBLIC_FILE)} />`**.

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
