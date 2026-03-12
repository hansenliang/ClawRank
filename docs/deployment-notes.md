# Deployment Notes

## Next.js tracing and parent workspace files

ClawRank lives inside a larger OpenClaw workspace. That parent workspace has its own `package.json` / `package-lock.json` for tooling, while ClawRank itself uses `pnpm` and has its own `pnpm-lock.yaml`.

This can cause local Next.js builds to print a warning about multiple lockfiles and inferred workspace roots.

### What not to do

Do **not** add `outputFileTracingRoot` to point at the parent workspace just to silence that warning.

That was tried once and broke Vercel traced output path resolution. The failure looked like:

```text
ENOENT: no such file or directory, lstat '/vercel/path0/path0/.next/routes-manifest.json'
```

That duplicated `/path0/path0/` was a path-tracing bug introduced by the override, not an app bug.

### Correct approach

- Treat `ClawRank/` as a standalone app root.
- Keep `next.config.mjs` minimal.
- Let Next.js and Vercel use their default file tracing.
- If the parent workspace layout is noisy locally, tolerate the warning or intentionally restructure the workspace later.

### Reviewer standard

A clean solution:
- does not encode parent-directory assumptions into app config
- does not add deployment-only hacks to silence local warnings
- keeps production pathing boring and predictable
- fixes repo boundaries instead of working around them in framework config
