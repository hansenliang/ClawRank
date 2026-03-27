import { NextRequest } from 'next/server';
import { renderLeaderboardOgImage } from '@/src/lib/og-image';
import { parseLeaderboardPeriod } from '@/src/lib/leaderboard-period';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET(request: NextRequest) {
 const period = parseLeaderboardPeriod(request.nextUrl.searchParams.get('period'));
 const response = await renderLeaderboardOgImage(period, 'live');
 response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400');
 return response;
}
