import { NextRequest } from 'next/server';
import { renderLeaderboardOgImage } from '@/src/lib/og-image';
import { parseLeaderboardPeriod } from '@/src/lib/leaderboard-period';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
 const period = parseLeaderboardPeriod(request.nextUrl.searchParams.get('period'));
 return renderLeaderboardOgImage(period, 'live');
}
