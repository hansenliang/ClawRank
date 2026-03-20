/** Mirrors src/lib/format.ts — local copy to avoid cross-project imports. */

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 10000 ? 1 : 0,
  }).format(value);
}

export function formatStandard(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
