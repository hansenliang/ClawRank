/**
 * POST /api/agents/claim — Claim an unclaimed agent.
 * Body: { agentId: string }
 * Only allows claiming agents whose primary_github_username or owner_name
 * matches the logged-in user's GitHub handle.
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/src/lib/auth';
import { dbClaimAgent, dbIsAgentClaimableByHandle, dbGetLinkedAccountsForUser } from '@/src/db/queries';

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

  // Verify the user's GitHub handle matches the agent
  const linkedAccounts = await dbGetLinkedAccountsForUser(session.userId);
  const githubAccount = linkedAccounts.find(la => la.provider === 'github');
  if (!githubAccount?.handle) {
    return NextResponse.json({ error: 'No GitHub account linked' }, { status: 403 });
  }

  const canClaim = await dbIsAgentClaimableByHandle(agentId, githubAccount.handle);
  if (!canClaim) {
    return NextResponse.json({ error: 'Agent not found or not claimable by your account' }, { status: 403 });
  }

  const claimed = await dbClaimAgent(agentId, session.userId);
  if (!claimed) {
    return NextResponse.json({ error: 'Agent not found or already claimed' }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
