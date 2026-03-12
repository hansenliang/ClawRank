import React from 'react';
import { ImageResponse } from 'next/og';
import { getShareDetail, formatCompact, formatPeriodLabel } from '@/src/lib/data';

export const runtime = 'nodejs';
const h = React.createElement;

export async function GET(_request: Request, { params }: { params: Promise<{ detailSlug: string }> }) {
 const { detailSlug } = await params;
 const detail = await getShareDetail(detailSlug);

 if (!detail) {
 return new Response('Not found', { status: 404 });
 }

 const tokenText = `${formatCompact(detail.tokenUsage)} tokens`;
 const periodText = formatPeriodLabel(detail.periodStart, detail.periodEnd);
 const statCards = [
 ['Token usage', tokenText],
 ['Period', periodText],
 ['Owner', detail.ownerName],
 ].map(([label, value]) =>
 h(
 'div',
 {
 key: label,
 style: {
 display: 'flex',
 flexDirection: 'column',
 borderRadius: 20,
 border: '1px solid rgba(94, 255, 176, 0.18)',
 background: 'rgba(8, 30, 22, 0.78)',
 padding: 20,
 },
 },
 h(
 'div',
 {
 style: {
 display: 'flex',
 color: '#80b69a',
 fontSize: 16,
 textTransform: 'uppercase',
 letterSpacing: 1.4,
 marginBottom: 10,
 },
 },
 label,
 ),
 h('div', { style: { display: 'flex', fontSize: 34, color: '#d8ffe9' } }, value),
 ),
 );

 return new ImageResponse(
 h(
 'div',
 {
 style: {
 height: '100%',
 width: '100%',
 display: 'flex',
 background: 'radial-gradient(circle at top, #113126 0%, #08110e 48%, #030706 100%)',
 color: '#d8ffe9',
 fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", monospace',
 padding: 32,
 },
 },
 h(
 'div',
 {
 style: {
 display: 'flex',
 flexDirection: 'column',
 width: '100%',
 borderRadius: 28,
 overflow: 'hidden',
 border: '1px solid rgba(94, 255, 176, 0.18)',
 background: 'linear-gradient(180deg, rgba(5,16,12,0.95), rgba(5,12,10,0.92))',
 boxShadow: '0 0 0 1px rgba(95,255,176,0.06), 0 20px 80px rgba(0,0,0,0.45)',
 },
 },
 h(
 'div',
 {
 style: {
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 padding: '18px 22px',
 borderBottom: '1px solid rgba(94, 255, 176, 0.18)',
 color: '#80b69a',
 fontSize: 16,
 letterSpacing: 1.6,
 textTransform: 'uppercase',
 },
 },
 h(
 'div',
 { style: { display: 'flex', alignItems: 'center', gap: 10 } },
 h(
 'div',
 { style: { display: 'flex', gap: 8 } },
 h('span', { style: { width: 12, height: 12, borderRadius: 999, background: '#ff6b8a', display: 'flex' } }),
 h('span', { style: { width: 12, height: 12, borderRadius: 999, background: '#ffd166', display: 'flex' } }),
 h('span', { style: { width: 12, height: 12, borderRadius: 999, background: '#5fffb0', display: 'flex' } }),
 ),
 h('span', null, `clawrank://agent/${detail.detailSlug}`),
 ),
 h('div', { style: { display: 'flex', color: '#5fffb0' } }, 'weekly leaderboard'),
 ),
 h(
 'div',
 { style: { display: 'flex', flex: 1, padding: 24, gap: 22 } },
 h(
 'div',
 {
 style: {
 display: 'flex',
 flexDirection: 'column',
 justifyContent: 'space-between',
 flex: 1.3,
 borderRadius: 22,
 border: '1px solid rgba(94, 255, 176, 0.18)',
 background: 'rgba(7, 24, 18, 0.82)',
 padding: 26,
 },
 },
 h(
 'div',
 { style: { display: 'flex', flexDirection: 'column' } },
 h(
 'div',
 {
 style: {
 display: 'flex',
 color: '#5fffb0',
 fontSize: 16,
 letterSpacing: 2.2,
 textTransform: 'uppercase',
 marginBottom: 16,
 },
 },
 'Agent detail',
 ),
 h(
 'div',
 {
 style: {
 display: 'flex',
 fontSize: 74,
 lineHeight: 0.95,
 fontWeight: 700,
 marginBottom: 14,
 maxWidth: 680,
 },
 },
 detail.agentName,
 ),
 h(
 'div',
 { style: { display: 'flex', color: '#80b69a', fontSize: 28, marginBottom: 28 } },
 `owned by ${detail.ownerName}`,
 ),
 h(
 'div',
 {
 style: {
 display: 'flex',
 alignItems: 'center',
 gap: 10,
 borderRadius: 999,
 border: '1px solid rgba(94, 255, 176, 0.18)',
 background: 'rgba(95,255,176,0.07)',
 color: '#d8ffe9',
 padding: '10px 16px',
 fontSize: 22,
 alignSelf: 'flex-start',
 },
 },
 h('span', { style: { display: 'flex', color: '#5fffb0' } }, 'rank'),
 h('span', { style: { display: 'flex' } }, `#${detail.rank}`),
 ),
 ),
 h(
 'div',
 {
 style: {
 display: 'flex',
 flexDirection: 'column',
 borderRadius: 18,
 border: '1px solid rgba(94, 255, 176, 0.18)',
 background: 'rgba(2,10,7,0.9)',
 padding: 18,
 color: '#80b69a',
 fontSize: 20,
 lineHeight: 1.6,
 },
 },
 h('span', null, '> share payload'),
 h('span', { style: { display: 'flex', color: '#d8ffe9' } }, detail.displayName),
 h('span', { style: { display: 'flex', color: '#d8ffe9' } }, tokenText),
 h('span', { style: { display: 'flex', color: '#d8ffe9' } }, periodText),
 ),
 ),
 h(
 'div',
 { style: { display: 'flex', flexDirection: 'column', flex: 0.9, gap: 18 } },
 ...statCards,
 h(
 'div',
 {
 style: {
 display: 'flex',
 flexDirection: 'column',
 borderRadius: 20,
 border: '1px solid rgba(94, 255, 176, 0.18)',
 background: 'rgba(7, 24, 18, 0.82)',
 padding: 20,
 marginTop: 'auto',
 },
 },
 h(
 'div',
 {
 style: {
 display: 'flex',
 color: '#5fffb0',
 fontSize: 16,
 textTransform: 'uppercase',
 letterSpacing: 1.6,
 marginBottom: 14,
 },
 },
 'ClawRank',
 ),
 h(
 'div',
 { style: { display: 'flex', color: '#80b69a', fontSize: 22, lineHeight: 1.5 } },
 'Dark, terminal-flavored brag card for the weekly leaderboard.',
 ),
 ),
 ),
 ),
 ),
 ),
 {
 width: 1200,
 height: 630,
 },
 );
}
