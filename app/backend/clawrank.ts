// Thin Next.js-friendly server wrapper around the V0 data layer.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  buildLeaderboardResponse,
  buildShareDetailResponse,
} = require('../../src/server/clawrank-data');

export function getWeeklyLeaderboard() {
  return buildLeaderboardResponse({
    indexPath: process.env.OPENCLAW_SESSIONS_INDEX,
    repoPath: process.env.CLAWRANK_REPO_PATH || process.cwd(),
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL,
    defaultOwnerName: process.env.CLAWRANK_OWNER_NAME || 'Hansen',
    now: process.env.CLAWRANK_NOW,
  });
}

export function getWeeklyShareDetail(detailSlug: string) {
  return buildShareDetailResponse(detailSlug, {
    indexPath: process.env.OPENCLAW_SESSIONS_INDEX,
    repoPath: process.env.CLAWRANK_REPO_PATH || process.cwd(),
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL,
    defaultOwnerName: process.env.CLAWRANK_OWNER_NAME || 'Hansen',
    now: process.env.CLAWRANK_NOW,
  });
}
