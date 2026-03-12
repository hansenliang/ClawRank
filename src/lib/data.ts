import { getLeaderboardData, getShareDetail as getShareDetailData } from './clawrank-data';
import { formatCompactNumber, formatNumber } from './format';

export async function getLeaderboard() {
 return getLeaderboardData();
}

export async function getShareDetail(detailSlug: string) {
 return getShareDetailData(detailSlug);
}

export function formatCompact(value: number) {
 return formatCompactNumber(value);
}

export function formatStandard(value: number) {
 return formatNumber(value);
}

export function formatPeriodLabel(periodStart: string, periodEnd: string) {
 const start = new Date(periodStart);
 const end = new Date(periodEnd);
 const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
 return `${fmt.format(start)}–${fmt.format(end)}, ${end.getFullYear()}`;
}
