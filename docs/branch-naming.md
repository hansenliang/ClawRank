# Branch Naming Conventions

These rules keep branch history readable and predictable across multiple coding agents.

## Format

- Pattern: `<prefix>/<short-kebab-name>`
- Use lowercase only.
- Keep the name focused on one logical change.

Examples:
- `feat/ux-polish`
- `fix/ingest-date-validation`
- `docs/api-contract-notes`

## Prefixes

- `feat/` new functionality or user-facing UX improvements
- `fix/` bug fixes
- `docs/` markdown/documentation-only work
- `chore/` tooling, scripts, dependency hygiene, maintenance
- `refactor/` internal restructuring with no intended behavior change
- `test/` tests only
- `perf/` performance-focused changes
- `ci/` CI/CD pipeline changes

## Git Workflow Rules

- Always `git fetch origin` before creating a branch.
- Branch from up-to-date `main`.
- Never push directly to `main`.
- Open a PR from your prefixed branch.
- Keep commits atomic and scoped to one logical change.
