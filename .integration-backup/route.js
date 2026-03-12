import { NextResponse } from 'next/server';
import { getShareDetail } from '@/lib/clawrank-data';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
 const detail = getShareDetail(params.detailSlug);
 if (!detail) {
 return NextResponse.json({ error: 'Not found' }, { status: 404 });
 }
 return NextResponse.json({ detail });
}
