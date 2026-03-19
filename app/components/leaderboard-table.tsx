'use client';

import Link from 'next/link';
import { AnimatedMetricValue } from './animated-metric-value';
import { ShareLinkButton } from './share-link-button';
import { StateBadge } from './state-badge';
import { formatCompactNumber as formatCompact, formatNumber as formatStandard } from '@/src/lib/format';
import type { LeaderboardRow } from '@/src/contracts/clawrank';

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
 if (avatarUrl) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={avatarUrl} alt={`${name} avatar`} className="avatar avatar-photo" referrerPolicy="no-referrer" />;
 }
 return <div className="avatar">{name.slice(0, 2).toUpperCase()}</div>;
}

function metricDisplay(metric: { value: number; status: string }, compact = false): string {
 if (metric.status === 'missing') return '—';
 return compact ? formatCompact(metric.value) : formatStandard(metric.value);
}

function gitDisplay(row: LeaderboardRow): string {
 if (row.commits.status === 'missing') return '—';
 const parts = [`${formatStandard(row.commits.value)} commits`];
 if (row.filesTouched.value) parts.push(`${formatStandard(row.filesTouched.value)} files`);
 return parts.join(' · ');
}

export function LeaderboardTable({ rows, basePath = '/a' }: { rows: LeaderboardRow[]; basePath?: string }) {
 return (
 <div className="table-wrap">
 <div className="desktop-only">
 <table className="table">
 <thead>
 <tr>
 <th style={{ width: '6%' }}>Rank</th>
 <th style={{ width: '28%' }}>Agent</th>
 <th style={{ width: '16%' }}>Tokens</th>
 <th style={{ width: '14%' }}>Tool calls</th>
 <th style={{ width: '12%' }}>Messages</th>
 <th style={{ width: '12%' }}>Git</th>
 <th style={{ width: '12%' }}>Top tools</th>
 </tr>
 </thead>
 <tbody>
 {rows.map((row, index) => (
 <tr key={`${row.id}-${index}`}>
 <td>
 <span className="rank-badge">{row.rank}</span>
 </td>
 <td>
 <div className="identity-row">
 <Link href={`${basePath}/${row.detailSlug}`} className="identity">
 <Avatar name={row.agentName} avatarUrl={row.avatarUrl} />
 <div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
 <StateBadge state={row.derivedState} />
                  <AnimatedMetricValue value={row.agentName} />
 </div>
 <div className="muted"><AnimatedMetricValue value={`by @${row.ownerName}`} style={{ fontSize: 12 }} /></div>
 </div>
 </Link>
 <ShareLinkButton path={`${basePath}/${row.detailSlug}`} label={row.displayName} />
 </div>
 </td>
 <td><AnimatedMetricValue value={formatCompact(row.tokenUsage.value)} /></td>
 <td><AnimatedMetricValue value={metricDisplay(row.toolCalls)} /></td>
 <td><AnimatedMetricValue value={metricDisplay(row.messageCount)} /></td>
 <td className="muted"><AnimatedMetricValue value={gitDisplay(row)} /></td>
 <td>
 <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
 {(row.topToolNames || []).map((tool) => (
 <span className="pill" key={tool}>{tool}</span>
 ))}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="mobile-only">
 <div className="mobile-card-list">
 {rows.map((row, index) => (
 <div key={`${row.id}-${index}`} className="mobile-card">
 <div className="mobile-card-header">
 <span className="rank-badge">{row.rank}</span>
 <Link href={`${basePath}/${row.detailSlug}`} className="identity">
 <Avatar name={row.agentName} avatarUrl={row.avatarUrl} />
 <div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
 <StateBadge state={row.derivedState} />
                  <AnimatedMetricValue value={row.agentName} />
 </div>
 <div className="muted"><AnimatedMetricValue value={`by @${row.ownerName}`} style={{ fontSize: 12 }} /></div>
 </div>
 </Link>
 <div style={{ marginLeft: 'auto' }}>
 <ShareLinkButton path={`${basePath}/${row.detailSlug}`} label={row.displayName} />
 </div>
 </div>

 <div className="mobile-card-metrics">
 <div className="mobile-metric">
 <span className="mobile-metric-label">Tokens</span>
 <span className="mobile-metric-value"><AnimatedMetricValue value={formatCompact(row.tokenUsage.value)} /></span>
 </div>
 <div className="mobile-metric">
 <span className="mobile-metric-label">Calls</span>
 <span className="mobile-metric-value"><AnimatedMetricValue value={metricDisplay(row.toolCalls)} /></span>
 </div>
 <div className="mobile-metric">
 <span className="mobile-metric-label">Msgs</span>
 <span className="mobile-metric-value"><AnimatedMetricValue value={metricDisplay(row.messageCount)} /></span>
 </div>
 </div>

 <div className="mobile-card-git muted">
 <AnimatedMetricValue value={gitDisplay(row)} />
 </div>

 <div className="mobile-card-tools">
 {(row.topToolNames || []).map((tool) => (
 <span className="pill" key={tool}>{tool}</span>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
