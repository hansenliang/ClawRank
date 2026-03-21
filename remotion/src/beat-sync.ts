/**
 * **Soundtrack-locked** timeline + **130 BPM** helpers.
 *
 * Audio length **`SOUNDTRACK_DURATION_SEC`** @ **30fps** → **`SIZZLE_TOTAL_FRAMES`** (`Math.round(sec×fps)`).
 * **`FIRST_BEAT_AT_SEC`** → master hard-cut to **`LeaderboardCloseup`** at **`LEADERBOARD_CLOSEUP_START_FRAMES`**.
 * **`SOUNDTRACK_HOOK_PREFIX_SEC`** — extra lead-in baked into the final MP3; **`FIRST_BEAT_AT_SEC`** and **`MASTER_HOOK_GRID_FRAMES`** both include it so Hook is longer and later scenes shift together (beats stay aligned).
 * **`MASTER_HOOK_GRID_FRAMES`** (default **3s** + prefix) keeps **detail / zoom / CTA** on the musical grid; extra time before the grid end is **postroll** on the close-up clip.
 *
 * **Tweak shot lengths (master + Studio):** edit **`CLOSEUP_SCENE_FRAMES`**, **`DETAIL_SCENE_FRAMES`**,
 * **`ZOOM_SCENE_FRAMES`** below. **`CTA_DURATION_FRAMES`** shrinks/grows so the total stays **`SIZZLE_TOTAL_FRAMES`**.
 * **`legacy120ToFrame(n, sceneFrames)`** must use the same length as the comp you’re in (detail vs zoom).
 *
 * **130 BPM** reference (full track): duration×130/60 beats (~**18.4 bars** in 4/4 at ~34.1s).
 */

export const BPM = 130;
export const REMOTION_FPS = 30;

/**
 * Lead-in on the mastered file (vs the shorter edit). Shifts Hook + **`MASTER_HOOK_GRID`** together;
 * per-scene lengths and CTA tail unchanged — only start times move.
 */
export const SOUNDTRACK_HOOK_PREFIX_SEC = 1.84;

/** Musical body length before the file was extended (reference only). */
export const SOUNDTRACK_CORE_SEC = 32.256;

/**
 * Master audio length (seconds) — match `remotion/public/` MP3 (`afinfo` / `ffprobe`).
 * Final master = core **32.256s** + prefix **1.846s** → **34.102s** → **1023f** @ 30fps.
 */
export const SOUNDTRACK_DURATION_SEC =
  SOUNDTRACK_CORE_SEC + SOUNDTRACK_HOOK_PREFIX_SEC;

/** Served from `remotion/public/`; reference with `staticFile(SIZZLE_AUDIO_PUBLIC_FILE)`. */
export const SIZZLE_AUDIO_PUBLIC_FILE = 'ghost-in-the-kernel-edit.mp3';

/** First downbeat in the core edit was **2.1s**; on the extended file timeline = **2.1 + prefix**. */
export const FIRST_BEAT_AT_SEC = 2.1 + SOUNDTRACK_HOOK_PREFIX_SEC;

export function secToFrames(seconds: number): number {
  return Math.round(seconds * REMOTION_FPS);
}

/** Master `SizzleReel` duration — matches soundtrack. */
export const SIZZLE_TOTAL_FRAMES = secToFrames(SOUNDTRACK_DURATION_SEC);

/** Close-up cut on the master — same as Hook end / Hook composition length. */
export const LEADERBOARD_CLOSEUP_START_FRAMES = secToFrames(FIRST_BEAT_AT_SEC);

/**
 * Timeline anchor before detail — **3s** from file start on the old edit; add **`SOUNDTRACK_HOOK_PREFIX_SEC`**
 * so detail / zoom / CTA still hit the same musical points after a longer Hook.
 */
export const MASTER_HOOK_GRID_FRAMES = secToFrames(
  3 + SOUNDTRACK_HOOK_PREFIX_SEC,
);

/** Hook only — ends when LeaderboardCloseup cuts in. */
export const HOOK_DURATION_FRAMES = LEADERBOARD_CLOSEUP_START_FRAMES;

/** Hold final close-up frame after content so detail still starts at `MASTER_HOOK_GRID_FRAMES + CLOSEUP_SCENE_FRAMES`. */
export const CLOSEUP_POSTROLL_FRAMES = Math.max(
  0,
  MASTER_HOOK_GRID_FRAMES - LEADERBOARD_CLOSEUP_START_FRAMES,
);

const DEFAULT_SEVEN_SEC = secToFrames(7.38);

/**
 * Per-shot durations in the master (frames @ 30fps).
 * Nudge **DETAIL** / **ZOOM** here if those beats feel short; **CTA** absorbs the difference.
 */
export const CLOSEUP_SCENE_FRAMES = DEFAULT_SEVEN_SEC;
export const DETAIL_SCENE_FRAMES = DEFAULT_SEVEN_SEC;
export const ZOOM_SCENE_FRAMES = DEFAULT_SEVEN_SEC;

/** LeaderboardCloseup clip length on `SizzleReel` (scene content + postroll). */
export const CLOSEUP_MASTER_DURATION_FRAMES =
  CLOSEUP_SCENE_FRAMES + CLOSEUP_POSTROLL_FRAMES;

/** Remainder of soundtrack — do not set by hand unless you rebalance the sum to `SIZZLE_TOTAL_FRAMES`. */
export const CTA_DURATION_FRAMES =
  SIZZLE_TOTAL_FRAMES -
  MASTER_HOOK_GRID_FRAMES -
  CLOSEUP_SCENE_FRAMES -
  DETAIL_SCENE_FRAMES -
  ZOOM_SCENE_FRAMES;

const R = REMOTION_FPS * 60;

/** Frames from an arbitrary “beat 0” to downbeat index `b` (130 BPM). */
export function beatToFrame(b: number): number {
  return Math.round(b * (R / BPM));
}

export const FRAMES_PER_BEAT = R / BPM;

/** Integer frames per beat — cursor blink, micro-motion. */
export const FRAMES_PER_BEAT_INT = beatToFrame(1) - beatToFrame(0);

/** Master uses hard cuts (no overlap) so scene starts match wall-clock. */
export const CROSSFADE_FRAMES = 0;

/** @deprecated Use `CLOSEUP_SCENE_FRAMES`. */
export const STANDARD_SCENE_FRAMES = CLOSEUP_SCENE_FRAMES;

/** @deprecated Use scene-specific constants. */
export const SCENE_DURATION_FRAMES = CLOSEUP_SCENE_FRAMES;

const LEGACY_CLOSEUP_FRAMES = 180;

/** Stretch old 180f close-up keys onto the current close-up comp length. */
export function closeupLegacyToFrame(legacyFrame: number): number {
  const f = Math.round(
    (legacyFrame / LEGACY_CLOSEUP_FRAMES) * CLOSEUP_SCENE_FRAMES,
  );
  return Math.min(CLOSEUP_SCENE_FRAMES - 1, Math.max(0, f));
}

const LEGACY_120_FRAMES = 120;

/**
 * Stretch old 120f scene keys onto the **current** detail or zoom comp length.
 * Pass **`DETAIL_SCENE_FRAMES`** or **`ZOOM_SCENE_FRAMES`** (or `useVideoConfig().durationInFrames`).
 */
export function legacy120ToFrame(
  legacyFrame: number,
  targetSceneFrames: number,
): number {
  const f = Math.round(
    (legacyFrame / LEGACY_120_FRAMES) * targetSceneFrames,
  );
  return Math.min(targetSceneFrames - 1, Math.max(0, f));
}
