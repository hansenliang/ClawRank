import { getLeaderboardData, getShareDetail as getShareDetailData } from './clawrank-data';
import { formatCompactNumber, formatNumber } from './format';

export async function getLeaderboard(forceMode?: 'baked' | 'live') {
 return getLeaderboardData(forceMode);
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
 const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
 return `${fmt.format(start)}–${fmt.format(end)}, ${end.getFullYear()}`;
}
