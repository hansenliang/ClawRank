import type { ShareStat } from '@/src/contracts/clawrank';
import { formatCompact, formatStandard } from '@/src/lib/data';

function badgeClass(status: ShareStat['status']) {
 if (status === 'partial') return 'status-badge status-partial';
 if (status === 'missing') return 'status-badge status-missing';
 return 'status-badge';
}

export function StatGrid({ stats }: { stats: ShareStat[] }) {
 return (
 <div className="stats-grid">
 {stats.map((stat) => {
 const isMissing = stat.status === 'missing';
 // For "Top model", the detail IS the display value (model name)
 let display: string;
 if (isMissing) {
 display = '—';
 } else if (stat.label === 'Top model') {
 display = stat.detail || '—';
 } else if (stat.label === 'Estimated cost') {
 display = stat.value > 0 ? `${stat.value}¢` : '—';
 } else if (stat.label === 'Tokens') {
 display = formatCompact(stat.value);
 } else {
 display = formatStandard(stat.value);
 }
 return (
 <div key={stat.label} className="metric-card">
 <div className="metric-label">{stat.label}</div>
 <div className="metric-value">{display}</div>
 {stat.detail && stat.label !== 'Top model' && stat.label !== 'Estimated cost' && !isMissing && (
 <div className="metric-detail muted" style={{ marginTop: 4, fontSize: 13 }}>{stat.detail}</div>
 )}
 <div style={{ marginTop: 10 }}>
 <span className={badgeClass(stat.status)}>{stat.status}</span>
 </div>
 </div>
 );
 })}
 </div>
 );
}
