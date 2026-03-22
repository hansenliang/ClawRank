# ClawRank Sizzle Reel — Cursor Handoff Context

> **Start here in a new session.** This file is the single source of truth for the Remotion video pipeline, timeline, data, and conventions.

## Overview
Sizzle reel for ClawRank (AI agent leaderboard), **locked to soundtrack length** **34.102s** → master **`SizzleReel`** **1023f** @ 30fps. The MP3 has **`SOUNDTRACK_HOOK_PREFIX_SEC`** (**1.846s**) before the original music — **Hook** is longer; **`FIRST_BEAT_AT_SEC`** (**3.946s**) → close-up at **118f**; **`MASTER_HOOK_GRID_FRAMES`** (**145f** = old **3s** grid + prefix) keeps **detail / zoom / CTA** on the same beats as before. **130 BPM** helpers remain for micro-timing (`FRAMES_PER_BEAT_INT`, optional `beatToFrame`). Dark terminal aesthetic; **1280×720 @ 30fps**; render with `--scale=2` for 4K.

### Timeline source (`src/beat-sync.ts`)
- **`SOUNDTRACK_HOOK_PREFIX_SEC`** — **1.846** (baked into the final MP3; shifts Hook + sync points, not per-scene lengths).
- **`SOUNDTRACK_DURATION_SEC`** — **34.102** (`32.256` core + prefix); **`SIZZLE_TOTAL_FRAMES`** — **1023** (`Math.round(sec×fps)`).
- **`SIZZLE_AUDIO_PUBLIC_FILE`** — **`ghost-in-the-kernel-edit.mp3`** in **`remotion/public/`** (mastered from *Ghost in the Kernel (Edit) (1).mp3* or equivalent).
- **`FIRST_BEAT_AT_SEC`** — **3.946** (**2.1** core downbeat + prefix) → **`HOOK_DURATION_FRAMES`** — **118**.
- **`CLOSEUP_SCENE_FRAMES`** / **`DETAIL_SCENE_FRAMES`** / **`ZOOM_SCENE_FRAMES`** — default **221** (~**7.38s**) each; **tweak detail/zoom** here — **`CTA_DURATION_FRAMES`** auto-adjusts (keep total **1023f**).
- **`CTA_DURATION_FRAMES`** — remainder to end of audio (derived).
- **`CROSSFADE_FRAMES`** — **0** (hard cuts).
- **`closeupLegacyToFrame(n)`** — stretch old **180f** keys onto **`CLOSEUP_SCENE_FRAMES`**.
- **`legacy120ToFrame(n, sceneFrames)`** — stretch old **120f** keys onto detail or zoom length (use **`DETAIL_SCENE_FRAMES`** / **`ZOOM_SCENE_FRAMES`** or `useVideoConfig().durationInFrames` in **`AgentDetail`**).

## Tech Stack
- **Remotion** 4.0.261 · **React** 19 · **JetBrains Mono** (@fontsource)
- **Colors**: `#0f0f0e` bg, `#faf9f5` cream, `#d87756` terracotta, `#9b9991` muted
- **Scene backdrop**: **`src/ui-scene-backdrop.ts`** — **`UI_SCENE_BACKDROP_STYLE`** layers subtle radial glows (terracotta + soft rim) on the charcoal base for UI contrast; used on **`SizzleReel`** root and UI-heavy compositions (**Hook**, close-up, detail, zoom, **CTA**, **MetaNarrative**, **LeaderboardTest**).
- **`Mascot`** (`src/components/Mascot.tsx`): pixel claw critter aligned with web **`feat/ux-polish`** `app/components/mascot.tsx`; **not** `requestAnimationFrame` — **`useLayoutEffect`** + **`useCurrentFrame`** / **`useVideoConfig().fps`** so sprite ticks ~**10/s** in video time. **`Hook`**: column — centered **above** the typing line (**`idle`**). **`CTA`**: row — **left** of **ClawRank** (**`snap`** = pincher cycle).
- **Scope**: All video code under **`remotion/`** only — do not modify parent `app/` or root `src/` for video tasks (per repo `AGENTS.md`).

## Running
```bash
cd remotion
npm install
npx remotion studio
npx remotion render SizzleReel out/sizzle.mp4 --scale=2
```

Master composition id: **`SizzleReel`** (**1023** frames). Per-scene comps: **Hook 118f**, **Close-up / Detail / Zoom 221f** each (standalone comps), **CTA 215f**. On the master, **LeaderboardCloseup** runs **248f** (**221** content + **27** postroll).

---

## Handoff — current state (what the last session left)

### Consolidated progress (landed on `feat/sizzle-reel`)
- **Agent detail (`AgentDetail` / `AgentDetailScene`)**: `formatCompact` for Usage/GitHub metrics; **`instantHeading`** so the title doesn’t fight side caption type-on; wide chrome with **`WINDOW_UI_SCALE`**, **`transformOrigin: top left`**, left-pinned clip + **`translateY`** pan over scene length; **`useLayoutEffect`** `panMaxPx`.
- **Close-up (`LeaderboardCloseup`)**: Two-phase **animated camera** — **`CAMERA_TIGHT_END`** / **`CAMERA_WIDE_END`** from **`closeupLegacyToFrame`** (legacy **88** / **154** @ 180f → stretched to **`CLOSEUP_SCENE_FRAMES`**); **phase 1** is a **flat pass-through**: high **`translateZ` + row scale** on hero row ( **`LeaderboardTable3D`** ) + **dolly** (**`PHASE_1_PASS_THROUGH`**, narrow **`tiltX`** ~**50→44**), not a crane-like look-up/look-down; light **`h`**-linked pan; **`CAMERA_AT_TIGHT_END`** must match phase-1 endpoints (**no jump** at pullback); **`cinematicAssembly`**; **`perspectivePx`** on close-up.
- **Table 3D (`LeaderboardTable3D`)**: **`ROW_SPRING_HERO` / `ROW_SPRING_CRUISE`** — overdamped springs, **`overshootClamping: true`**, **`z`** clamp **`≥ 0`**. **Reverted per-row CSS grid** on the table (it caused column/row/Share misalignment); **native `<table>`** + **`leaderboard-3d-scene`** **`preserve-3d`** chain only.
- **Styles (`remotion/src/styles.css`)**: Agent col / **`.identity`** **`min-width`** — **tune here** (currently tightened vs original 400/320; keep column + identity mins in sync).

### Open for next session (timing + audio)
- **Music is wired**: **`SizzleReel`** includes **`<Audio src={staticFile(SIZZLE_AUDIO_PUBLIC_FILE)} />`**; file **`remotion/public/ghost-in-the-kernel-edit.mp3`**. Re-measure with **`afinfo`** / **`ffprobe`** if you replace the MP3; update **`SOUNDTRACK_DURATION_SEC`** and rebalance scene constants so the sum still equals **`SIZZLE_TOTAL_FRAMES`**.
- **Nudge shot lengths** (if beats still feel early/late): only **`DETAIL_SCENE_FRAMES`** / **`ZOOM_SCENE_FRAMES`** (and optionally **`CLOSEUP_SCENE_FRAMES`**, **`FIRST_BEAT_AT_SEC`** — ±**0.033s** ≈ **1f**) in **`beat-sync.ts`** — **`CTA_DURATION_FRAMES`** recomputes.
- Optional animation polish: **`CINEMATIC_PULLBACK`** / **`perspectivePx`**; table **`translateZ`** — do **not** revive per-`<tr>` grid + block **`td`** without a full layout pass.

### Recent polish
- **Soundtrack 34.102s** (**1023f**): hard-cut master; **~3.95s Hook** (prefix + core intro to downbeat), then same **~7.38s** ×3 + **CTA** tail (**215f**).
- **Close-up**: **`CINEMATIC_MACRO` / `CINEMATIC_PULLBACK`**; caption aligned with pullback; fade scaled from legacy 10f.
- **Table cinematic**: **`closeupLegacyToFrame`** onto **221f** comp length.
- **Hook**: extra time from **`SOUNDTRACK_HOOK_PREFIX_SEC`**; type-on timing unchanged in code (**`PRE_TYPE_HOLD_FRAMES`** in **`Hook.tsx`**).
- **CTA**: **`TYPE_START`** scaled from **`(28/443)×CTA_DURATION_FRAMES`**; cursor **`FRAMES_PER_BEAT_INT`**.

### Timeline (`SizzleReel.tsx`)
- **`TimedScene`**: opaque only while `from ≤ frame < from+duration` (no crossfade).
- **130 BPM** (reference): full track ≈ **34.102×130/60 ≈ 73.9 beats**; first downbeat at **~3.95s** from file start.

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
- **`src/typewriter.ts`**: `CURSOR_BLINK_INTERVAL` = **`FRAMES_PER_BEAT_INT`** (~**14f** @ 130 BPM). Used by **Hook**, **ReelTypeCaption**, **CTA**, **AgentDetail** (blink).
- **Hook**: terracotta type-on; cursor **`vertical-align: baseline`** (**`PRE_TYPE_HOLD_FRAMES`** in **`Hook.tsx`**).
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
| `src/beat-sync.ts` | **`SOUNDTRACK_DURATION_SEC`**, **`SIZZLE_TOTAL_FRAMES`**, **`SIZZLE_AUDIO_PUBLIC_FILE`**, per-scene frame counts, **`CTA_DURATION_FRAMES`**, legacy mappers, **130 BPM** helpers |
| `remotion.config.ts` | Webpack; `@` → repo root |

### Compositions
| File | Frames | Notes |
|------|--------|--------|
| `SizzleReel.tsx` | **1023** | Hard cuts; timeline from **`beat-sync.ts`**; **`<Audio>`** |
| `Hook.tsx` | **118** | Through first downbeat (~**3.95s**) |
| `LeaderboardCloseup.tsx` | **221** | Comp length; master holds **248f** (incl. postroll) |
| `AgentDetailScene.tsx` | **221** | ~7.38s |
| `LeaderboardZoomOut.tsx` | **221** | ~7.38s |
| `CTA.tsx` | **215** | Through end of **34.102s** audio |
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
| `types.ts`, `format.ts`, `typewriter.ts`, `beat-sync.ts` | Local mirrors / tempo grid |
| `../../scripts/bake-remotion-video-data.ts` | Neon bake → generated TS |
| `scripts/import-clawrank-html-snapshot.mjs` | Parse saved leaderboard HTML → generated TS |

---

## Animation quick reference
- **Close-up camera** (`LeaderboardCloseup`): **`CAMERA_TIGHT_END`** / **`CAMERA_WIDE_END`** = **`closeupLegacyToFrame(88/154)`** (stretched to **`CLOSEUP_SCENE_FRAMES`**); phase **1** = **pass-through** dolly + hero **Z** (narrow tilt, small pan follow); **`CAMERA_AT_TIGHT_END`** must match phase-1 endpoints (no jump at pullback).
- **Spring (rows)**: **`ROW_SPRING_CRUISE` / `ROW_SPRING_HERO`**; delays from **`closeupLegacyToFrame`**; **`z`** clamped **`≥ 0`**.
- **Master** (`SizzleReel`): **hard cuts** — no crossfade opacity ramp.
- **Zoom-out camera**: **`CAMERA_MOVE_END` = `legacy120ToFrame(98, ZOOM_SCENE_FRAMES)`** + `Easing.bezier(0.25, 0.1, 0.25, 1.0)`; **`animateRows: false`**.
- **ScrambleText**: `revealStart` / `revealDuration` in local frames (legacy-stretched).

---

## Master timeline (exact — soundtrack 34.102s @ 30fps)
| Scene | Start (f) | End (excl.) | Duration | Notes |
|-------|-----------|-------------|----------|--------|
| Hook | 0 | 118 | 118f | Ends at first downbeat |
| Close-up | 118 | 366 | **248f** | **221f** scene + **27f** postroll |
| Detail | 366 | 587 | 221f | Same length as before prefix |
| Zoom-out | 587 | 808 | 221f | |
| CTA | 808 | 1023 | 215f | Absorbs total length change |

`118 + 248 + 221 + 221 + 215 = 1023` (= `round(34.102 × 30)`). **CTA** comp duration stays **215f**; only Hook and scene **start** times shifted by **`secToFrames(SOUNDTRACK_HOOK_PREFIX_SEC)`** (**55f**).

---

## Caption copy & emphasis (`ReelTypeCaption`)
| Scene | `fullText` | `emphasizeSubstring` |
|-------|------------|----------------------|
| Close-up | Top OpenClaw agents, ranked. | ranked. |
| Detail | Detailed analytics and insights. | insights. |
| Zoom-out | Open metrics. Track your whole fleet in one place. | fleet |

---

## Audio & music (Remotion)

- **Wired in `SizzleReel`**: **`<Audio src={staticFile(SIZZLE_AUDIO_PUBLIC_FILE)} />`** — **`SIZZLE_AUDIO_PUBLIC_FILE`** = **`ghost-in-the-kernel-edit.mp3`** under **`remotion/public/`**.
- **Where Remotion looks**: **`staticFile()`** paths are **relative to `remotion/public/`** — wrong folder = missing audio in Studio (check browser console).
- **Master duration**: **`SOUNDTRACK_DURATION_SEC`** **34.102** → **`SIZZLE_TOTAL_FRAMES`** **1023** — keep in sync with measured MP3 length.
- **Prefix / beat sync**: If the mastered file’s lead-in changes, update **`SOUNDTRACK_HOOK_PREFIX_SEC`**, **`SOUNDTRACK_DURATION_SEC`**, **`FIRST_BEAT_AT_SEC`** (= **2.1 + prefix**), and **`MASTER_HOOK_GRID_FRAMES`** (= **`secToFrames(3 + prefix)`**) together — per-scene frame counts can stay fixed.
- **Sync knobs** (fine-tune):
  - **`FIRST_DOWNBEAT`** offset: adjust the **2.1** base (core edit) or **`SOUNDTRACK_HOOK_PREFIX_SEC`**.
  - Per-scene **`CLOSEUP_SCENE_FRAMES`** / **`DETAIL_SCENE_FRAMES`** / **`ZOOM_SCENE_FRAMES`** — **`CTA_DURATION_FRAMES`** is the remainder.
- **Git / binaries**: **`.gitignore`** in `remotion/` ignores **`out/`**, **`*.mp4`**, not **`*.mp3`** — commit **`public/*.mp3`** for reproducible renders if desired.
- **Docs**: [Remotion — Audio](https://www.remotion.dev/docs/audio), [staticFile](https://www.remotion.dev/docs/staticfile).

---

## New session — handoff prompt (paste)

```
You’re continuing the ClawRank Remotion sizzle reel on feat/sizzle-reel (video-only under remotion/; don’t touch app/ or root src/ per AGENTS.md).

Read remotion/CURSOR_CONTEXT.md first (timeline, beat-sync, audio section, pitfalls).

Goals this session:
1) Line up timings to the music: MP3 in **`remotion/public/`** + **`<Audio>`** + **`staticFile(SIZZLE_AUDIO_PUBLIC_FILE)`**. If the real track length changes, update **`SOUNDTRACK_DURATION_SEC`** / **`SIZZLE_TOTAL_FRAMES`** and rebalance scene constants so the sum still matches.
2) Fine-tune FIRST_BEAT_AT_SEC or per-scene frame constants in beat-sync.ts if the first downbeat or middle sections feel slightly off.

Master: SizzleReel (1023f @ 30fps when SOUNDTRACK_DURATION_SEC=34.102). Hard cuts via TimedScene. Composition registrations in Root.tsx.

After changes: run cd remotion && npx tsc --noEmit and npx remotion studio — composition SizzleReel.
Update remotion/CURSOR_CONTEXT.md if timeline or audio path conventions change.
```

---

## Pitfalls for the next agent
1. **Re-importing HTML** wipes **manual** rank 1–3 demo states — restore or script them.
2. **`DATABASE_URL` empty** in worktree `.env.local` — bake falls back to main repo `.env.local` path in bake script, or export manually.
3. **ESLint** ignores **`video-leaderboard.generated.ts`** (see root `eslint.config.mjs`).
4. **Root `tsconfig`** excludes `scripts/` — bake script runs via **tsx**, not necessarily `tsc -p`.
5. **UI preservation**: don’t change `app/` or `src/contracts` for video-only tasks.
6. **Leaderboard table layout**: **native `<table>`** + **`preserve-3d`** chain — **avoid** per-row **`display: grid` on `<tr>`** + **`display: block` on `td`** unless you fully redesign and test alignment (prior attempt caused column drift, huge rows, Share misplacement).
7. **Studio iframe** under **640px** width triggers globals that column-stack **`.identity-row`** — **`leaderboard-3d-scene .identity-row`** forces row layout; if preview still looks wrong, widen the preview or check that rule.
8. **`staticFile()`** paths are **relative to `remotion/public/`** — wrong folder = silent missing audio in Studio until you check the console.

---

## Key decisions (immutable unless product asks)
- Baked / HTML data for reproducible renders; mock fallback for CI/no DB.
- Master duration = **soundtrack** (**34.102s** / **1023f**); **Hook** includes **`SOUNDTRACK_HOOK_PREFIX_SEC`** before the original downbeat; same **~7.38s** blocks + **CTA** as the core edit, all shifted; **hard cuts**; **`<Audio>`** on master.
- Add **`<Audio>`** in `SizzleReel` when mixing; copy is readable on mute.
