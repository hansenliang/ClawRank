/** Shared Remotion typewriter timing (matches Hook / CLI captions). */

import { FRAMES_PER_BEAT_INT } from './beat-sync';

export const REMOTION_FPS = 30;
/** One beat @ 130 BPM @ 30fps — cursor blink on the musical grid. */
export const CURSOR_BLINK_INTERVAL = FRAMES_PER_BEAT_INT;

export function typewriterRevealedCount(
  frame: number,
  startFrame: number,
  textLength: number,
  charsPerSecond: number,
  fps: number = REMOTION_FPS,
): number {
  const t = frame - startFrame;
  if (t < 0) return 0;
  const framesPerChar = fps / charsPerSecond;
  return Math.min(textLength, Math.floor(t / framesPerChar));
}

/** Solid bar while typing; blinks when waiting or finished. */
export function typewriterCursorVisible(
  frame: number,
  typingDone: boolean,
  options?: { preType?: boolean; blinkInterval?: number },
): boolean {
  const interval = options?.blinkInterval ?? CURSOR_BLINK_INTERVAL;
  const preType = options?.preType ?? false;
  if (!typingDone && !preType) return true;
  return Math.floor(frame / interval) % 2 === 0;
}
