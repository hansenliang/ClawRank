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
 const toolCalls = detail.stats.find((stat) => stat.label === 'Tool calls');
 const messages = detail.stats.find((stat) => stat.label === 'Messages');
 const sessions = detail.stats.find((stat) => stat.label === 'Sessions');
 const railStats = [
 { label: 'Tool calls', value: toolCalls ? formatCompact(toolCalls.value) : '—' },
 { label: 'Messages', value: messages ? formatCompact(messages.value) : '—' },
 { label: 'Sessions', value: sessions ? formatCompact(sessions.value) : '—' },
 ];

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
 padding: '24px 42px',
 borderBottom: `1px solid ${C.border}`,
 color: C.text4,
 fontSize: 24,
 },
 },
 h('div', { style: { display: 'flex', gap: 12, marginRight: 24 } },
 h('span', { style: { width: 18, height: 18, borderRadius: 999, background: '#c75050', display: 'flex' } }),
 h('span', { style: { width: 18, height: 18, borderRadius: 999, background: '#d4a84b', display: 'flex' } }),
 h('span', { style: { width: 18, height: 18, borderRadius: 999, background: '#5fb87a', display: 'flex' } }),
 ),
 h('span', null, `$ clawrank show ${detail.detailSlug}`),
 ),
 // Content — designed for a 400 × 210pt card at 3× density
 h(
 'div',
 {
 style: {
 display: 'flex',
 alignItems: 'stretch',
 flex: 1,
 padding: '42px 48px 34px',
 gap: 40,
 },
 },
 h(
 'div',
 {
 style: {
 display: 'flex',
 flexDirection: 'column',
 justifyContent: 'center',
 flex: 1,
 minWidth: 0,
 },
 },
 h(
 'div',
 {
 style: {
 display: 'flex',
 color: C.text4,
 fontSize: 20,
 letterSpacing: 3,
 textTransform: 'uppercase',
 marginBottom: 18,
 },
 },
 `#${detail.rank} this week`,
 ),
 h(
 'div',
 {
 style: {
 display: 'flex',
 alignItems: 'baseline',
 gap: 18,
 flexWrap: 'wrap',
 marginBottom: 34,
 },
 },
 h(
 'div',
 {
 style: {
 display: 'flex',
 fontSize: 72,
 fontWeight: 700,
 letterSpacing: -2,
 lineHeight: 1,
 color: C.text,
 },
 },
 detail.agentName,
 ),
 h(
 'div',
 {
 style: {
 display: 'flex',
 color: C.text3,
 fontSize: 34,
 lineHeight: 1,
 },
 },
 `by ${detail.ownerName}`,
 ),
 ),
 h(
 'div',
 {
 style: {
 display: 'flex',
 alignItems: 'baseline',
 gap: 18,
 flexWrap: 'wrap',
 marginBottom: 14,
 },
 },
 h(
 'div',
 {
 style: {
 display: 'flex',
 fontSize: 112,
 fontWeight: 700,
 color: C.accent,
 lineHeight: 0.9,
 letterSpacing: -4,
 },
 },
 tokenText,
 ),
 h(
 'div',
 {
 style: {
 display: 'flex',
 color: C.text3,
 fontSize: 40,
 fontWeight: 400,
 lineHeight: 1,
 letterSpacing: -1,
 },
 },
 'tokens',
 ),
 ),
 ),
 h(
 'div',
 {
 style: {
 width: 250,
 display: 'flex',
 flexDirection: 'column',
 justifyContent: 'center',
 borderLeft: `1px solid ${C.border}`,
 paddingLeft: 28,
 gap: 22,
 },
 },
 ...railStats.map((stat) =>
 h(
 'div',
 {
 key: stat.label,
 style: {
 display: 'flex',
 flexDirection: 'column',
 gap: 6,
 },
 },
 h(
 'div',
 {
 style: {
 display: 'flex',
 color: C.text4,
 fontSize: 18,
 textTransform: 'uppercase',
 letterSpacing: 2.5,
 },
 },
 stat.label,
 ),
 h(
 'div',
 {
 style: {
 display: 'flex',
 color: C.text,
 fontSize: 42,
 fontWeight: 700,
 letterSpacing: -1.5,
 lineHeight: 1,
 },
 },
 stat.value,
 ),
 ),
 ),
 ),
 ),
 // Bottom bar
 h(
 'div',
 {
 style: {
 display: 'flex',
 justifyContent: 'space-between',
 padding: '24px 42px',
 borderTop: `1px solid ${C.border}`,
 color: C.text4,
 fontSize: 24,
 },
 },
 h('span', { style: { display: 'flex' } }, `▸ ${periodText}`),
 h('span', { style: { display: 'flex', color: C.accent } }, 'clawrank.dev'),
 ),
 ),
 {
 width: 1200,
 height: 630,
 fonts: [
 { name: 'JetBrains Mono', data: fontData!, weight: 400, style: 'normal' as const },
 { name: 'JetBrains Mono', data: fontBoldData!, weight: 700, style: 'normal' as const },
 ],
 },
 );
}
