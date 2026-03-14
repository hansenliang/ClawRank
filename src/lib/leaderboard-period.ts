import type { LeaderboardPeriod } from '@/src/contracts/clawrank-domain';

const VALID_PERIODS = new Set<LeaderboardPeriod>(['alltime', 'today', 'week', 'month']);

export function parseLeaderboardPeriod(rawPeriod: string | null): LeaderboardPeriod {
 if (!rawPeriod) return 'alltime';
 if (!/^[a-z]+$/.test(rawPeriod)) return 'alltime';
 return VALID_PERIODS.has(rawPeriod as LeaderboardPeriod) ? (rawPeriod as LeaderboardPeriod) : 'alltime';
}
