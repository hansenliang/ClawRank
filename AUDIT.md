# ClawRank Adversarial Security & Code Audit

You are a senior security engineer and code reviewer. Your job is to find every vulnerability, logic bug, design flaw, and operational risk in this codebase. Be thorough, adversarial, and specific. Do not hand-wave — show the attack path.

## Repo
`/Users/hansenlobsterfarm/.openclaw/workspace/ClawRank`

## Stack
- Next.js 15, React 19, TypeScript 5.9.3
- `@neondatabase/serverless` (neon tagged templates, no ORM)
- Auth: JWT via `jose` in httpOnly cookie, GitHub OAuth
- Token auth: `cr_live_` prefix, SHA-256 hashed, stored in `api_tokens` table
- Hosted on Vercel, DB on Neon Postgres

## What to audit

### 1. Authentication & Authorization
- Read `app/api/auth/github/route.ts` and `callback/route.ts` — is the CSRF state check solid? Can the state cookie be replayed, forged, or bypassed?
- Read `src/lib/auth.ts` — how are JWTs created and verified? Is the signing algo pinned? Is `SESSION_SECRET` entropy sufficient? Can tokens be forged if the secret leaks?
- Read `app/api/auth/me/route.ts` — does it leak anything it shouldn't?
- Check every API route for auth: are there routes that should require auth but don't?
- Can a user impersonate another user by manipulating JWT claims?

### 2. Token System
- Read `app/api/tokens/route.ts` and `app/api/tokens/[id]/route.ts`
- Is token creation rate-limited properly (claimed max 10)?
- Can a revoked token still be used? Is there a race condition in revocation?
- Is the raw token truly shown only once, or could it be retrieved again?
- Is `hashToken()` timing-safe? Does it matter here?

### 3. SQL Injection
- Scan ALL files in `src/db/queries.ts` — are all queries using tagged template literals properly?
- Are there any string concatenations or interpolations that bypass parameterization?
- Check `app/api/` routes for any raw SQL or unsanitized input passed to queries.

### 4. Input Validation
- Read `app/api/submit/route.ts` and `src/domain/clawrank-store.ts` — what happens with:
  - Negative token counts?
  - Absurdly large numbers (overflow)?
  - Future dates?
  - Slugs with special characters, SQL injection attempts, or XSS payloads?
  - Empty strings where non-empty is expected?
- Check `app/api/agents/claim/route.ts` — can a user claim an agent they shouldn't? Can they claim the same agent twice? Race conditions?

### 5. Data Exposure
- Review what `/api/auth/me` returns — does it expose user IDs, internal state, or other users' data?
- Review what `/api/leaderboard` returns — any sensitive fields leaking?
- Review agent detail endpoints — can you enumerate all agents? Is that a problem?
- Are there any API routes that return stack traces or internal error messages?

### 6. Agent Ownership & Claiming
- Can user A submit data for user B's agent?
- Can an unclaimed agent be claimed by anyone? Is that the intended behavior?
- What happens if two users try to claim the same agent simultaneously?
- After claiming, can the claim be reverted or transferred? Should it be?

### 7. Frontend Security
- Check for XSS vectors: are agent names, bios, owner names properly escaped in JSX?
- Are there any `dangerouslySetInnerHTML` usages?
- Check OG image generation — can crafted agent names break the image or inject content?
- Are there any client-side secrets or API keys exposed?

### 8. Operational Security
- Check `.env.example` and `.gitignore` — are secrets properly excluded?
- Check Vercel config — any sensitive headers or rewrites?
- Is there rate limiting on submission, token creation, or OAuth endpoints?
- What happens if Neon DB goes down? Does the app fail gracefully or expose errors?

### 9. Business Logic
- Can someone inflate their ranking by submitting fake data?
- Can estimated profiles be manipulated by non-admin users?
- Is there any validation that submitted token counts are plausible?
- Can someone create thousands of fake agents to spam the leaderboard?
- Is the `strongerState` function correct? Can state transitions go backwards?

### 10. Dependencies & Config
- Check `package.json` for known vulnerable packages
- Check `next.config.mjs` for misconfigurations
- Are there any unused dependencies that increase attack surface?
- Is the CSP (Content Security Policy) configured?

## Output format
For each finding, provide:
1. **Severity**: Critical / High / Medium / Low / Info
2. **Location**: Exact file and line numbers
3. **Issue**: What's wrong
4. **Attack path**: How an attacker would exploit it
5. **Fix**: Specific code change to remediate

Prioritize by severity. Group related findings. Be as specific as possible — "might have SQL injection" is worthless, "line 47 of queries.ts concatenates user input into SQL" is useful.

At the end, provide:
- A summary of the top 5 most critical findings
- An overall risk assessment (ship it / fix before launch / stop everything)
- Specific recommendations for what to add before going public

When completely finished, run this command to notify:
openclaw system event --text "Done: ClawRank adversarial code audit complete — results in AUDIT-RESULTS.md" --mode now
