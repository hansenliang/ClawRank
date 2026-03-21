import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion';
import { VIDEO_ROWS } from '../video-rows';
import { ScrambleText } from '../components/ScrambleText';
import { formatCompact } from '../format';
import '../styles.css';

const FPS = 30;
const ROWS = VIDEO_ROWS.slice(0, 10);

/** Overdamped row landings: no bounce / no dip past the table plane in Z. */
const ROW_SPRING_CRUISE = {
  mass: 1.15,
  stiffness: 38,
  damping: 24,
  overshootClamping: true,
} as const;

const ROW_SPRING_HERO = {
  mass: 1.55,
  stiffness: 30,
  damping: 22,
  overshootClamping: true,
} as const;

export type LeaderboardCamera = {
  scale: number;
  panX: number;
  panY: number;
  tiltX: number;
  tiltY: number;
};

type LeaderboardTable3DProps = {
  camera: LeaderboardCamera;
  /** When false, rows/chrome are fully settled (beauty / zoom-out shot). */
  animateRows: boolean;
  /** Fade entire board in over first frames (close-up intro). */
  masterFadeIn?: boolean;
  showAmbientGlow?: boolean;
  /**
   * Apple-style assembly: hero row lands first under an extreme camera, chrome/period/header
   * stagger, then remaining rows drop in as the shot widens. Only used with `animateRows`.
   */
  cinematicAssembly?: boolean;
  /** Perspective on the 3D stage (px). Higher = flatter / less dramatic depth. */
  perspectivePx?: number;
};

export const LeaderboardTable3D: React.FC<LeaderboardTable3DProps> = ({
  camera,
  animateRows,
  masterFadeIn = true,
  showAmbientGlow = true,
  cinematicAssembly = false,
  perspectivePx = 600,
}) => {
  const frame = useCurrentFrame();

  const getRowSpring = (rowIndex: number) => {
    if (cinematicAssembly && animateRows) {
      if (rowIndex === 0) {
        const delay = 16;
        const progress = spring({
          frame,
          fps: FPS,
          delay,
          config: { ...ROW_SPRING_HERO },
        });
        const z = Math.max(
          0,
          interpolate(progress, [0, 1], [340, 0], { extrapolateRight: 'clamp' }),
        );
        const rowScale = interpolate(progress, [0, 1], [1.28, 1], {
          extrapolateRight: 'clamp',
        });
        const rotX = interpolate(progress, [0, 1], [24, 0], {
          extrapolateRight: 'clamp',
        });
        const opacity = interpolate(progress, [0, 0.32], [0, 1], {
          extrapolateRight: 'clamp',
        });
        return { z, scale: rowScale, rotX, opacity };
      }
      /** Tight cascade after hero row (was 76 + 12 per row). */
      const delay = 36 + (rowIndex - 1) * 5;
      const progress = spring({
        frame,
        fps: FPS,
        delay,
        config: { ...ROW_SPRING_CRUISE },
      });
      const z = Math.max(
        0,
        interpolate(progress, [0, 1], [220, 0], { extrapolateRight: 'clamp' }),
      );
      const rowScale = interpolate(progress, [0, 1], [1.22, 1], {
        extrapolateRight: 'clamp',
      });
      const rotX = interpolate(progress, [0, 1], [16, 0], {
        extrapolateRight: 'clamp',
      });
      const opacity = interpolate(progress, [0, 0.38], [0, 1], {
        extrapolateRight: 'clamp',
      });
      return { z, scale: rowScale, rotX, opacity };
    }

    const delay = 10 + rowIndex * 8;
    const progress = spring({
      frame,
      fps: FPS,
      config: { ...ROW_SPRING_CRUISE },
      delay,
    });
    const z = Math.max(
      0,
      interpolate(progress, [0, 1], [200, 0], { extrapolateRight: 'clamp' }),
    );
    const rowScale = interpolate(progress, [0, 1], [1.3, 1], {
      extrapolateRight: 'clamp',
    });
    const rotX = interpolate(progress, [0, 1], [18, 0], {
      extrapolateRight: 'clamp',
    });
    const opacity = interpolate(progress, [0, 0.4], [0, 1], {
      extrapolateRight: 'clamp',
    });
    return { z, scale: rowScale, rotX, opacity };
  };

  const settled = { z: 0, scale: 1, rotX: 0, opacity: 1 };

  const chromeDelay = cinematicAssembly && animateRows ? 4 : 0;
  const chromeSpring = spring({
    frame,
    fps: FPS,
    delay: chromeDelay,
    config: cinematicAssembly && animateRows
      ? { mass: 0.75, stiffness: 72, damping: 15 }
      : { mass: 0.6, stiffness: 100, damping: 14 },
  });
  const chromeY = animateRows ? interpolate(chromeSpring, [0, 1], [-20, 0]) : 0;
  const chromeOpacity = animateRows
    ? interpolate(chromeSpring, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' })
    : 1;

  const periodDelay =
    cinematicAssembly && animateRows ? 38 : 6;
  const periodSpring = spring({
    frame,
    fps: FPS,
    delay: periodDelay,
    config: cinematicAssembly && animateRows
      ? { mass: 0.7, stiffness: 64, damping: 15 }
      : { mass: 0.6, stiffness: 90, damping: 14 },
  });
  const periodX = animateRows ? interpolate(periodSpring, [0, 1], [-50, 0]) : 0;
  const periodOpacity = animateRows
    ? interpolate(periodSpring, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' })
    : 1;

  const headerOpacity = animateRows
    ? interpolate(
        spring(
          cinematicAssembly
            ? {
                frame,
                fps: FPS,
                delay: 64,
                config: { mass: 0.55, stiffness: 88, damping: 16 },
              }
            : { frame, fps: FPS, delay: 12, config: { damping: 16 } },
        ),
        [0, 0.5],
        [0, 1],
        { extrapolateRight: 'clamp' },
      )
    : 1;

  const glowOpacity = showAmbientGlow
    ? interpolate(
        frame,
        cinematicAssembly ? [0, 52] : [0, 40],
        [0, 0.7],
        { extrapolateRight: 'clamp' },
      )
    : 0;

  const masterOpacity = masterFadeIn
    ? interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' })
    : 1;

  const { scale, panX, panY, tiltX, tiltY } = camera;

  return (
    <>
      {showAmbientGlow && (
        <div
          style={{
            position: 'absolute',
            left: '35%',
            top: '30%',
            width: '55%',
            height: '50%',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(216, 119, 86, 0.12), transparent 70%)',
            filter: 'blur(40px)',
            opacity: glowOpacity,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      )}
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
            maxWidth: 900,
            transformStyle: 'preserve-3d',
            transform: `
              scale(${scale})
              translate(${panX}px, ${panY}px)
              rotateX(${tiltX}deg)
              rotateY(${tiltY}deg)
            `,
            transformOrigin: 'center center',
          }}
        >
          <div className="window leaderboard-3d-scene">
            <div
              className="window-bar"
              style={{
                transform: `translateY(${chromeY}px)`,
                opacity: chromeOpacity,
              }}
            >
              <div className="window-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="window-title">clawrank.dev — OpenClaw Leaderboard</div>
            </div>

            <div
              style={{
                transform: `translateX(${periodX}px)`,
                opacity: periodOpacity,
              }}
            >
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
                    <tr style={{ opacity: headerOpacity }}>
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
                    {ROWS.map((row, index) => {
                      const drop = animateRows ? getRowSpring(index) : settled;
                      const revealStart = cinematicAssembly
                        ? index === 0
                          ? 26
                          : 40 + (index - 1) * 5
                        : 10 + index * 8 + 10;
                      /** Zoom-out beat: show final copy immediately (no scramble over the move). */
                      const rs = (offset: number) =>
                        animateRows ? offset : offset - 120;
                      return (
                        <tr
                          key={row.id}
                          style={{
                            transform: `translateZ(${drop.z}px) scale(${drop.scale}) rotateX(${drop.rotX}deg)`,
                            opacity: drop.opacity,
                            transformStyle: 'preserve-3d',
                          }}
                        >
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
                                    <ScrambleText
                                      value={row.agentName}
                                      revealStart={rs(revealStart)}
                                      revealDuration={18}
                                    />
                                  </div>
                                  <div className="muted" style={{ fontSize: 12 }}>
                                    <ScrambleText
                                      value={`by @${row.ownerName}`}
                                      revealStart={rs(revealStart + 4)}
                                      revealDuration={14}
                                    />
                                  </div>
                                </div>
                              </span>
                              <span className="action action-button">Share</span>
                            </div>
                          </td>
                          <td>
                            <ScrambleText
                              value={formatCompact(row.tokenUsage.value)}
                              revealStart={rs(revealStart + 2)}
                              revealDuration={16}
                            />
                          </td>
                          <td>
                            <ScrambleText
                              value={new Intl.NumberFormat('en-US').format(
                                row.toolCalls.value,
                              )}
                              revealStart={rs(revealStart + 3)}
                              revealDuration={14}
                            />
                          </td>
                          <td>
                            <ScrambleText
                              value={new Intl.NumberFormat('en-US').format(
                                row.messageCount.value,
                              )}
                              revealStart={rs(revealStart + 4)}
                              revealDuration={14}
                            />
                          </td>
                          <td className="muted">
                            <ScrambleText
                              value={`${new Intl.NumberFormat('en-US').format(row.commits.value)} commits`}
                              revealStart={rs(revealStart + 5)}
                              revealDuration={18}
                            />
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
    </>
  );
};
