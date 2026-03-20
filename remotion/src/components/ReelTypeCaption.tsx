import React from 'react';
import { interpolate } from 'remotion';
import {
  typewriterRevealedCount,
  typewriterCursorVisible,
} from '../typewriter';

const ACCENT = '#d87756';
const CREAM = '#faf9f5';

/** Original `SideCaption` overlay — depth on dark UI. */
const SHADOW_DEPTH = '0 1px 24px rgba(0,0,0,0.45)';
/** Original CTA title — soft accent bloom on cream. */
const SHADOW_CREAM_BLOOM = '0 0 10px rgba(216, 119, 86, 0.15)';

type ReelTypeCaptionProps = {
  frame: number;
  /** First frame the caption row exists (hidden before). */
  showFromFrame: number;
  fadeInFrames?: number;
  /** First frame typewriter advances (after optional blink-only window). */
  typeStartFrame: number;
  fullText: string;
  /** Substring to render in terracotta when revealed; must appear in `fullText`. */
  emphasizeSubstring: string;
  charsPerSecond?: number;
  /** Typographic size — intentionally large for 720p legibility. */
  fontSize?: number;
};

/**
 * Left-aligned reel caption: fade in, type-on, terracotta emphasis.
 * Overlay styling from early sizzle drafts: SideCaption depth shadow + CTA-style blur bloom layer.
 */
export function ReelTypeCaption({
  frame,
  showFromFrame,
  fadeInFrames = 10,
  typeStartFrame,
  fullText,
  emphasizeSubstring,
  charsPerSecond = 15,
  fontSize = 34,
}: ReelTypeCaptionProps) {
  if (frame < showFromFrame) return null;

  const fadeOpacity = interpolate(
    frame,
    [showFromFrame, showFromFrame + fadeInFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const chars = Array.from(fullText);
  const emphIdx = fullText.indexOf(emphasizeSubstring);
  const emphStart = emphIdx >= 0 ? emphIdx : fullText.length;
  const emphEnd =
    emphIdx >= 0 ? emphIdx + emphasizeSubstring.length : emphIdx;

  const revealed = typewriterRevealedCount(
    frame,
    typeStartFrame,
    chars.length,
    charsPerSecond,
  );
  const typingDone = revealed >= chars.length;
  const preType = frame < typeStartFrame;
  const cursorVisible = typewriterCursorVisible(frame, typingDone, { preType });

  const lineStyle: React.CSSProperties = {
    fontSize,
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: '-0.02em',
    textAlign: 'left',
    maxWidth: '100%',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  const sharpChars = chars.slice(0, revealed).map((ch, i) => {
    const isAccent = i >= emphStart && i < emphEnd;
    return (
      <span
        key={i}
        style={{
          color: isAccent ? ACCENT : CREAM,
          textShadow: isAccent
            ? `${SHADOW_DEPTH}, 0 0 12px rgba(216, 119, 86, 0.35)`
            : `${SHADOW_DEPTH}, ${SHADOW_CREAM_BLOOM}`,
        }}
      >
        {ch}
      </span>
    );
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        height: '100%',
        paddingLeft: 40,
        paddingRight: 20,
        boxSizing: 'border-box',
        opacity: fadeOpacity,
      }}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        {/* CTA-style phosphor bloom: blurred accent duplicate of the line */}
        <div
          aria-hidden
          style={{
            ...lineStyle,
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            pointerEvents: 'none',
            userSelect: 'none',
            color: ACCENT,
            opacity: 0.2,
            filter: 'blur(10px)',
            zIndex: 0,
          }}
        >
          {chars.slice(0, revealed).map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </div>

        <div style={{ ...lineStyle, position: 'relative', zIndex: 1 }}>
          {sharpChars}
          <span
            style={{
              display: 'inline-block',
              width: '0.45em',
              height: '0.09em',
              backgroundColor: 'rgba(216, 119, 86, 0.9)',
              boxShadow: '0 0 10px rgba(216, 119, 86, 0.25)',
              marginLeft: revealed > 0 ? '0.06em' : 0,
              verticalAlign: 'baseline',
              borderRadius: 1,
              opacity: cursorVisible ? 1 : 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
