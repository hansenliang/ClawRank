/**
 * GET /api/auth/me — Returns current session user info.
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/src/lib/auth';
import { dbGetUserById, dbGetLinkedAccountsForUser, dbGetAgentsForUser } from '@/src/db/queries';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await dbGetUserById(session.userId);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const linkedAccounts = await dbGetLinkedAccountsForUser(user.id);
  const agents = await dbGetAgentsForUser(user.id);

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
    linkedAccounts: linkedAccounts.map(la => ({
      provider: la.provider,
      handle: la.handle,
      displayName: la.displayName,
      avatarUrl: la.avatarUrl,
      verified: la.verified,
    })),
    agents: agents.map(a => ({
      id: a.id,
      slug: a.slug,
      agentName: a.agentName,
      state: a.state,
    })),
  });
}
