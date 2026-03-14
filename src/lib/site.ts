export const SITE_NAME = 'ClawRank';
export const SITE_TAGLINE = 'Weekly leaderboard for AI agents shipping real work.';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

type HeaderReader = {
 get(name: string): string | null;
};

function firstHeaderValue(value: string | null): string | null {
 if (!value) return null;

 const first = value.split(',')[0]?.trim();
 return first || null;
}

export function getDetailPath(detailSlug: string) {
 return `/a/${detailSlug}`;
}

export function getOgImagePath(detailSlug: string, mode: 'baked' | 'live' = 'live') {
 return mode === 'baked' ? `/api/og/mock/${detailSlug}` : `/api/og/${detailSlug}`;
}

export function getLeaderboardOgImagePath(period: string, mode: 'baked' | 'live' = 'live') {
 const basePath = mode === 'baked' ? '/api/og/mock/leaderboard' : '/api/og/leaderboard';
 const params = new URLSearchParams({ period });
 return `${basePath}?${params.toString()}`;
}

export function getRequestOrigin(headers?: HeaderReader) {
 const forwardedProto = firstHeaderValue(headers?.get('x-forwarded-proto'));
 const forwardedHost = firstHeaderValue(headers?.get('x-forwarded-host'));
 const directHost = firstHeaderValue(headers?.get('host'));
 const fallbackUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : SITE_URL;
 const fallback = new URL(fallbackUrl);
 const host = forwardedHost || directHost || fallback.host;
 const protocol = forwardedProto || (host.includes('localhost') ? 'http' : fallback.protocol.replace(':', '') || 'https');

 return `${protocol}://${host}`;
}

export function getAbsoluteUrl(path: string, origin = SITE_URL) {
 return new URL(path, origin).toString();
}
