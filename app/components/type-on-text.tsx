'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  HEADING_STAGGER_BASE_DELAY_MS,
  HEADING_STAGGER_JITTER_MAX_MS,
  HEADING_STAGGER_JITTER_MIN_MS,
} from './motion-timing';

type TypeOnTextProps = {
  text: string;
  containerClassName: string;
  textClassName: string;
  cursorClassName: string;
};

export function TypeOnText({
  text,
  containerClassName,
  textClassName,
  cursorClassName,
}: TypeOnTextProps) {
  const chars = useMemo(() => Array.from(text), [text]);
  // Start with full text so SSR and no-JS renders show complete content.
  // On mount, a useEffect schedules a reset before the typing animation starts.
  const [visibleCount, setVisibleCount] = useState(() => chars.length);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      setVisibleCount(0);
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [chars]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      return;
    }

    const randomBetween = (minMs: number, maxMs: number) =>
      Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

    const getNextDelayMs = (typedCount: number) => {
      const baseDelay = randomBetween(55, 130);
      const occasionalPause = Math.random() < 0.22 ? randomBetween(35, 120) : 0;
      const breathPause = typedCount === Math.ceil(chars.length / 2) ? randomBetween(40, 100) : 0;
      return baseDelay + occasionalPause + breathPause;
    };

    let typingTimer: number | undefined;
    const startDelayMs =
      HEADING_STAGGER_BASE_DELAY_MS +
      randomBetween(HEADING_STAGGER_JITTER_MIN_MS, HEADING_STAGGER_JITTER_MAX_MS);
    let typedCount = 0;

    const typeNext = () => {
      typedCount += 1;
      setVisibleCount(typedCount);

      if (typedCount >= chars.length) return;

      typingTimer = window.setTimeout(typeNext, getNextDelayMs(typedCount));
    };

    const startTimer = window.setTimeout(typeNext, startDelayMs);

    return () => {
      window.clearTimeout(startTimer);
      if (typingTimer) window.clearTimeout(typingTimer);
    };
  }, [chars]);

  return (
    <span className={containerClassName}>
      <span className="sr-only">{text}</span>
      <span className="type-on-reserve" aria-hidden="true">{text}</span>
      <span className="type-on-live" aria-hidden="true">
        <span className={`${textClassName} ${cursorClassName}`}>{chars.slice(0, visibleCount).join('')}</span>
      </span>
    </span>
  );
}
