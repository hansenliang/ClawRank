import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import {
  typewriterRevealedCount,
  typewriterCursorVisible,
} from '../typewriter';
import '../styles.css';
import { UI_SCENE_BACKDROP_STYLE } from '../ui-scene-backdrop';
import { Mascot } from '../components/Mascot';

const PREFIX = "Meet the world's ";
const TYPE_ON = 'hardest working AI agents.';
const CHARS_PER_SECOND = 20;
/** Short beat before type-on; scales with hook length so typing can finish with time to spare before the cut. */
const PRE_TYPE_HOLD_FRAMES = 0;

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();

  const revealedChars = typewriterRevealedCount(
    frame,
    PRE_TYPE_HOLD_FRAMES,
    TYPE_ON.length,
    CHARS_PER_SECOND,
  );
  const typed = TYPE_ON.slice(0, revealedChars);
  const typingDone = revealedChars >= TYPE_ON.length;
  const preType = frame < PRE_TYPE_HOLD_FRAMES;

  const cursorVisible = typewriterCursorVisible(frame, typingDone, { preType });

  return (
    <AbsoluteFill
      style={{
        ...UI_SCENE_BACKDROP_STYLE,
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
          justifyContent: 'center',
          gap: 28,
          maxWidth: 1100,
          padding: '0 48px',
        }}
      >
        <Mascot size={40} animation="idle" />
        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            whiteSpace: 'pre',
            textAlign: 'center',
          }}
        >
          <span style={{ color: '#faf9f5' }}>{PREFIX}</span>
          <span
            style={{
              color: '#d87756',
              textShadow: '0 0 8px rgba(216, 119, 86, 0.3)',
            }}
          >
            {typed}
          </span>
          <span
            style={{
              display: 'inline-block',
              width: '0.5em',
              height: '0.1em',
              backgroundColor: 'rgba(216, 119, 86, 0.85)',
              boxShadow: '0 0 12px rgba(216, 119, 86, 0.3)',
              marginLeft: '0.1em',
              verticalAlign: 'baseline',
              borderRadius: 2,
              opacity: cursorVisible ? 1 : 0,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
