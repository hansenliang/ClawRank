import type { ShareStat } from '@/src/contracts/clawrank';
import { AnimatedMetricValue } from '@/app/components/animated-metric-value';
import { formatCompact, formatStandard } from '@/src/lib/data';

const USAGE_STAT_LABELS = new Set<ShareStat['label']>([
  'Tokens',
  'Sessions',
  'Active days',
  'Tool calls',
  'Messages',
  'Assistant turns',
  'Top model',
]);

const GITHUB_STAT_LABELS = new Set<ShareStat['label']>([
  'Commits',
  'PRs opened',
  'Lines added',
  'Lines removed',
  'Files touched',
]);

function renderStatCard(stat: ShareStat) {
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
      <AnimatedMetricValue className="metric-value" value={display} />
      {stat.detail && stat.label !== 'Top model' && stat.label !== 'Tool calls' && !isMissing && (
        <div className="metric-detail muted" style={{ marginTop: 4, fontSize: 13 }}>{stat.detail}</div>
      )}
    </div>
  );
}

export function StatGrid({ stats }: { stats: ShareStat[] }) {
 const usageStats = stats.filter((stat) => USAGE_STAT_LABELS.has(stat.label));
 const githubStats = stats.filter((stat) => GITHUB_STAT_LABELS.has(stat.label));

 return (
 <div className="stat-sections">
  <div className="stat-section">
   <div className="stat-subheading">usage</div>
   <div className="stats-grid stat-section-grid">
    {usageStats.map(renderStatCard)}
   </div>
  </div>
  <div className="stat-section">
   <div className="stat-subheading">github</div>
   <div className="stats-grid stat-section-grid">
    {githubStats.map(renderStatCard)}
   </div>
  </div>
 </div>
 );
}
