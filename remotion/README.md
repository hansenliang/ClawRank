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

```bash
cd remotion
npm install
npx remotion studio
# npx remotion render SizzleReel out/sizzle.mp4 --scale=2
```

Agent-oriented notes: `CURSOR_CONTEXT.md`.
