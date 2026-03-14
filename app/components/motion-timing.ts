export const METRIC_REVEAL_MIN_MS = 720;
export const METRIC_REVEAL_MAX_MS = 760;
export const METRIC_REVEAL_PER_CHAR_MS = 108;

// Start heading after metrics finish so motion feels sequenced.
export const HEADING_STAGGER_BASE_DELAY_MS = METRIC_REVEAL_MAX_MS + 180;
export const HEADING_STAGGER_JITTER_MIN_MS = 30;
export const HEADING_STAGGER_JITTER_MAX_MS = 90;

export function getMetricRevealDurationMs(charCount: number): number {
  return Math.min(METRIC_REVEAL_MAX_MS, Math.max(METRIC_REVEAL_MIN_MS, charCount * METRIC_REVEAL_PER_CHAR_MS));
}
