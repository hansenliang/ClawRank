import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { MOCK_ROWS } from '../mock-data';
import { AgentDetail } from '../components/AgentDetail';
import { ReelTypeCaption } from '../components/ReelTypeCaption';
import '../styles.css';

const TOP_ROW = MOCK_ROWS[0];

const CAPTION_SHOW = 10;
const CAPTION_FADE = 12;
const TYPE_START = CAPTION_SHOW + CAPTION_FADE;
const CAPTION_TEXT = 'Detailed analytics and insights.';
const EMPHASIS = 'insights.';

/**
 * Scene 3 — 120f — #1 agent detail (nightowl-agent), metrics scramble, side caption.
 */
export const AgentDetailScene: React.FC = () => {
  const frame = useCurrentFrame();

  const masterOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f0f0e',
        fontFamily:
          "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: '100%',
        }}
      >
        <div style={{ width: '40%', height: '100%', position: 'relative' }}>
          <ReelTypeCaption
            frame={frame}
            showFromFrame={CAPTION_SHOW}
            fadeInFrames={CAPTION_FADE}
            typeStartFrame={TYPE_START}
            fullText={CAPTION_TEXT}
            emphasizeSubstring={EMPHASIS}
          />
        </div>
        <div
          style={{
            width: '60%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingLeft: 16,
            paddingRight: 8,
            boxSizing: 'border-box',
            opacity: masterOpacity,
            overflow: 'auto',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 720,
              transform: 'scale(0.92)',
              transformOrigin: 'center center',
            }}
          >
            <div className="window">
              <div className="window-bar">
                <div className="window-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="window-title">clawrank.dev — {TOP_ROW.agentName}</div>
              </div>
              <AgentDetail row={TOP_ROW} revealOffset={12} />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
