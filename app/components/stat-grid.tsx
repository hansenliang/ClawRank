import type { ShareStat } from '@/src/contracts/clawrank';
import { formatCompact, formatStandard } from '@/src/lib/data';

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
 } else if (stat.label === 'Tokens') {
 display = formatCompact(stat.value);
 } else {
 display = formatStandard(stat.value);
 }
 return (
 <div key={stat.label} className="metric-card">
 <div className="metric-label">{stat.label}</div>
 <div className="metric-value">{display}</div>
      {stat.detail && stat.label !== 'Top model' && stat.label !== 'Tool calls' && !isMissing && (
 <div className="metric-detail muted" style={{ marginTop: 4, fontSize: 13 }}>{stat.detail}</div>
 )}
 </div>
 );
 })}
 </div>
 );
}
