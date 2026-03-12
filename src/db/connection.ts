import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

/**
 * Returns a Neon serverless SQL tagged-template function.
 * Uses DATABASE_URL env var (set automatically by Vercel + Neon integration).
 * Returns null if DATABASE_URL is not configured (falls back to baked data).
 */
export function getSQL(): NeonQueryFunction<false, false> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  if (!_sql) {
    _sql = neon(url);
  }
  return _sql;
}

/**
 * Returns true if a live database connection is available.
 */
export function hasDB(): boolean {
  return !!process.env.DATABASE_URL;
}
