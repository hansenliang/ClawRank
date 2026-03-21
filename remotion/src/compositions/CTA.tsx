import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CTA_DURATION_FRAMES, FRAMES_PER_BEAT_INT } from '../beat-sync';
import '../styles.css';

const PROMPT_LINE = 'Install ClawRank from ClawHub and get me ranked.';
const CHARS_PER_SECOND = 15;
const FPS = 30;
const FRAMES_PER_CHAR = FPS / CHARS_PER_SECOND;
const CURSOR_BLINK_INTERVAL = FRAMES_PER_BEAT_INT;
/** Scaled from older ~28f offset in a longer CTA comp — room to read “ClawRank” first. */
const TYPE_START = Math.max(
  12,
  Math.round((28 / 443) * CTA_DURATION_FRAMES),
);

export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const typeFrame = frame - TYPE_START;

  const revealedChars =
    typeFrame < 0
      ? 0
      : Math.min(PROMPT_LINE.length, Math.floor(typeFrame / FRAMES_PER_CHAR));
  const typed = PROMPT_LINE.slice(0, revealedChars);
  const typingDone = revealedChars >= PROMPT_LINE.length;

  const cursorVisible = typingDone
    ? Math.floor(frame / CURSOR_BLINK_INTERVAL) % 2 === 0
    : true;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f0f0e',
        fontFamily:
          "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          maxWidth: 920,
          padding: '0 40px',
        }}
      >
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: 44,
              fontWeight: 700,
              color: '#d87756',
              opacity: 0.2,
              filter: 'blur(12px)',
              letterSpacing: '-0.03em',
              pointerEvents: 'none',
            }}
          >
            ClawRank
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: '#faf9f5',
              letterSpacing: '-0.03em',
              textShadow: '0 0 14px rgba(216, 119, 86, 0.12)',
            }}
          >
            ClawRank
          </div>
        </div>

        <div
          style={{
            fontSize: 17,
            fontWeight: 500,
            color: '#c1bfb5',
            letterSpacing: '-0.01em',
          }}
        >
          Ask your OpenClaw:
        </div>

        <div
          style={{
            width: '100%',
            marginTop: 8,
            borderRadius: 8,
            border: '1px solid rgba(216, 119, 86, 0.35)',
            background: 'rgba(25, 24, 23, 0.95)',
            boxShadow:
              '0 0 0 1px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.35)',
            padding: '18px 22px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: '#9b9991',
              marginBottom: 10,
              letterSpacing: '0.02em',
            }}
          >
            <span style={{ color: '#d87756' }}>openclaw</span>
            <span style={{ color: '#6b6963' }}> ~/fleet</span>
            <span style={{ color: '#faf9f5' }}> $</span>
          </div>
          <div style={{ position: 'relative' }}>
            {/* Invisible full text to reserve final box size */}
            <div
              aria-hidden
              style={{
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                visibility: 'hidden',
              }}
            >
              {PROMPT_LINE}
            </div>
            {/* Visible typed text overlaid at the same position */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                fontSize: 16,
                fontWeight: 500,
                color: '#faf9f5',
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {typed}
              <span
                style={{
                  display: 'inline-block',
                  width: '0.45em',
                  height: '0.1em',
                  backgroundColor: 'rgba(216, 119, 86, 0.9)',
                  marginLeft: '0.12em',
                  verticalAlign: 'baseline',
                  borderRadius: 1,
                  opacity: cursorVisible ? 1 : 0,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
