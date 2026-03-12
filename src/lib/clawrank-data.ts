import { SITE_URL } from './site';
import type { LeaderboardResponse, ShareDetail } from '@/src/contracts/clawrank';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { buildLeaderboardResponse, buildShareDetailResponse } = require('../server/clawrank-data');

function commonOptions() {
 return {
 indexPath: process.env.OPENCLAW_SESSIONS_INDEX,
 repoPath: process.env.CLAWRANK_REPO_PATH || process.cwd(),
 baseUrl: process.env.NEXT_PUBLIC_SITE_URL || SITE_URL,
 defaultOwnerName: process.env.CLAWRANK_OWNER_NAME || 'Hansen',
 now: process.env.CLAWRANK_NOW,
 };
}

export function getLeaderboardData(): LeaderboardResponse {
 return buildLeaderboardResponse(commonOptions()) as LeaderboardResponse;
}

export function getShareDetail(detailSlug: string): ShareDetail | null {
 const payload = buildShareDetailResponse(detailSlug, commonOptions()) as { detail: ShareDetail } | null;
 return payload?.detail || null;
}
