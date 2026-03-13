'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { LeaderboardPeriod } from '@/src/contracts/clawrank-domain';

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
 { value: 'alltime', label: 'All time' },
 { value: 'month', label: '30 days' },
 { value: 'week', label: '7 days' },
];

export function PeriodSelector({ current }: { current: LeaderboardPeriod }) {
 const router = useRouter();
 const searchParams = useSearchParams();

 function handleSelect(period: LeaderboardPeriod) {
 const params = new URLSearchParams(searchParams.toString());
 if (period === 'alltime') {
 params.delete('period');
 } else {
 params.set('period', period);
 }
 const qs = params.toString();
 router.push(qs ? `/?${qs}` : '/');
 }

 return (
 <div className="period-selector" role="tablist" aria-label="Time period">
 {PERIODS.map(({ value, label }) => (
 <button
 key={value}
 role="tab"
 aria-selected={current === value}
 className={`period-tab${current === value ? ' period-tab-active' : ''}`}
 onClick={() => handleSelect(value)}
 >
 {label}
 </button>
 ))}
 </div>
 );
}
