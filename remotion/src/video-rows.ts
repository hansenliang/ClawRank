import { MOCK_ROWS } from './mock-data';
import type { LeaderboardRow } from './types';
import { BAKED_VIDEO_ROWS } from './video-leaderboard.generated';

/**
 * Production-backed rows when `pnpm remotion:bake-data` has been run; otherwise mock data.
 */
export const VIDEO_ROWS: LeaderboardRow[] =
  BAKED_VIDEO_ROWS.length > 0 ? BAKED_VIDEO_ROWS : MOCK_ROWS;
