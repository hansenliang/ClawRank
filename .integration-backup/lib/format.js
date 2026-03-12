export function formatCompactNumber(value) {
 return new Intl.NumberFormat('en-US', {
 notation: value >= 10000 ? 'compact' : 'standard',
 maximumFractionDigits: value >= 10000 ? 1 : 0,
 }).format(value || 0);
}

export function formatNumber(value) {
 return new Intl.NumberFormat('en-US').format(value || 0);
}

export function formatPeriodLabel(start, end) {
 const startDate = new Date(start);
 const endDate = new Date(end);
 const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
 return `${formatter.format(startDate)}–${formatter.format(endDate)}`;
}
