import React from 'react';
import { ImageResponse } from 'next/og';
import { getShareDetail, formatCompact, formatPeriodLabel } from '@/src/lib/data';

export const runtime = 'nodejs';
const h = React.createElement;

const C = {
 bg: '#0f0f0e',
 border: 'rgba(155,153,145,0.15)',
 text: '#faf9f5',
 text3: '#9b9991',
 text4: '#6b6963',
 accent: '#d87756',
};

let fontData: ArrayBuffer | null = null;
let fontBoldData: ArrayBuffer | null = null;

async function loadFonts() {
 if (!fontData) {
 const [regular, bold] = await Promise.all([
 fetch('https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPQ.ttf').then(r => r.arrayBuffer()),
 fetch('https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8L6tjPQ.ttf').then(r => r.arrayBuffer()),
 ]);
 fontData = regular;
 fontBoldData = bold;
 }
}

export async function GET(_request: Request, { params }: { params: Promise<{ detailSlug: string }> }) {
 const { detailSlug } = await params;
 const detail = await getShareDetail(detailSlug);

 if (!detail) {
 return new Response('Not found', { status: 404 });
 }

 await loadFonts();

 const tokenText = formatCompact(detail.tokenUsage);
 const periodText = formatPeriodLabel(detail.periodStart, detail.periodEnd);

 return new ImageResponse(
 h(
 'div',
 {
 style: {
 height: '100%',
 width: '100%',
 display: 'flex',
 flexDirection: 'column',
 background: C.bg,
 color: C.text,
 fontFamily: 'JetBrains Mono',
 padding: 0,
 },
 },
 // Terminal bar
 h(
 'div',
 {
 style: {
 display: 'flex',
 alignItems: 'center',
 padding: '8px 16px',
 borderBottom: `1px solid ${C.border}`,
 color: C.text4,
 fontSize: 10,
 },
 },
 h('div', { style: { display: 'flex', gap: 5, marginRight: 10 } },
 h('span', { style: { width: 7, height: 7, borderRadius: 999, background: '#c75050', display: 'flex' } }),
 h('span', { style: { width: 7, height: 7, borderRadius: 999, background: '#d4a84b', display: 'flex' } }),
 h('span', { style: { width: 7, height: 7, borderRadius: 999, background: '#5fb87a', display: 'flex' } }),
 ),
 h('span', null, `$ clawrank show ${detail.detailSlug}`),
 ),
 // Content — single column, vertically centered
 h(
 'div',
 {
 style: {
 display: 'flex',
 flexDirection: 'column',
 alignItems: 'center',
 justifyContent: 'center',
 flex: 1,
 padding: '0 16px',
 },
 },
 // Agent name
 h(
 'div',
 {
 style: {
 display: 'flex',
 fontSize: 36,
 fontWeight: 700,
 letterSpacing: -1,
 lineHeight: 1,
 },
 },
 detail.agentName,
 ),
 // Owner
 h(
 'div',
 {
 style: {
 display: 'flex',
 color: C.text3,
 fontSize: 13,
 marginTop: 6,
 marginBottom: 18,
 },
 },
 `by ${detail.ownerName}`,
 ),
 // Token count — the star
 h(
 'div',
 {
 style: {
 display: 'flex',
 fontSize: 64,
 fontWeight: 700,
 color: C.accent,
 lineHeight: 1,
 letterSpacing: -2,
 },
 },
 tokenText,
 ),
 h(
 'div',
 {
 style: {
 display: 'flex',
 color: C.text4,
 fontSize: 11,
 letterSpacing: 4,
 textTransform: 'uppercase',
 marginTop: 4,
 },
 },
 'tokens',
 ),
 ),
 // Bottom bar
 h(
 'div',
 {
 style: {
 display: 'flex',
 justifyContent: 'space-between',
 padding: '8px 16px',
 borderTop: `1px solid ${C.border}`,
 color: C.text4,
 fontSize: 10,
 },
 },
 h('span', { style: { display: 'flex' } }, `▸ #${detail.rank} · ${periodText}`),
 h('span', { style: { display: 'flex', color: C.accent } }, 'clawrank.dev'),
 ),
 ),
 {
 width: 390,
 height: 205,
 fonts: [
 { name: 'JetBrains Mono', data: fontData!, weight: 400, style: 'normal' as const },
 { name: 'JetBrains Mono', data: fontBoldData!, weight: 700, style: 'normal' as const },
 ],
 },
 );
}
