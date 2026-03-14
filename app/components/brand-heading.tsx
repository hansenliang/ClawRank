'use client';

import { useEffect, useMemo, useState } from 'react';

type BrandHeadingProps = {
  text: string;
};

export default function BrandHeading({ text }: BrandHeadingProps) {
  const chars = useMemo(() => Array.from(text), [text]);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      const reducedMotionTimer = window.setTimeout(() => {
        setVisibleCount(chars.length);
      }, 0);
      return () => window.clearTimeout(reducedMotionTimer);
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
    const startDelayMs = randomBetween(70, 140);
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
    <h1 className="brand-heading">
      <span className="brand-heading-text">{chars.slice(0, visibleCount).join('')}</span>
    </h1>
  );
}
