/**
 * Frame-driven scramble-to-reveal text animation for Remotion.
 * Mirrors the AnimatedMetricValue effect from the real app,
 * but uses useCurrentFrame() instead of requestAnimationFrame.
 */
import React from 'react';
import { useCurrentFrame, random } from 'remotion';
import type { CSSProperties } from 'react';

const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*';

function seededGlyph(seed: string): string {
  const index = Math.floor(random(seed) * SCRAMBLE_GLYPHS.length);
  return SCRAMBLE_GLYPHS[index];
}

type ScrambleTextProps = {
  value: string;
  /** Frame at which the reveal starts (relative to composition) */
  revealStart: number;
  /** Number of frames for the full reveal */
  revealDuration?: number;
  className?: string;
  style?: CSSProperties;
};

export function ScrambleText({
  value,
  revealStart,
  revealDuration = 20,
  className,
  style,
}: ScrambleTextProps) {
  const frame = useCurrentFrame();
  const chars = Array.from(value);

  const localFrame = frame - revealStart;

  // Before reveal: all scrambled
  // During reveal: progressive left-to-right reveal
  // After reveal: all real
  const progress = localFrame < 0
    ? 0
    : localFrame >= revealDuration
      ? 1
      : localFrame / revealDuration;

  const revealedCount = Math.floor(progress * chars.length);

  return (
    <span className={className} style={style}>
      {chars.map((char, index) => {
        if (char === ' ') return <span key={index} className="metric-char"> </span>;

        const isRevealed = index < revealedCount;
        // Use a different seed per frame so scrambled chars change
        const displayChar = isRevealed
          ? char
          : seededGlyph(`${value}-${index}-${frame}`);

        return (
          <span
            key={index}
            className={isRevealed ? 'metric-char' : 'metric-char metric-char-scramble'}
          >
            {displayChar}
          </span>
        );
      })}
    </span>
  );
}
