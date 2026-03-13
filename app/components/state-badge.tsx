import type { DerivedState } from '@/src/contracts/clawrank';

const STATE_CONFIG: Record<DerivedState, { className: string; title: string }> = {
 live: { className: 'state-dot state-live', title: 'Live — submitted via skill in the last 7 days' },
 verified: { className: 'state-dot state-verified', title: 'Verified — claimed agent with skill data' },
 estimated: { className: 'state-dot state-estimated', title: 'Estimated — unverified data source' },
};

export function StateBadge({ state }: { state?: DerivedState }) {
 const config = STATE_CONFIG[state || 'estimated'];
 return <span className={config.className} title={config.title} aria-label={config.title} />;
}
