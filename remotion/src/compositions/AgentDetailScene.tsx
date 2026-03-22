import React, { useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { AgentDetail } from '../components/AgentDetail';
import { ReelTypeCaption } from '../components/ReelTypeCaption';
import { DETAIL_SCENE_FRAMES, legacy120ToFrame } from '../beat-sync';
import { VIDEO_ROWS } from '../video-rows';
import '../styles.css';
import { UI_SCENE_BACKDROP_STYLE } from '../ui-scene-backdrop';

/** Demo: detail beat follows rank-3 row (Claudius Maximus) when baked data has ≥3 rows. */
const TOP_ROW = VIDEO_ROWS.length >= 3 ? VIDEO_ROWS[2] : VIDEO_ROWS[0];

const CAPTION_SHOW = legacy120ToFrame(10, DETAIL_SCENE_FRAMES);
const TYPE_START = legacy120ToFrame(22, DETAIL_SCENE_FRAMES);
const CAPTION_FADE = TYPE_START - CAPTION_SHOW;
const CAPTION_TEXT = 'Detailed analytics and insights.';
const EMPHASIS = 'insights.';

/** Matches the mocked browser window chrome; used before layout measures pan range. */
const WINDOW_UI_SCALE = 1.44;

/**
 * Scene 3 — **7s** block (~0:10–0:17 on soundtrack).
 */
export const AgentDetailScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const viewportRef = useRef<HTMLDivElement>(null);
  const scaledContentRef = useRef<HTMLDivElement>(null);
  const [panMaxPx, setPanMaxPx] = useState(0);

  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const scaled = scaledContentRef.current;
    if (!vp || !scaled) return;
    const visualH = scaled.offsetHeight * WINDOW_UI_SCALE;
    const vh = vp.clientHeight;
    // Remotion screenshots after layout; flush so pan range is committed before capture (avoids
    // occasional wrong/blank frames when state updates one tick late vs. GPU compositing).
    flushSync(() => {
      setPanMaxPx(Math.max(0, visualH - vh));
    });
  }, [TOP_ROW.agentName, TOP_ROW.detailSlug]);

  const masterOpacity = interpolate(frame, [0, legacy120ToFrame(10, DETAIL_SCENE_FRAMES)], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const panT = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const panPx = panT * panMaxPx;

  return (
    <AbsoluteFill
      style={{
        ...UI_SCENE_BACKDROP_STYLE,
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
        <div style={{ width: '34%', height: '100%', position: 'relative' }}>
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
            width: '66%',
            height: '100%',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            paddingLeft: 12,
            paddingRight: 16,
            paddingTop: 24,
            paddingBottom: 24,
            boxSizing: 'border-box',
            opacity: masterOpacity,
            overflow: 'hidden',
          }}
        >
          <div
            ref={viewportRef}
            style={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '100%',
                transform: `translateY(${-panPx}px)`,
              }}
            >
              <div
                ref={scaledContentRef}
                style={{
                  width: '100%',
                  transform: `scale(${WINDOW_UI_SCALE})`,
                  transformOrigin: 'top left',
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
                  <AgentDetail row={TOP_ROW} revealOffset={1} instantHeading />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
