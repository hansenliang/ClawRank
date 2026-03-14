# AGENTS.md — ClawRank Coding Standards

Read this before writing any code. Violations get reverted.

## Security

- **No hardcoded paths.** Filesystem paths come from env vars only. Never embed usernames, home dirs, or absolute paths in source.
- **Validate all dynamic route params.** Any `[slug]` or `[id]` used in file reads, DB queries, or path construction must be validated against a strict allowlist regex (e.g. `/^[a-z0-9-]+$/`). Assume every param is an attack.
- **No silent error swallowing.** `try { } catch { }` with empty catch blocks is banned. Log the error or use an explicit feature flag.
- **API routes return minimal data.** Don't expose internal metadata, file paths, or system info. Only return what the frontend actually needs.

## Architecture

- **One source of truth per concept.** Types live in `src/contracts/`. Don't duplicate interfaces across files.
- **No dead code.** If nothing imports it, delete it. Don't leave "backup" files, commented-out blocks, or unused modules.
- **Env-gated features, not try/catch gating.** Use explicit env vars (e.g. `CLAWRANK_LIVE_DATA=true`) to toggle features. Don't use require failures as feature flags.
- **Baked data is the default path.** Live data parsing is opt-in via env var. Vercel/production always uses pre-baked JSON.
- **This app is standalone.** Treat `ClawRank/` as its own app root. Do not make app config depend on random files or lockfiles in parent directories.
- **No tracing-root hacks.** Do not add `outputFileTracingRoot` just to silence local Next.js warnings about multiple lockfiles. That warning comes from the parent OpenClaw workspace; ClawRank deploys correctly only when Next/Vercel use the default tracing behavior.
- **Production config must stay boring.** If a config change quiets local warnings but changes deploy path math, reject it. We already hit a Vercel failure from this exact mistake (`ENOENT ... /vercel/path0/path0/.next/routes-manifest.json`).
- **Fix the boundary, not the symptom.** If local tooling complains about parent workspace files, either live with the warning or restructure intentionally later. Do not encode workspace-layout trivia into `next.config.mjs`.

## Code Quality

- **No duplicate logic.** If two files do the same thing, one dies. Pick the better one, delete the other, update imports.
- **Clean up after yourself.** No `.backup/`, `.old/`, `*-copy.ts` files in the repo. Ever.
- **Build must pass.** Run `npx next build` before committing. Broken builds don't get pushed.
- **Types are not optional.** Use TypeScript types from `src/contracts/` for all data structures. No `any` without a comment explaining why.

## Frontend

- **Error boundaries required.** Pages must not white-screen on bad data. Use the error boundary in `app/components/error-boundary.tsx`.
- **Mobile-first.** Tables with 5+ columns need a responsive/card fallback. Test at 375px width.
- **No inline styles for layout.** Use CSS classes. Inline styles are acceptable only for one-off cosmetic tweaks.

## UI Preservation — CRITICAL

- **Backend-only work must not touch UI files.** If your task is about APIs, ingestion, domain logic, or data pipelines, you should have ZERO modifications to pages (`app/**/page.tsx`), components (`app/components/`), CSS (`app/globals.css`), layout files (`app/layout.tsx`), `src/lib/site.ts`, or `src/contracts/clawrank.ts`. New API routes in `app/api/` are fine. `src/lib/clawrank-data.ts` and `src/lib/data.ts` are the data integration seam between backend and frontend — modifying them for DB wiring is expected and allowed.
- **Never replace the contracts file.** `src/contracts/clawrank.ts` defines the UI's type surface. If you need new types for domain/backend work, create a separate file (e.g. `src/contracts/clawrank-domain.ts`). Do not delete or rewrite existing types that the frontend imports.
- **Don't rewrite static copy.** Headlines, descriptions, footer text, and marketing language on the frontend are product decisions. Don't change them as a side effect of backend work. If copy says "Raw metrics only. No fake composite score." — leave it alone.
- **Don't remove existing UI features.** OG metadata, share buttons, mobile layouts, mock routes — if they exist on main, your branch must preserve them. Check your diff before committing.

## Git

- **Always `git fetch origin` before branching or restoring files.** Local `main` can be stale. If you run `git checkout main -- <file>`, you may revert recent work that only exists on `origin/main`. Use `git checkout origin/main -- <file>` when restoring files to match production state.
- **Rebase onto `origin/main`, not local `main`.** When creating feature branches or cleaning up, always use `git rebase origin/main` to ensure you're building on top of the latest pushed state.
- **Verify your diff against `origin/main` before pushing.** Run `git diff origin/main --stat` and review what changed. If you see modifications to files you didn't intend to touch, something went wrong. The diff should only contain files relevant to your task.
- **Never push directly to main.** Create a feature branch, push there, open a PR. The orchestrator or QA reviews before merging. This is non-negotiable for multi-agent work.
- **Use branch prefixes consistently.** Name branches as `<prefix>/<short-kebab-name>` (for example `feat/ux-polish`, `fix/input-validation`, `docs/agent-notes`) and follow `docs/branch-naming.md`.
- **Atomic commits.** One logical change per commit. Don't lump "fixed bug + added feature + cleaned up" into one commit.
- **No secrets in commits.** No API keys, tokens, paths with usernames, or PII. Use `.env.local` (gitignored).
- **CI must pass.** GitHub Actions runs build + typecheck + lint on every push/PR. Don't merge red CI.

## Skill Attestation & State Derivation

ClawRank derives agent state dynamically from `daily_agent_facts` at query time:

| State | Dot | Condition |
|---|---|---|
| **Live** | 🟢 pulsing green | Has a `source_type = 'skill'` fact in the last 7 days |
| **Verified** | 🔵 blue | Agent is claimed (`user_id` set) AND has at least one `source_type = 'skill'` fact, but none in the last 7 days |
| **Estimated** | ⚫ gray | Everything else (seeded, unclaimed, manual-only, x_scrape) |

**How `source_type = 'skill'` works:** The ClawRank ingestion script (`skills/clawrank/scripts/ingest.py`) sets `source_type: 'skill'` on every fact it submits. This is the only code path that produces `'skill'` facts — manual SQL inserts and future scrapers use `'manual'` or `'x_scrape'`. The skill attestation is proof that data came through the official instrumented pipeline, not pasted in by hand.

**`date_precision` column:** Facts also carry a `date_precision` field (`'day'` or `'cumulative'`). Skill-submitted data is always `'day'` (genuine daily granularity). Manually seeded data with no clear time range should use `'cumulative'`. Period-filtered views (7 days, 30 days) exclude `'cumulative'` facts — they only appear in the "All time" view.

State fades naturally: an agent that stops submitting goes Live → Verified → stays Verified (if claimed) or Estimated (if not). No manual state management needed.

## Pre-commit

Pre-commit hooks run automatically via husky + lint-staged:
- ESLint fix on staged `.ts/.tsx/.js` files
- TypeScript type check on staged `.ts/.tsx` files
- If the hook fails, the commit is rejected. Fix the issue, don't skip the hook.
