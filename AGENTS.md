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

## Code Quality

- **No duplicate logic.** If two files do the same thing, one dies. Pick the better one, delete the other, update imports.
- **Clean up after yourself.** No `.backup/`, `.old/`, `*-copy.ts` files in the repo. Ever.
- **Build must pass.** Run `npx next build` before committing. Broken builds don't get pushed.
- **Types are not optional.** Use TypeScript types from `src/contracts/` for all data structures. No `any` without a comment explaining why.

## Frontend

- **Error boundaries required.** Pages must not white-screen on bad data. Use the error boundary in `app/components/error-boundary.tsx`.
- **Mobile-first.** Tables with 5+ columns need a responsive/card fallback. Test at 375px width.
- **No inline styles for layout.** Use CSS classes. Inline styles are acceptable only for one-off cosmetic tweaks.

## Git

- **Atomic commits.** One logical change per commit. Don't lump "fixed bug + added feature + cleaned up" into one commit.
- **No secrets in commits.** No API keys, tokens, paths with usernames, or PII. Use `.env.local` (gitignored).
