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

**Studio URL:** after `remotion studio`, open **`http://localhost:3000/SizzleReel`** (or pick **SizzleReel** in the sidebar). That is **Remotion Studio**, not the Next.js app — `pnpm dev` at the **repo root** serves the site on **:3000** and has **no** `/SizzleReel` route (you would see **404**).

**Troubleshooting**

- **Only one lockfile in `remotion/`** — keep **`pnpm-lock.yaml`** *or* **`package-lock.json`**, not both. If both exist, Remotion throws *Found multiple lockfiles* and the preview server can die right after “Server ready”.
- **Port clash** — Next and Remotion both default to **3000**. Stop one, or run e.g. `npx remotion studio src/index.ts --port=3001` and use that port in the browser.

**3840×2160 HEVC (max quality CRF 0):** run from the directory that contains **`remotion/`** (e.g. this worktree root), then:

```bash
cd remotion
pnpm run render:4k-hevc
# → out/clawrank-sizzle-3840x2160-hevc.mp4  (gitignored)
```

Uses **`--scale 3`** (720×3 = 2160p), **`--codec h265`**, **`--crf 0`**, **`--concurrency 2`**, plus:

- **`--image-format png`** — lossless frame capture (default JPEG can cause temporal “flicker” / blocking when platforms re-encode).
- **`--pixel-format yuv420p`** — 8-bit 4:2:0, what most players expect for HEVC delivery.
- **`--disallow-parallel-encoding`** — avoids rare stitch glitches from parallel encode.

**`remotion.config.ts`** injects **`-tag:v hvc1`** and **BT.709** color metadata for **libx265** (Apple tools often reject **`hev1`**-tagged HEVC in MP4).

**Still trouble in Photos or aggressive transcoders?** On macOS, try **VideoToolbox** HEVC (Apple-native encoder; no CRF — uses bitrate):

```bash
pnpm run render:4k-hevc:vt-mac
# → out/clawrank-sizzle-3840x2160-hevc-vt.mp4
```

### Random full-frame flashes / wrong-frame glitches (LinkedIn, etc.)

If the file plays locally but **whole frames go blank or jump to another shot** on upload, that usually comes from **Chromium’s screenshot step**, not the HEVC encode — especially with **heavy 3D** (`perspective`, `preserve-3d`, large `scale`, `filter: blur`) on leaderboard scenes.

This repo mitigates that by:

- **`--concurrency 1`** on 4K scripts — avoids parallel tabs racing the GPU while capturing different frames.
- **`SizzleReel`** uses only **`Sequence`** (no extra `null` scene gating).
- **`AgentDetailScene`** uses **`flushSync`** when measuring scroll height so **`translateY`** is correct on the same paint Remotion captures.

If glitches remain, force **software GL** (slower, most stable for pixel-perfect captures):

```bash
pnpm run render:4k-hevc:chrome-mac:cpu-gl
# or: REMOTION_GL=swiftshader pnpm run render:4k-hevc:chrome-mac
```

If you see **`unable to get local issuer certificate`** while it tries to download Chrome Headless Shell, **do not rely on that download** — use a local Chrome (next section) or the macOS shortcut script **`pnpm run render:4k-hevc:chrome-mac`**.

### Chrome download fails (`unable to get local issuer certificate`)

Remotion downloads **Chrome Headless Shell** over HTTPS. If Node’s TLS trust fails (common behind SSL-inspecting proxies, or some Node 25 setups), either:

1. **Fastest (macOS, Chrome installed):** from **`remotion/`**:

   ```bash
   pnpm run render:4k-hevc:chrome-mac
   ```

   Same flags as **`render:4k-hevc`**, but **`REMOTION_BROWSER_EXECUTABLE`** points at the stable Google Chrome app (see **`package.json`**). **`remotion.config.ts`** applies it via **`Config.setBrowserExecutable`**.

2. **Same idea, any shell:** set the variable once, then render:

   ```bash
   export REMOTION_BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
   cd remotion && pnpm run render:4k-hevc
   ```

3. **Corporate proxy:** **`NODE_EXTRA_CA_CERTS`** must be an **existing** `.pem` bundle (IT-provided or exported from Keychain Access) so Node can verify the download URL.

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
