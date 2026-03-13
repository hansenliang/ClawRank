/**
 * POST /api/auth/cli — Exchange a GitHub token for a ClawRank API token.
 *
 * Flow:
 * 1. Receive { githubToken, label? } from the agent
 * 2. Verify the GitHub token against api.github.com/user
 * 3. Find or create user + linked account (same as OAuth callback)
 * 4. Auto-claim any unclaimed agents matching the GitHub handle
 * 5. Generate a cr_live_ API token
 * 6. Return { token, user, claimedAgents }
 *
 * The GitHub token is used once and never stored.
 */
import { NextResponse } from 'next/server';
import {
  dbFindLinkedAccount,
  dbUpsertLinkedAccount,
  dbCreateUser,
  dbCreateApiToken,
  dbGetClaimableAgentsForHandle,
  dbClaimAgent,
  dbGetAgentsForUser,
  dbGetTokensForUser,
} from '@/src/db/queries';
import { generateRawToken, hashToken } from '@/src/lib/auth';

interface GitHubUser {
  id: number;
  login: string;
  name?: string;
  avatar_url?: string;
}

const MAX_TOKENS_PER_USER = 10;

export async function POST(request: Request) {
  let githubToken: string;
  let label: string | undefined;

  try {
    const body = (await request.json()) as { githubToken?: string; label?: string };
    githubToken = body.githubToken?.trim() || '';
    label = body.label?.trim() || undefined;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!githubToken) {
    return NextResponse.json({ error: 'githubToken is required' }, { status: 400 });
  }

  // Verify the GitHub token by fetching the user profile
  let ghUser: GitHubUser;
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${githubToken}` },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Invalid GitHub token — could not verify identity' },
        { status: 401 },
      );
    }
    ghUser = (await res.json()) as GitHubUser;
  } catch {
    return NextResponse.json(
      { error: 'Failed to verify GitHub token' },
      { status: 502 },
    );
  }

  // Find or create user via linked_accounts (same logic as OAuth callback)
  const existingLink = await dbFindLinkedAccount('github', String(ghUser.id));
  let userId: string;

  if (existingLink) {
    userId = existingLink.userId;
    await dbUpsertLinkedAccount({
      userId,
      provider: 'github',
      providerUserId: String(ghUser.id),
      handle: ghUser.login,
      displayName: ghUser.name || ghUser.login,
      avatarUrl: ghUser.avatar_url,
      verified: true,
    });
  } else {
    const user = await dbCreateUser(ghUser.name || ghUser.login, ghUser.avatar_url);
    userId = user.id;
    await dbUpsertLinkedAccount({
      userId,
      provider: 'github',
      providerUserId: String(ghUser.id),
      handle: ghUser.login,
      displayName: ghUser.name || ghUser.login,
      avatarUrl: ghUser.avatar_url,
      verified: true,
    });
  }

  // Auto-claim any unclaimed agents matching this GitHub handle
  const claimable = await dbGetClaimableAgentsForHandle(ghUser.login);
  const claimedAgents: Array<{ id: string; slug: string; agentName: string }> = [];
  for (const agent of claimable) {
    const ok = await dbClaimAgent(agent.id, userId);
    if (ok) {
      claimedAgents.push({ id: agent.id, slug: agent.slug, agentName: agent.agentName });
    }
  }

  // Check token limit before creating
  const existingTokens = await dbGetTokensForUser(userId);
  if (existingTokens.length >= MAX_TOKENS_PER_USER) {
    return NextResponse.json(
      { error: `Token limit reached (max ${MAX_TOKENS_PER_USER}). Revoke an existing token first.` },
      { status: 429 },
    );
  }

  // Generate ClawRank API token
  const rawToken = generateRawToken();
  const tokenHash = await hashToken(rawToken);
  await dbCreateApiToken(userId, tokenHash, label || 'cli-setup');

  // Get user's agents for the response
  const agents = await dbGetAgentsForUser(userId);

  return NextResponse.json({
    token: rawToken,
    user: {
      login: ghUser.login,
      displayName: ghUser.name || ghUser.login,
    },
    agents: agents.map((a) => ({
      id: a.id,
      slug: a.slug,
      agentName: a.agentName,
      state: a.state,
    })),
    claimedAgents,
  });
}
