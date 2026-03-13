/**
 * POST /api/agents/claim — Claim an unclaimed agent.
 * Body: { agentId: string }
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/src/lib/auth';
import { dbClaimAgent } from '@/src/db/queries';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let agentId: string;
  try {
    const body = await request.json() as { agentId?: string };
    agentId = body.agentId?.trim() || '';
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!agentId) {
    return NextResponse.json({ error: 'agentId required' }, { status: 400 });
  }

  const claimed = await dbClaimAgent(agentId, session.userId);
  if (!claimed) {
    return NextResponse.json({ error: 'Agent not found or already claimed' }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
