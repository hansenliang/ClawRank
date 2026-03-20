# ClawRank Sizzle Reel — Cursor Handoff Context

## Overview
30-second sizzle reel for ClawRank (AI agent leaderboard) built with Remotion. Dark terminal/hacker aesthetic.

## Tech Stack
- **Framework**: Remotion 4.0.261 (React-based video)
- **Canvas**: 1280×720 (720p), render at `--scale=2` for 4K output
- **FPS**: 30
- **Font**: JetBrains Mono (via @fontsource)
- **Colors**: `#0f0f0e` (bg), `#faf9f5` (text), `#d87756` (terracotta accent), `#9b9991` (muted)

## Running
```bash
cd remotion
npx remotion studio          # Preview in browser
npx remotion render SizzleReel out/sizzle.mp4 --scale=2  # 4K render
```

## File Map

### Entry Points
| File | Purpose |
|------|---------|
| `src/index.ts` | Remotion entry, calls `registerRoot` |
| `src/Root.tsx` | Registers all compositions (SizzleReel + individual scenes) |
| `remotion.config.ts` | Webpack config with `@/` alias to parent dir |

### Compositions (scenes)
| File | Duration | Purpose |
|------|----------|---------|
| `src/compositions/SizzleReel.tsx` | 900f (30s) | Master comp — 5 scenes, 15f crossfades |
| `src/compositions/Hook.tsx` | 120f (4s) | White prefix + terracotta typewriter hook |
| `src/compositions/LeaderboardCloseup.tsx` | 180f (6s) | 3× table; 3s UI-only; left `ReelTypeCaption` + type-on |
| `src/compositions/AgentDetailScene.tsx` | 120f (4s) | #1 agent detail + scramble metrics + caption |
| `src/compositions/LeaderboardZoomOut.tsx` | 120f (4s) | 3×→1× pullback + full table + caption |
| `src/compositions/LeaderboardTable3D.tsx` | — | Shared 3D leaderboard window + table |
| `src/compositions/CTA.tsx` | 480f (16s) | Title + “Ask your OpenClaw:” + terminal typewriter (long hold in master) |
| `src/compositions/MetaNarrative.tsx` | 240f | Legacy standalone QA (not in SizzleReel) |
| `src/compositions/LeaderboardTest.tsx` | 150f | Debug/test composition |

### Components
| File | Purpose |
|------|---------|
| `src/components/ScrambleText.tsx` | Frame-driven scramble-to-reveal text |
| `src/components/AgentDetail.tsx` | Agent detail page recreation for video |
| `src/components/LeaderboardTable.tsx` | Leaderboard table with scramble animations |
| `src/components/LeaderboardShell.tsx` | Period bar + search + table wrapper |
| `src/components/WindowChrome.tsx` | macOS window chrome (traffic light dots) |
| `src/components/ReelTypeCaption.tsx` | Large left-aligned type-on; SideCaption depth shadow + CTA blur bloom + terracotta emphasis |

### Data & Utilities
| File | Purpose |
|------|---------|
| `src/mock-data.ts` | 14 mock agents. #1 = `nightowl-agent` by `hansenliang` (easter egg) |
| `src/types.ts` | Local copy of LeaderboardRow types |
| `src/format.ts` | Local copy of formatCompact/formatStandard |
| `src/typewriter.ts` | Shared typewriter frame math + cursor blink |
| `src/styles.css` | Imports app's globals.css + Remotion overrides |

## Animation Patterns Used

### Spring Physics (organic motion)
```tsx
spring({ frame, fps: 30, config: { mass: 0.8, stiffness: 80, damping: 12, overshootClamping: false }, delay })
```

### Cinematic Easing
```tsx
const CINEMATIC = Easing.bezier(0.25, 0.1, 0.25, 1.0);
```

### Scramble Text
`<ScrambleText value="14.2M" revealStart={20} revealDuration={18} />` — characters scramble with random glyphs, then reveal left-to-right.

### 3D Row Drops
Rows fall from above with `translateZ`, `scale`, and `rotateX` driven by spring physics, staggered per row (close-up scene only).

## CSS Notes
- `styles.css` imports the real app's `globals.css` for visual fidelity
- Overrides: `.window { overflow: visible !important; }` (for 3D row effects)
- Forces desktop layout: `.mobile-only { display: none }`
- All app CSS classes (`.window`, `.table`, `.rank-badge`, `.pill`, `.metric-card`, etc.) work as-is

## Master Timeline (SizzleReel.tsx)
**15f crossfade** overlaps. Close-up is **180f** so 3s of leaderboard-only fits before the CLI sidecar.

| Scene | Start | End (exclusive) | Duration | Crossfade in |
|-------|-------|-----------------|----------|----------------|
| Hook | 0 | 120 | 120f | — |
| Leaderboard close-up | 105 | 285 | **180f** | vs Hook |
| Agent detail | 270 | 390 | 120f | vs close-up |
| Leaderboard zoom-out | 375 | 495 | 120f | vs detail |
| CTA | 480 | 900 | **420f** | vs zoom-out; hold after typewriter |

Total: **900 frames** = 30s. CTA composition in studio is **480f** (longer than master tail for local QA).

## Copy & Typewriter Rates
- **Hook**: `Meet the world's` (white, frame 0) + blinking cursor **1s** (30f) + `hardest working AI agents.` (terracotta, **~15 chars/sec**).
- **Leaderboard close-up**: **90f** (3s) UI only; then large left caption type-on `Your OpenClaw agents, ranked.` (**`ranked.`** terracotta) at **~15 chars/sec**.
- **Agent detail / zoom-out**: same `ReelTypeCaption` pattern; emphasis on **`insights.`** / **`fleet`** respectively.
- **CTA prompt**: `Install ClawRank from ClawHub and get me ranked.` at **~15 chars/sec** inside a terminal-style box.

## Key Decisions
- Canvas is 720p, final render upscaled to 4K via `--scale=2`
- No modifications to parent `src/` or `app/` — Remotion code under `remotion/src/`
- Cross-project imports avoided — types and format functions duplicated locally
- `hansenliang` as #1 agent owner is an intentional easter egg
