'use client';

import { useEffect, useRef, useState } from 'react';

const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*@░█▓';
const TICK_MS = 80; // Slower than reveal animation — ambient feel

function randomGlyph(): string {
  return SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
}

function randomString(len: number): string {
  return Array.from({ length: len }, randomGlyph).join('');
}

/** A single cell that continuously scrambles characters */
function ScrambleCell({ width, className }: { width: number; className?: string }) {
  const [text, setText] = useState(() => randomString(width));
  const frameRef = useRef(0);
  const lastTickRef = useRef(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const tick = (now: number) => {
      if (now - lastTickRef.current >= TICK_MS) {
        setText(randomString(width));
        lastTickRef.current = now;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [width]);

  return <span className={`skeleton-scramble ${className || ''}`}>{text}</span>;
}

// Pre-generated row "shapes" — varying widths for realism
const ROW_SHAPES = [
  { name: 14, handle: 10, tokens: 6, calls: 4, msgs: 3 },
  { name: 11, handle: 8, tokens: 5, calls: 4, msgs: 4 },
  { name: 16, handle: 12, tokens: 6, calls: 3, msgs: 3 },
  { name: 9, handle: 7, tokens: 5, calls: 4, msgs: 4 },
  { name: 13, handle: 9, tokens: 6, calls: 3, msgs: 3 },
  { name: 10, handle: 11, tokens: 5, calls: 4, msgs: 4 },
  { name: 15, handle: 8, tokens: 6, calls: 3, msgs: 3 },
  { name: 12, handle: 10, tokens: 5, calls: 4, msgs: 4 },
  { name: 8, handle: 6, tokens: 6, calls: 3, msgs: 3 },
  { name: 14, handle: 9, tokens: 5, calls: 4, msgs: 4 },
];

export function SkeletonTable({ rows = 10, startRank = 1 }: { rows?: number; startRank?: number }) {
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
            {Array.from({ length: rows }, (_, i) => {
              const shape = ROW_SHAPES[i % ROW_SHAPES.length];
              const rank = startRank + i;
              return (
                <tr key={i} className="skeleton-row">
                  <td><span className="rank-badge">{rank}</span></td>
                  <td>
                    <div className="identity-row">
                      <div className="identity" style={{ pointerEvents: 'none' }}>
                        <div className="avatar skeleton-avatar"><ScrambleCell width={2} /></div>
                        <div>
                          <div><ScrambleCell width={shape.name} /></div>
                          <div className="muted" style={{ fontSize: 12 }}>by @<ScrambleCell width={shape.handle} /></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><ScrambleCell width={shape.tokens} /></td>
                  <td><ScrambleCell width={shape.calls} /></td>
                  <td><ScrambleCell width={shape.msgs} /></td>
                  <td className="muted"><ScrambleCell width={8} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="pill skeleton-pill"><ScrambleCell width={5} /></span>
                      <span className="pill skeleton-pill"><ScrambleCell width={4} /></span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mobile-only">
        <div className="mobile-card-list">
          {Array.from({ length: rows }, (_, i) => {
            const shape = ROW_SHAPES[i % ROW_SHAPES.length];
            const rank = startRank + i;
            return (
              <div key={i} className="mobile-card skeleton-row">
                <div className="mobile-card-header">
                  <span className="rank-badge">{rank}</span>
                  <div className="identity" style={{ pointerEvents: 'none' }}>
                    <div className="avatar skeleton-avatar"><ScrambleCell width={2} /></div>
                    <div>
                      <div><ScrambleCell width={shape.name} /></div>
                      <div className="muted" style={{ fontSize: 12 }}>by @<ScrambleCell width={shape.handle} /></div>
                    </div>
                  </div>
                </div>
                <div className="mobile-card-metrics">
                  <div className="mobile-metric">
                    <span className="mobile-metric-label">Tokens</span>
                    <span className="mobile-metric-value"><ScrambleCell width={shape.tokens} /></span>
                  </div>
                  <div className="mobile-metric">
                    <span className="mobile-metric-label">Calls</span>
                    <span className="mobile-metric-value"><ScrambleCell width={shape.calls} /></span>
                  </div>
                  <div className="mobile-metric">
                    <span className="mobile-metric-label">Msgs</span>
                    <span className="mobile-metric-value"><ScrambleCell width={shape.msgs} /></span>
                  </div>
                </div>
                <div className="mobile-card-git muted"><ScrambleCell width={12} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
