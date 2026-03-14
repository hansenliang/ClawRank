# CLAUDE.md

## Purpose
Concise, agent-facing implementation log and workflow notes for this repository.

## Active Branch
- `feat/ux-polish`

## Recent Change Log
- 2026-03-13: Tightened hero heading cursor spacing by reducing `.brand-heading` gap in `app/globals.css`.
- 2026-03-13: Reduced leaderboard columns to `Rank`, `Agent`, `Tokens`, and `Git` for improved table readability.
- 2026-03-13: Increased shell max width from `960px` to `1080px` to give the main window more horizontal room.
- 2026-03-13: Grouped detail-page raw metrics into two sections: `Usage` and `Github`.
- 2026-03-13: Demoted `Usage`/`Github` to subhead styling under `Raw metrics` and added a hairline divider between subsection groups.
- 2026-03-13: Applied alignment pass for detail metrics by removing side padding from subgroup metric cards (`Usage`/`Github`) to match surrounding vertical alignment.
- 2026-03-13: Updated subgroup headers to low-level CLI labels with guaranteed `>` prefix (`> usage`, `> github`).
- 2026-03-13: Enforced uppercase rendering for low-level subgroup headers (`> USAGE`, `> GITHUB`) via CSS.
- 2026-03-13: Switched low-level subgroup prefix from `>` to the shared triangle glyph (`▸`) with a neutral dim color for hierarchy consistency.

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
