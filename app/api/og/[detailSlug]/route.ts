import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ detailSlug: string }> }) {
  const { detailSlug } = await params;
  return NextResponse.redirect(new URL(`/a/${detailSlug}/opengraph-image`, _request.url));
}
