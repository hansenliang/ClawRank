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
        const display = stat.label === 'Tokens' ? formatCompact(stat.value) : formatStandard(stat.value);
        return (
          <div key={stat.label} className="metric-card">
            <div className="metric-label">{stat.label}</div>
            <div className="metric-value">{display}</div>
            <div style={{ marginTop: 10 }}>
              <span className={badgeClass(stat.status)}>{stat.status}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
