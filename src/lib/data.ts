import type { LeaderboardPeriod } from '@/src/contracts/clawrank-domain';
import { getLeaderboardData, getShareDetail as getShareDetailData } from './clawrank-data';
import { formatCompactNumber, formatNumber } from './format';

export async function getLeaderboard(forceMode?: 'baked' | 'live', period?: LeaderboardPeriod) {
 return getLeaderboardData(forceMode, period);
}

export async function getShareDetail(detailSlug: string, forceMode?: 'baked' | 'live') {
 return getShareDetailData(detailSlug, forceMode);
}

export function formatCompact(value: number) {
 return formatCompactNumber(value);
}

export function formatStandard(value: number) {
 return formatNumber(value);
}

export function formatPeriodLabel(periodStart: string, periodEnd: string) {
 if (!periodStart || !periodEnd) return '—';

 const start = new Date(periodStart);
 const end = new Date(periodEnd);
 const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
 return `${fmt.format(start)}–${fmt.format(end)}, ${end.getUTCFullYear()}`;
}
