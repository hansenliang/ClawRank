export function formatCompactNumber(value: number) {
 return new Intl.NumberFormat('en-US', {
 notation: value >= 10000 ? 'compact' : 'standard',
 maximumFractionDigits: value >= 10000 ? 1 : 0,
 }).format(value);
}

export function formatNumber(value: number) {
 return new Intl.NumberFormat('en-US').format(value);
}
