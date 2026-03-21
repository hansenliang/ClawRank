import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
} from 'remotion';
import { legacy120ToFrame, ZOOM_SCENE_FRAMES } from '../beat-sync';
import { VIDEO_ROWS } from '../video-rows';
import { ScrambleText } from '../components/ScrambleText';
import { ReelTypeCaption } from '../components/ReelTypeCaption';
import { formatCompact } from '../format';
import type { LeaderboardRow } from '../types';
import '../styles.css';

const FPS = 30;

/* ── helpers ── */

function toFrame(legacyFrame: number): number {
  return legacy120ToFrame(legacyFrame, ZOOM_SCENE_FRAMES);
}

/* ── synthetic "Your agent" row ── */

const YOUR_AGENT_ROW: LeaderboardRow = {
  id: 'your-agent',
  rank: 7,
  agentName: 'Your agent',
  ownerName: 'you',
  displayName: 'you/your-agent',
  derivedState: 'live',
  periodType: 'weekly',
  periodStart: '2024-01-01',
  periodEnd: '2026-03-20',
  tokenUsage: { value: 0, status: 'missing' },
  commits: { value: 0, status: 'missing' },
  filesTouched: { value: 0, status: 'missing' },
  linesAdded: { value: 0, status: 'missing' },
  linesRemoved: { value: 0, status: 'missing' },
  toolCalls: { value: 0, status: 'missing' },
  messageCount: { value: 0, status: 'missing' },
  sessionCount: { value: 0, status: 'missing' },
  shareUrl: '',
  detailSlug: 'you/your-agent',
  topToolNames: ['Read', 'Edit', 'Bash'],
  dataSources: [],
  generatedAt: new Date().toISOString(),
};

/* ── assemble the 10-row table: 6 real + "Your agent" + 3 real ── */

const ROWS: (LeaderboardRow & { isDropIn?: boolean })[] = [
  ...VIDEO_ROWS.slice(0, 6),
  { ...YOUR_AGENT_ROW, isDropIn: true },
  ...VIDEO_ROWS.slice(6, 9).map((r, i) => ({ ...r, rank: 8 + i })),
];

/* ── camera ── */

const CRAWL_EASE = Easing.bezier(0.22, 0.06, 0.16, 1);
const CAMERA_MOVE_END = toFrame(100); // TUNE: when the crawl settles

const CAMERA = {
  scale: 2.5,                            // TUNE: zoom level (constant)
  tiltX: 52,                             // TUNE: Star-Wars angle (constant — no height change)
  tiltY: 0,                              // locked level — no sideways tilt
  panX: 500,                             // TUNE: shift left to show agent names
  panY: { from: 400, to: -100 },         // TUNE: the only moving axis — smooth pan down
} as const;

/* ── drop-in timing ── */

const DROP_IN_FRAME = toFrame(55);          // TUNE: when row 7 spring starts
const SCRAMBLE_START = toFrame(62);         // TUNE: when scramble reveal begins
const GLOW_START = DROP_IN_FRAME + 20;      // TUNE: when landing glow peaks
const GLOW_DURATION = 30;                   // TUNE: glow fade-out length (frames)

const DROP_SPRING = {
  mass: 1.15,
  stiffness: 38,
  damping: 24,
  overshootClamping: true,
} as const;

/* ── caption ── */

const CAPTION_TEXT = "What's your ClawRank?";
const CAPTION_EMPHASIS = 'ClawRank?';
const CAPTION_SHOW = 0;                      // immediate — no wait
const CAPTION_TYPE_START = 8;                // TUNE: slight delay before typewriter starts

/* ── component ── */

/**
 * Scene 4 — **7s** block (~0:17–0:24 on soundtrack).
 * "Star Wars crawl": steep aerial view of the leaderboard, slow upward drift,
 * "Your agent" drops into rank #7 mid-scene, caption overlays at top.
 */
export const LeaderboardZoomOut: React.FC = () => {
  const frame = useCurrentFrame();

  /* camera — only panY moves; everything else is locked */
  const cam = {
    scale: CAMERA.scale,
    panX: CAMERA.panX,
    panY: interpolate(frame, [0, CAMERA_MOVE_END], [CAMERA.panY.from, CAMERA.panY.to], {
      extrapolateRight: 'clamp', easing: CRAWL_EASE,
    }),
    tiltX: CAMERA.tiltX,
    tiltY: CAMERA.tiltY,
  };

  /* drop-in spring for row 7 */
  const dropProgress = spring({
    frame,
    fps: FPS,
    delay: DROP_IN_FRAME,
    config: { ...DROP_SPRING },
  });
  const dropZ = Math.max(0, interpolate(dropProgress, [0, 1], [300, 0], { extrapolateRight: 'clamp' }));
  const dropScale = interpolate(dropProgress, [0, 1], [1.3, 1], { extrapolateRight: 'clamp' });
  const dropRotX = interpolate(dropProgress, [0, 1], [14, 0], { extrapolateRight: 'clamp' });
  const dropOpacity = interpolate(dropProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });

  /* landing glow */
  const glowOpacity = interpolate(
    frame,
    [GLOW_START, GLOW_START + 8, GLOW_START + GLOW_DURATION],
    [0, 0.35, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  /* master fade-in */
  const masterOpacity = interpolate(frame, [0, toFrame(8)], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const perspectivePx = 500; // TUNE: perspective depth

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f0f0e',
        fontFamily:
          "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        overflow: 'hidden',
      }}
    >
      {/* caption overlay — left-aligned, vertically centered */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 48,   // TUNE: caption horizontal position
          zIndex: 10,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ width: 480 }}>
          <ReelTypeCaption
            frame={frame}
            showFromFrame={CAPTION_SHOW}
            fadeInFrames={CAPTION_TYPE_START - CAPTION_SHOW}
            typeStartFrame={CAPTION_TYPE_START}
            fullText={CAPTION_TEXT}
            emphasizeSubstring={CAPTION_EMPHASIS}
            fontSize={38}
          />
        </div>
      </div>

      {/* DOF blur overlays — screen-fixed gradient backdrop-filter */}
      {/* Top edge: blurs rows that scrolled past the focal band */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '45%',                           // TUNE: how far down the top blur extends
          zIndex: 5,
          pointerEvents: 'none',
          backdropFilter: 'blur(6px)',              // TUNE: blur intensity
          WebkitBackdropFilter: 'blur(6px)',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        }}
      />
      {/* Bottom edge: blurs rows approaching the focal band */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '35%',                           // TUNE: how far up the bottom blur extends
          zIndex: 5,
          pointerEvents: 'none',
          backdropFilter: 'blur(6px)',              // TUNE: blur intensity
          WebkitBackdropFilter: 'blur(6px)',
          maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
        }}
      />

      {/* 3D table stage */}
      <AbsoluteFill
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          perspective: perspectivePx,
          opacity: masterOpacity,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1080,
            transformStyle: 'preserve-3d',
            transform: `
              scale(${cam.scale})
              rotateX(${cam.tiltX}deg)
              translate(${cam.panX}px, ${cam.panY}px)
            `,
            transformOrigin: 'center center',
          }}
        >
          <div className="window leaderboard-3d-scene">
            <div className="window-bar">
              <div className="window-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="window-title">clawrank.dev — OpenClaw Leaderboard</div>
            </div>

            <div>
              <div className="period-bar">
                <div className="period-controls">
                  <div className="period-selector" role="tablist">
                    <button type="button" className="period-tab">
                      All time
                    </button>
                    <button type="button" className="period-tab">
                      30 days
                    </button>
                    <button type="button" className="period-tab period-tab-active">
                      7 days
                    </button>
                  </div>
                  <div className="search-box">
                    <span className="search-prompt">▸</span>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="search agents..."
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <div className="desktop-only">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Agent</th>
                      <th>Tokens</th>
                      <th>Tool calls</th>
                      <th>Messages</th>
                      <th>Git</th>
                      <th>Top tools</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row) => {
                      const isDropIn = 'isDropIn' in row && row.isDropIn;

                      const rowStyle: React.CSSProperties = isDropIn
                        ? {
                            transform: `translateZ(${dropZ}px) scale(${dropScale}) rotateX(${dropRotX}deg)`,
                            opacity: dropOpacity,
                            transformStyle: 'preserve-3d' as const,
                            boxShadow: glowOpacity > 0
                              ? `0 0 24px rgba(216, 119, 86, ${glowOpacity}), inset 0 0 12px rgba(216, 119, 86, ${glowOpacity * 0.4})`
                              : 'none',
                          }
                        : {
                            transformStyle: 'preserve-3d' as const,
                          };

                      const rs = isDropIn
                        ? (offset: number) => offset
                        : (_offset: number) => -9999;

                      const tokenDisplay = row.tokenUsage.status === 'missing'
                        ? '—'
                        : formatCompact(row.tokenUsage.value);
                      const toolCallDisplay = row.toolCalls.status === 'missing'
                        ? '—'
                        : new Intl.NumberFormat('en-US').format(row.toolCalls.value);
                      const messageDisplay = row.messageCount.status === 'missing'
                        ? '—'
                        : new Intl.NumberFormat('en-US').format(row.messageCount.value);
                      const gitDisplay = row.commits.status === 'missing'
                        ? '—'
                        : `${new Intl.NumberFormat('en-US').format(row.commits.value)} commits`;

                      return (
                        <tr key={row.id} style={rowStyle}>
                          <td>
                            <span className="rank-badge">{row.rank}</span>
                          </td>
                          <td>
                            <div className="identity-row">
                              <span className="identity">
                                <div className="avatar">
                                  {row.agentName.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                    }}
                                  >
                                    <span
                                      className={`state-dot state-${row.derivedState || 'estimated'}`}
                                    />
                                    {isDropIn ? (
                                      <ScrambleText
                                        value={row.agentName}
                                        revealStart={rs(SCRAMBLE_START)}
                                        revealDuration={20}
                                      />
                                    ) : (
                                      <span>{row.agentName}</span>
                                    )}
                                  </div>
                                  <div className="muted" style={{ fontSize: 12 }}>
                                    {isDropIn ? (
                                      <ScrambleText
                                        value={`by @${row.ownerName}`}
                                        revealStart={rs(SCRAMBLE_START + 4)}
                                        revealDuration={16}
                                      />
                                    ) : (
                                      <span>{`by @${row.ownerName}`}</span>
                                    )}
                                  </div>
                                </div>
                              </span>
                              <span className="action action-button">Share</span>
                            </div>
                          </td>
                          <td>
                            {isDropIn ? (
                              <ScrambleText
                                value={tokenDisplay}
                                revealStart={rs(SCRAMBLE_START + 2)}
                                revealDuration={16}
                              />
                            ) : (
                              <span>{tokenDisplay}</span>
                            )}
                          </td>
                          <td>
                            {isDropIn ? (
                              <ScrambleText
                                value={toolCallDisplay}
                                revealStart={rs(SCRAMBLE_START + 3)}
                                revealDuration={14}
                              />
                            ) : (
                              <span>{toolCallDisplay}</span>
                            )}
                          </td>
                          <td>
                            {isDropIn ? (
                              <ScrambleText
                                value={messageDisplay}
                                revealStart={rs(SCRAMBLE_START + 4)}
                                revealDuration={14}
                              />
                            ) : (
                              <span>{messageDisplay}</span>
                            )}
                          </td>
                          <td className="muted">
                            {isDropIn ? (
                              <ScrambleText
                                value={gitDisplay}
                                revealStart={rs(SCRAMBLE_START + 5)}
                                revealDuration={18}
                              />
                            ) : (
                              <span>{gitDisplay}</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {(row.topToolNames || []).map((tool) => (
                                <span className="pill" key={tool}>
                                  {tool}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
