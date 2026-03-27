import { NextRequest, NextResponse } from 'next/server';
import type { LeaderboardPeriod } from '@/src/contracts/clawrank-domain';
import { getLeaderboard } from '@/src/lib/data';

const VALID_PERIODS = new Set<LeaderboardPeriod>(['alltime', 'month', 'week', 'today']);

export async function GET(request: NextRequest) {
 const { searchParams } = request.nextUrl;
 const rawPeriod = searchParams.get('period') || 'alltime';
 const period = VALID_PERIODS.has(rawPeriod as LeaderboardPeriod) ? (rawPeriod as LeaderboardPeriod) : 'alltime';

 const leaderboard = await getLeaderboard('live', period);
 return NextResponse.json(leaderboard, {
  headers: {
   'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400, stale-if-error=86400',
  },
 });
}
