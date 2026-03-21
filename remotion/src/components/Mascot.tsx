import React, { useLayoutEffect, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * ClawRank Mascot — same pixel sprite as `app/components/mascot.tsx` on feat/ux-polish,
 * but driven by Remotion frame time (no requestAnimationFrame).
 *
 * @see feat/ux-polish:app/components/mascot.tsx
 */
type Animation = 'idle' | 'snap' | 'jump' | 'wave';

export type MascotProps = {
  size?: number;
  animation?: Animation;
  className?: string;
};

const T = '#d87756';
const D = '#a85535';
const E = '#0f0f0e';
const BG = '#0f0f0e';

const GRID = 16;
/** Matches the web mascot's internal tick rate (~10/s). */
const MASCOT_SPRITE_FPS = 10;

type Pixel = [number, number, string];

function buildSprite(frame: number, anim: Animation): Pixel[] {
  const s: Pixel[] = [];

  const isSnap = anim === 'snap' && frame % 10 < 4;
  const isJump = anim === 'jump';
  const isWave = anim === 'wave';

  const jumpY = isJump
    ? -Math.abs(Math.floor(Math.sin(frame * 0.3) * 3))
    : 0;
  const waveL = isWave ? Math.floor(Math.sin(frame * 0.3) * 2) : 0;
  const waveR = isWave
    ? Math.floor(Math.sin(frame * 0.3 + Math.PI) * 2)
    : 0;
  const by = jumpY;

  if (isSnap) {
    s.push([3, 4 + by, T], [4, 4 + by, D]);
    s.push([3, 5 + by, T]);
    s.push([3, 6 + by, T], [4, 6 + by, D]);
  } else {
    s.push([1, 3 + by + waveL, T], [2, 3 + by + waveL, D]);
    s.push([1, 4 + by + waveL, T]);
    s.push([1, 5 + by + waveL, T]);
    s.push([1, 6 + by + waveL, T], [2, 6 + by + waveL, D]);
  }

  if (isSnap) {
    s.push([11, 4 + by, D], [12, 4 + by, T]);
    s.push([12, 5 + by, T]);
    s.push([11, 6 + by, D], [12, 6 + by, T]);
  } else {
    s.push([13, 3 + by + waveR, D], [14, 3 + by + waveR, T]);
    s.push([14, 4 + by + waveR, T]);
    s.push([14, 5 + by + waveR, T]);
    s.push([13, 6 + by + waveR, D], [14, 6 + by + waveR, T]);
  }

  for (let y = 3; y <= 9; y++) {
    for (let x = 5; x <= 10; x++) {
      s.push([x, y + by, y >= 8 ? D : T]);
    }
  }

  const blink = frame % 40 < 2;
  if (blink) {
    s.push([6, 5 + by, E], [9, 5 + by, E]);
  } else {
    s.push([6, 4 + by, E], [6, 5 + by, E]);
    s.push([9, 4 + by, E], [9, 5 + by, E]);
  }

  s.push([7, 7 + by, E], [8, 7 + by, E]);

  const walk = frame % 8 < 4 ? 0 : 1;
  if (!(isJump && jumpY < -1)) {
    s.push([5 - walk, 10 + by, D], [6, 10 + by, D]);
    s.push([9, 10 + by, D], [10 + walk, 10 + by, D]);
  }

  return s;
}

export const Mascot: React.FC<MascotProps> = ({
  size = 32,
  animation = 'idle',
  className,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const spriteFrame = Math.floor((frame * MASCOT_SPRITE_FPS) / fps);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, GRID, GRID);
    const sprite = buildSprite(spriteFrame, animation);
    for (const [x, y, color] of sprite) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }, [spriteFrame, animation]);

  return (
    <canvas
      ref={canvasRef}
      width={GRID}
      height={GRID}
      className={className}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        flexShrink: 0,
      }}
    />
  );
};
