import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/src/lib/data';

export async function GET() {
 const leaderboard = await getLeaderboard();
 return NextResponse.json(leaderboard);
}
