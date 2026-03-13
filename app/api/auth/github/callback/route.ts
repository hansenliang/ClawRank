/**
 * GET /api/auth/github/callback — GitHub OAuth callback.
 * Exchanges code for access token, fetches user, creates/links accounts.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createSessionToken } from '@/src/lib/auth';
import { dbFindLinkedAccount, dbUpsertLinkedAccount, dbCreateUser } from '@/src/db/queries';

const COOKIE_NAME = 'clawrank_session';

interface GitHubUser {
  id: number;
  login: string;
  name?: string;
  avatar_url?: string;
}

function redirectWithError(error: string): NextResponse {
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/register?error=${error}`);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get('github_oauth_state')?.value;

  // Validate CSRF state
  if (!state || !storedState || state !== storedState) {
    return redirectWithError('invalid_state');
  }

  if (!code) {
    return redirectWithError('no_code');
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return redirectWithError('not_configured');
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      return redirectWithError('token_exchange_failed');
    }

    // Fetch GitHub user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return redirectWithError('github_api_failed');
    }

    const ghUser = await userRes.json() as GitHubUser;

    // Find or create user via linked_accounts
    const existingLink = await dbFindLinkedAccount('github', String(ghUser.id));

    let userId: string;

    if (existingLink) {
      // User exists — update their GitHub info
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
      // New user — create user + linked account
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

    // Build redirect response with ALL cookies set on the same response object
    const sessionToken = await createSessionToken({ userId });
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/register`);

    // Set session cookie
    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Clear OAuth state cookie
    response.cookies.delete('github_oauth_state');

    return response;
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return redirectWithError('unexpected');
  }
}
