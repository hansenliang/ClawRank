'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { getMetricRevealDurationMs } from './motion-timing';

const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*';

function randomGlyph(): string {
  const index = Math.floor(Math.random() * SCRAMBLE_GLYPHS.length);
  return SCRAMBLE_GLYPHS[index];
}

type AnimatedMetricValueProps = {
  value: string;
  className?: string;
  style?: CSSProperties;
};

export function AnimatedMetricValue({ value, className, style }: AnimatedMetricValueProps) {
  const [display, setDisplay] = useState(value);
  const [revealedChars, setRevealedChars] = useState(Array.from(value).length);
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setDisplay(value);
      setRevealedChars(Array.from(value).length);
      setIsInView(false);
      hasAnimatedRef.current = false;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  useEffect(() => {
    const node = elementRef.current;
    if (!node || hasAnimatedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        setIsInView(true);
        observer.disconnect();
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  useEffect(() => {
    if (!isInView || hasAnimatedRef.current) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      hasAnimatedRef.current = true;
      return;
    }

    const durationMs = getMetricRevealDurationMs(value.length);
    const chars = Array.from(value);
    const startTime = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const revealCount = Math.floor(progress * chars.length);
      setRevealedChars(revealCount);

      const next = chars
        .map((char, index) => {
          if (char === ' ') return ' ';
          if (index < revealCount) return char;
          return randomGlyph();
        })
        .join('');

      setDisplay(next);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      setDisplay(value);
      setRevealedChars(chars.length);
      hasAnimatedRef.current = true;
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [isInView, value]);

  return (
    <div ref={elementRef} className={className} style={style}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        {Array.from(display).map((char, index) => (
          <span
            key={`${char}-${index}`}
            className={index < revealedChars || char === ' ' ? 'metric-char' : 'metric-char metric-char-scramble'}
          >
            {char}
          </span>
        ))}
      </span>
    </div>
  );
}
