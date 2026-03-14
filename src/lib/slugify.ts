/**
 * Slug and username allocation utilities.
 * Used by both DB-backed and JSON-store code paths.
 */

/** Convert a string to a URL-safe lowercase slug. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Allocate a unique username in the Postgres DB.
 * Tries base, then base-2 ... base-99.
 * Throws if all are taken (extremely unlikely in practice).
 */
export async function allocateUsername(baseHandle: string): Promise<string> {
  const { getSQL } = await import('@/src/db/connection');
  const sql = getSQL();
  if (!sql) throw new Error('DATABASE_URL not configured');

  const base = slugify(baseHandle) || 'user';

  const rows = await sql`SELECT 1 FROM users WHERE username = ${base} LIMIT 1`;
  if (!rows.length) return base;

  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`;
    const rows2 = await sql`SELECT 1 FROM users WHERE username = ${candidate} LIMIT 1`;
    if (!rows2.length) return candidate;
  }

  throw new Error(`Could not allocate unique username for: ${baseHandle}`);
}

/**
 * Allocate a unique username from an in-memory list.
 * Used by the JSON store (no DB available).
 */
export function allocateUsernameSync(baseHandle: string, existingUsernames: string[]): string {
  const base = slugify(baseHandle) || 'user';
  if (!existingUsernames.includes(base)) return base;

  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`;
    if (!existingUsernames.includes(candidate)) return candidate;
  }

  throw new Error(`Could not allocate unique username for: ${baseHandle}`);
}
