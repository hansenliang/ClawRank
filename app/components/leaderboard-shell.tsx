'use client';

import { useState, useTransition, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { LeaderboardPeriod } from '@/src/contracts/clawrank-domain';
import type { LeaderboardRow } from '@/src/contracts/clawrank';
import { LeaderboardTable } from './leaderboard-table';
import { SkeletonTable } from './skeleton-table';

const PAGE_SIZE = 10;

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'alltime', label: 'All time' },
  { value: 'month', label: '30 days' },
  { value: 'week', label: '7 days' },
];

export function LeaderboardShell({
  rows,
  currentPeriod,
}: {
  rows: LeaderboardRow[];
  currentPeriod: LeaderboardPeriod;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  // Track period to reset query/page on period change
  const [lastPeriod, setLastPeriod] = useState(currentPeriod);

  let effectiveQuery = query;
  let effectivePage = page;
  if (lastPeriod !== currentPeriod) {
    // Period changed — reset state synchronously during render (React pattern for derived state)
    effectiveQuery = '';
    effectivePage = 1;
  }

  // Sync after render via the setState-during-render pattern
  if (lastPeriod !== currentPeriod) {
    setLastPeriod(currentPeriod);
    setQuery('');
    setPage(1);
  }

  // Filter rows by search query
  const filtered = useMemo(() => {
    if (!effectiveQuery.trim()) return rows;
    const q = effectiveQuery.toLowerCase().trim();
    return rows.filter(
      (r) =>
        r.agentName.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.displayName.toLowerCase().includes(q)
    );
  }, [rows, effectiveQuery]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(effectivePage, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handlePeriodChange = useCallback(
    (period: LeaderboardPeriod) => {
      const params = new URLSearchParams(searchParams.toString());
      if (period === 'alltime') {
        params.delete('period');
      } else {
        params.set('period', period);
      }
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/?${qs}` : '/');
      });
    },
    [router, searchParams, startTransition]
  );

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setPage(1);
  }, []);

  // Page range for pagination buttons
  const pageRange = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('...');
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  return (
    <>
      <div className="period-bar">
        <div className="period-controls">
          <div className="period-selector" role="tablist" aria-label="Time period">
            {PERIODS.map(({ value, label }) => (
              <button
                key={value}
                role="tab"
                aria-selected={currentPeriod === value}
                className={`period-tab${currentPeriod === value ? ' period-tab-active' : ''}`}
                onClick={() => handlePeriodChange(value)}
                disabled={isPending}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="search-box">
            <span className="search-prompt" aria-hidden="true">▸</span>
            <input
              type="text"
              className="search-input"
              placeholder="search agents..."
              value={effectiveQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              aria-label="Search agents"
            />
          </div>
        </div>
      </div>

      {isPending ? (
        <SkeletonTable rows={PAGE_SIZE} startRank={(safePage - 1) * PAGE_SIZE + 1} />
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="table-wrap">
              <div className="empty-state">
                <span className="muted">no agents match &ldquo;{effectiveQuery}&rdquo;</span>
              </div>
            </div>
          ) : (
            <LeaderboardTable rows={pageRows} />
          )}
        </>
      )}

      {!isPending && filtered.length > PAGE_SIZE && (
        <div className="pagination-bar">
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            aria-label="Previous page"
          >
            ← prev
          </button>
          <div className="page-numbers">
            {pageRange.map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
              ) : (
                <button
                  key={p}
                  className={`page-num${p === safePage ? ' page-num-active' : ''}`}
                  onClick={() => setPage(p)}
                  aria-current={p === safePage ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}
          </div>
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            aria-label="Next page"
          >
            next →
          </button>
        </div>
      )}
    </>
  );
}
