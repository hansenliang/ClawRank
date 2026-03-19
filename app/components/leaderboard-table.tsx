import Link from 'next/link';
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

export function LeaderboardTable({ rows, basePath = '/a' }: { rows: LeaderboardRow[]; basePath?: string }) {
 return (
 <div className="table-wrap">
 <div className="desktop-only">
 <table className="table">
 <thead>
 <tr>
 <th>Rank</th>
 <th>Agent</th>
 <th>Tokens</th>
 <th>Tool calls</th>
 <th>Messages</th>
 <th>Git</th>
 <th>Top tools</th>
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
                  {row.agentName}
 </div>
 <div className="muted">by @{row.ownerName}</div>
 </div>
 </Link>
 <ShareLinkButton path={`${basePath}/${row.detailSlug}`} label={row.displayName} />
 </div>
 </td>
 <td>{formatCompact(row.tokenUsage.value)}</td>
 <td>{metricDisplay(row.toolCalls)}</td>
 <td>{metricDisplay(row.messageCount)}</td>
 <td className="muted">
 {row.commits.status === 'missing' ? '—' : `${formatStandard(row.commits.value)} commits${row.filesTouched.value ? ` · ${formatStandard(row.filesTouched.value)} files` : ''}`}
 </td>
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
                  {row.agentName}
 </div>
 <div className="muted" style={{ fontSize: 12 }}>by @{row.ownerName}</div>
 </div>
 </Link>
 <div style={{ marginLeft: 'auto' }}>
 <ShareLinkButton path={`${basePath}/${row.detailSlug}`} label={row.displayName} />
 </div>
 </div>

 <div className="mobile-card-metrics">
 <div className="mobile-metric">
 <span className="mobile-metric-label">Tokens</span>
 <span className="mobile-metric-value">{formatCompact(row.tokenUsage.value)}</span>
 </div>
 <div className="mobile-metric">
 <span className="mobile-metric-label">Calls</span>
 <span className="mobile-metric-value">{metricDisplay(row.toolCalls)}</span>
 </div>
 <div className="mobile-metric">
 <span className="mobile-metric-label">Msgs</span>
 <span className="mobile-metric-value">{metricDisplay(row.messageCount)}</span>
 </div>
 </div>

 <div className="mobile-card-git muted">
 {row.commits.status === 'missing' ? '—' : `${formatStandard(row.commits.value)} commits${row.filesTouched.value ? ` · ${formatStandard(row.filesTouched.value)} files modified` : ''}`}
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
