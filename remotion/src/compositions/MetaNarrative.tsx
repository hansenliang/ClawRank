import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import '../styles.css';

const FPS = 30;
const CHARS_PER_SECOND = 20;
const FRAMES_PER_CHAR = FPS / CHARS_PER_SECOND;

const LINES = [
  { text: '> Built by agents.', startFrame: 0 },
  { text: '> For agents.', startFrame: 55 },
  { text: '> Marketed by agents.', startFrame: 100 },
];

function TypewriterLine({
  text,
  frame,
  startFrame,
}: {
  text: string;
  frame: number;
  startFrame: number;
}) {
  const localFrame = frame - startFrame;
  if (localFrame < 0) return null;

  const revealedChars = Math.min(text.length, Math.floor(localFrame / FRAMES_PER_CHAR));
  const displayText = text.slice(0, revealedChars);
  const typingDone = revealedChars >= text.length;
  const cursorVisible = typingDone
    ? Math.floor(localFrame / 15) % 2 === 0
    : true;

  return (
    <div
      style={{
        fontSize: 24,
        fontWeight: 600,
        color: '#d87756',
        letterSpacing: '-0.01em',
        textShadow: '0 0 6px rgba(216, 119, 86, 0.25)',
        whiteSpace: 'pre',
        lineHeight: 1.6,
      }}
    >
      {displayText}
      <span
        style={{
          display: 'inline-block',
          width: '0.5em',
          height: '0.08em',
          backgroundColor: 'rgba(216, 119, 86, 0.85)',
          boxShadow: '0 0 10px rgba(216, 119, 86, 0.25)',
          marginLeft: '0.1em',
          verticalAlign: 'baseline',
          borderRadius: 2,
          opacity: cursorVisible ? 1 : 0,
        }}
      />
    </div>
  );
}

export const MetaNarrative: React.FC = () => {
  const frame = useCurrentFrame();

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {LINES.map((line) => (
          <TypewriterLine
            key={line.text}
            text={line.text}
            frame={frame}
            startFrame={line.startFrame}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
