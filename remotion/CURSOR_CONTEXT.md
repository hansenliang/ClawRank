# ClawRank Sizzle Reel — Cursor Handoff Context

> **Start here in a new session.** This file is the single source of truth for the Remotion video pipeline, timeline, data, and conventions.

## Overview
30-second sizzle reel for ClawRank (AI agent leaderboard). Dark terminal aesthetic; **1280×720 @ 30fps**; render with `--scale=2` for 4K.

## Tech Stack
- **Remotion** 4.0.261 · **React** 19 · **JetBrains Mono** (@fontsource)
- **Colors**: `#0f0f0e` bg, `#faf9f5` cream, `#d87756` terracotta, `#9b9991` muted
- **Scope**: All video code under **`remotion/`** only — do not modify parent `app/` or root `src/` for video tasks (per repo `AGENTS.md`).

## Running
```bash
cd remotion
npm install
npx remotion studio
npx remotion render SizzleReel out/sizzle.mp4 --scale=2
```

Master composition id: **`SizzleReel`** (900 frames). Individual scenes registered in `src/Root.tsx` for QA.

---

## Handoff — current state (what the last session left)

### Consolidated progress (landed on `feat/sizzle-reel`)
- **Agent detail (`AgentDetail` / `AgentDetailScene`)**: `formatCompact` for Usage/GitHub metrics; **`instantHeading`** so the title doesn’t fight side caption type-on; wide chrome with **`WINDOW_UI_SCALE`**, **`transformOrigin: top left`**, left-pinned clip + **`translateY`** pan over scene length; **`useLayoutEffect`** `panMaxPx`.
- **Close-up (`LeaderboardCloseup`)**: Two-phase **animated camera** — tune phase-1 in `interpolate(..., [0, CAMERA_TIGHT_END], [...])`; **`CAMERA_AT_TIGHT_END`** must match phase-1 endpoints (same object as phase-2 start — **no jump at frame 88**); **`CAMERA_WIDE`** is final hold; **`cinematicAssembly`** on **`LeaderboardTable3D`** with staggered chrome/period/header and row delays (**row 2+** from ~**f36**, **+5f** stagger); **`perspectivePx`** on close-up.
- **Table 3D (`LeaderboardTable3D`)**: **`ROW_SPRING_HERO` / `ROW_SPRING_CRUISE`** — overdamped springs, **`overshootClamping: true`**, **`z`** clamp **`≥ 0`**. **Reverted per-row CSS grid** on the table (it caused column/row/Share misalignment); **native `<table>`** + **`leaderboard-3d-scene`** **`preserve-3d`** chain only.
- **Styles (`remotion/src/styles.css`)**: Agent col / **`.identity`** **`min-width`** — **tune here** (currently tightened vs original 400/320; keep column + identity mins in sync).

### Open for next session (animation polish)
- Ease timings / easing curves on close-up camera phase 2, row stagger, or chrome/header delays.
- **Zoom-out** / **CTA** micro-timing if master crossfades feel busy.
- Optional **depth** experiments: if `translateZ` reads too flat, revisit layout **intentionally** (e.g. one wrapper grid) — **do not** revive ad hoc per-`<tr>` grid + blockified `td` without testing alignment in Studio at multiple iframe widths.
- Copy tweaks in **`ReelTypeCaption`** per scene (table at end of doc).

### Timeline (`SizzleReel.tsx`)
- **15f** crossfades between scenes.
- **LeaderboardCloseup** is **180f** (not 120f): **cinematic assembly** — macro camera on rank **#1** + staggered chrome/period/header/rows; caption timing unchanged (`REMOTION_FPS * 1` show delay + fade/type-on).
- **CTA** block in master is **420f** (480−900); standalone **CTA** composition is **480f** for studio preview.

### Layout
- **Caption column first (40% left)**, **mock UI second (60% right)** in close-up, detail, and zoom-out scenes.
- **`ReelTypeCaption`**: large left type-on, terracotta emphasis substring, depth shadow + blurred accent bloom (early SideCaption + CTA style). Shared by close-up, detail, zoom.

### Data (`VIDEO_ROWS`)
- **`src/video-rows.ts`**: `BAKED_VIDEO_ROWS.length > 0` → use bake; else **`mock-data.ts`**.
- **`src/video-leaderboard.generated.ts`**: Populated from **saved clawrank.dev HTML** (`scripts/import-clawrank-html-snapshot.mjs`) and **manual demo edits**:
  - Ranks **1–2** `derivedState`: **`verified`** (OpenClaw/steipete, Pi/badlogic).
  - Rank **3**: **`Claudius Maximus`** / **`hansenliang`**, **`live`**, slug `hansenliang/claudius-maximus`, tools Read/Edit/Bash. Metrics copied from former #3 row scale.
  - Re-running the HTML import **overwrites** this file — reapply manual tweaks or patch after import.
- **`pnpm remotion:bake-data`** (repo root, needs `DATABASE_URL`) is an alternative to HTML import; loads `.env.local` from worktree **or** `../../../.env.local` from `.claude/worktrees/...` (see `scripts/bake-remotion-video-data.ts`).

### Agent detail scene
- **`AgentDetailScene`**: **`TOP_ROW = VIDEO_ROWS.length >= 3 ? VIDEO_ROWS[2] : VIDEO_ROWS[0]`** — detail beat shows **rank #3** (Claudius) when baked data has 3+ rows; else mock #1.
- **Layout**: Caption **34%** / mock window **66%**; chrome fills column width (**`scale(WINDOW_UI_SCALE)`**, `AgentDetailScene.tsx`), **`transformOrigin: top left`** so the **left edge stays pinned** while the right can extend past the viewport (clipped). Viewport uses **`justify-content: flex-start`**. **Clipped** **`translateY`** pan **0 → bottom** over the comp (`Easing.inOut(cubic)`); **`panMaxPx`** = `scaled.offsetHeight * scale − viewport height`.
- **`AgentDetail`**: **`instantHeading`** (used in **`AgentDetailScene`**) shows the agent title fully from frame 0 so it doesn’t compete with **`ReelTypeCaption`** type-on. Hero “Token usage” and **Usage / GitHub** still use **`formatCompact`** (`remotion/src/format.ts`, `Intl` compact ≥10k).

### Typewriter
- **`src/typewriter.ts`**: `typewriterRevealedCount`, `typewriterCursorVisible`, `REMOTION_FPS`, `CURSOR_BLINK_INTERVAL`. Used by **Hook**, **ReelTypeCaption**, **CTA**.
- **Hook**: 1s blink before typing; terracotta line; cursor **`vertical-align: baseline`**.
- **~15 chars/sec** for Hook, captions, CTA prompt (2 frames/char at 30fps).

### CSS (`src/styles.css`)
- Imports **`app/globals.css`** + Remotion-only overrides.
- **Agent column** (2nd) + **`.identity`**: **`min-width`** on **`.window .table th/td:nth-child(2)`** and **`.window .table .identity`** in **`styles.css`** — adjust both together so Share + name don’t wrap oddly (values are **video-only**; user-tuned from 400px/320px).
- `.window` / `.table-wrap` **`overflow: visible`** for 3D row transforms.
- **`leaderboard-3d-scene`**: **`transform-style: preserve-3d`** on **`.window`**, **`.table-wrap`**, **`.desktop-only`**, **`.table`**, **`tbody`** — depth for **`translateZ`** on **`tr`** without replacing table layout with grid.
- **`leaderboard-3d-scene .identity-row`**: **`flex-direction: row`** — overrides globals’ **640px** column stack when Studio iframe is narrow.

### Git / branch
- Work tracked on **`feat/sizzle-reel`** (or similar). **Do not merge into `main`** — video-only. See **`remotion/README.md`**.

### Files intentionally not in SizzleReel
- **`MetaNarrative.tsx`** — still registered in Root for standalone QA only.

---

## File Map

### Entry
| Path | Role |
|------|------|
| `src/index.ts` | `registerRoot` |
| `src/Root.tsx` | All compositions + durations |
| `remotion.config.ts` | Webpack; `@` → repo root |

### Compositions
| File | Frames | Notes |
|------|--------|--------|
| `SizzleReel.tsx` | 900 | Master timeline |
| `Hook.tsx` | 120 | White prefix + 1s cursor + terracotta type-on |
| `LeaderboardCloseup.tsx` | 180 | **Cinematic assembly**: two-phase camera (`CAMERA_AT_TIGHT_END` / `CAMERA_WIDE`) + **`cinematicAssembly`**; left caption |
| `AgentDetailScene.tsx` | 120 | `AgentDetail` for `VIDEO_ROWS[2]` when ≥3 rows |
| `LeaderboardZoomOut.tsx` | 120 | Camera 3→1 `CINEMATIC` easing, `LeaderboardTable3D` static rows |
| `CTA.tsx` | 480 in Root | Title + Ask OpenClaw + terminal type-on; master uses 420f tail |
| `LeaderboardTable3D.tsx` | — | Shared table; **`cinematicAssembly`** (close-up only): hero row spring, staggered chrome/period/header + rows 2–10; optional **`perspectivePx`** |
| `MetaNarrative.tsx` | 240 | Not in master reel |
| `LeaderboardTest.tsx` | 150 | Uses **`MOCK_ROWS`** + `LeaderboardShell` |

### Components
| File | Role |
|------|------|
| `ReelTypeCaption.tsx` | Scene side captions: type-on + emphasis substring + bloom |
| `AgentDetail.tsx` | Detail mock; `revealOffset`, optional **`instantHeading`** (detail scene) |
| `ScrambleText.tsx` | Scramble-to-reveal |
| `LeaderboardTable.tsx`, `LeaderboardShell.tsx`, `WindowChrome.tsx` | Used by **LeaderboardTest** |

### Data & scripts
| Path | Role |
|------|------|
| `video-rows.ts` | Exports **`VIDEO_ROWS`** |
| `video-leaderboard.generated.ts` | Baked / HTML-imported + **manual demo** rows |
| `mock-data.ts` | Fallback; includes legacy nightowl easter egg when no bake |
| `types.ts`, `format.ts`, `typewriter.ts` | Local mirrors / utilities |
| `../../scripts/bake-remotion-video-data.ts` | Neon bake → generated TS |
| `scripts/import-clawrank-html-snapshot.mjs` | Parse saved leaderboard HTML → generated TS |

---

## Animation quick reference
- **Close-up camera** (`LeaderboardCloseup`): phase 1 → **`CAMERA_AT_TIGHT_END`** (must match phase-1 `interpolate` endpoints), phase 2 → **`CAMERA_WIDE`**; **88–154** pull back then hold — no jump at **88** if those match.
- **Spring (rows)**: **`ROW_SPRING_CRUISE` / `ROW_SPRING_HERO`** in `LeaderboardTable3D` — overdamped + **`overshootClamping: true`**, **`z`** clamped **`≥ 0`** so rows don’t dip through the plane; stagger as before.
- **Zoom-out camera**: `interpolate` + `Easing.bezier(0.25, 0.1, 0.25, 1.0)`; zoom scene uses **`animateRows: false`** + early `revealStart` on `ScrambleText` so metrics don’t scramble during pull-back.
- **ScrambleText**: `revealStart` / `revealDuration` in local frames.

---

## Master timeline (exact)
| Scene | Start | End (excl.) | Duration |
|-------|-------|-------------|----------|
| Hook | 0 | 120 | 120f |
| Close-up | 105 | 285 | 180f |
| Detail | 270 | 390 | 120f |
| Zoom-out | 375 | 495 | 120f |
| CTA | 480 | 900 | 420f |

---

## Caption copy & emphasis (`ReelTypeCaption`)
| Scene | `fullText` | `emphasizeSubstring` |
|-------|------------|----------------------|
| Close-up | Your OpenClaw agents, ranked. | ranked. |
| Detail | Detailed analytics and insights. | insights. |
| Zoom-out | Open metrics. Track your whole fleet in one place. | fleet |

---

## Pitfalls for the next agent
1. **Re-importing HTML** wipes **manual** rank 1–3 demo states — restore or script them.
2. **`DATABASE_URL` empty** in worktree `.env.local` — bake falls back to main repo `.env.local` path in bake script, or export manually.
3. **ESLint** ignores **`video-leaderboard.generated.ts`** (see root `eslint.config.mjs`).
4. **Root `tsconfig`** excludes `scripts/` — bake script runs via **tsx**, not necessarily `tsc -p`.
5. **UI preservation**: don’t change `app/` or `src/contracts` for video-only tasks.
6. **Leaderboard table layout**: **native `<table>`** + **`preserve-3d`** chain — **avoid** per-row **`display: grid` on `<tr>`** + **`display: block` on `td`** unless you fully redesign and test alignment (prior attempt caused column drift, huge rows, Share misplacement).
7. **Studio iframe** under **640px** width triggers globals that column-stack **`.identity-row`** — **`leaderboard-3d-scene .identity-row`** forces row layout; if preview still looks wrong, widen the preview or check that rule.

---

## Key decisions (immutable unless product asks)
- Baked / HTML data for reproducible renders; mock fallback for CI/no DB.
- Beat-aligned crossfades; close-up extended for 3s UI-only beat.
- No audio mix in comp; copy is readable on mute.
