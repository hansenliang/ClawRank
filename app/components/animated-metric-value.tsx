'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { getMetricRevealDurationMs } from './motion-timing';

const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*';
const LOADING_TICK_MS = 80;

function randomGlyph(): string {
  const index = Math.floor(Math.random() * SCRAMBLE_GLYPHS.length);
  return SCRAMBLE_GLYPHS[index];
}

type AnimatedMetricValueProps = {
  value: string;
  className?: string;
  style?: CSSProperties;
  isLoading?: boolean;
};

export function AnimatedMetricValue({ value, className, style, isLoading }: AnimatedMetricValueProps) {
  const [display, setDisplay] = useState(value);
  const [revealedChars, setRevealedChars] = useState(Array.from(value).length);
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const hasAnimatedRef = useRef(false);

  // Loading scramble: cycle random chars at the same length as value
  useEffect(() => {
    if (!isLoading) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const chars = Array.from(value);
    let frameId = 0;
    let lastTick = 0;

    const tick = (now: number) => {
      if (now - lastTick >= LOADING_TICK_MS) {
        const scrambled = chars
          .map((c) => (c === ' ' ? ' ' : randomGlyph()))
          .join('');
        setDisplay(scrambled);
        setRevealedChars(0);
        lastTick = now;
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isLoading, value]);

  // When loading ends with new value, reset for reveal animation
  useEffect(() => {
    if (isLoading) return;

    const frame = window.requestAnimationFrame(() => {
      setDisplay(value);
      setRevealedChars(Array.from(value).length);
      setIsInView(false);
      hasAnimatedRef.current = false;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [value, isLoading]);

  useEffect(() => {
    if (isLoading) return;
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
  }, [value, isLoading]);

  useEffect(() => {
    if (isLoading) return;
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
  }, [isInView, value, isLoading]);

  const loadingStyle = isLoading ? { opacity: 0.4 } : undefined;
  const mergedStyle = loadingStyle ? { ...style, ...loadingStyle } : style;

  return (
    <div ref={elementRef} className={className} style={mergedStyle}>
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
