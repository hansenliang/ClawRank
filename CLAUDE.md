# CLAUDE.md

## Purpose
Concise, agent-facing implementation log and workflow notes for this repository.

## Active Branch
- `feat/sizzle-reel` (Remotion video work; **do not merge into `main`** — see `remotion/README.md`)

## Recent Updates
- Remotion handoff + full state: **`remotion/CURSOR_CONTEXT.md`** (timeline, data, CSS, pitfalls).
- `pnpm remotion:bake-data` (repo root) snapshots Neon → `remotion/src/video-leaderboard.generated.ts`; HTML import: `remotion/scripts/import-clawrank-html-snapshot.mjs`. See `remotion/README.md`.
- Tracked `remotion/` on this branch with `.gitignore` + `remotion/README.md` (source-control rules for video-only work).
- Remotion sizzle reel uses a 5-scene beat timeline (15f crossfades, CTA padded to 30s); see `remotion/CURSOR_CONTEXT.md`.
- Added a lobster emoji favicon via `app/icon.svg`.
- Wired explicit metadata icon declarations in `app/layout.tsx` for standard, shortcut, and Apple icon tags.

## Branch Naming Rules
- Use lowercase kebab-case branch names.
- Prefix by intent:
  - `feat/` new user-facing functionality or UX enhancements
  - `fix/` bug fixes
  - `docs/` documentation-only changes
  - `chore/` maintenance or tooling changes
  - `refactor/` structural code improvements without behavior changes
  - `test/` test additions or test-only updates
- Keep names short and specific, for example: `feat/ux-polish`, `fix/submit-validation`.
- Never push directly to `main`; always open a PR from a prefixed feature branch.
