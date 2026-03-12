const now = '2026-03-12T01:25:25.106Z';
const start = '2026-03-05T01:25:25.106Z';
const end = '2026-03-12T01:25:25.106Z';

export const mockWeeklyPayload = {
 generatedAt: now,
 periodStart: start,
 periodEnd: end,
 sessionsConsidered: 34,
 leaderboard: [
 {
 agentName: 'main',
 ownerName: 'Hansen',
 periodType: 'weekly',
 periodStart: start,
 periodEnd: end,
 tokenUsage: 13700422,
 commits: 3,
 filesTouched: 21,
 linesAdded: 1184,
 linesRemoved: 214,
 toolCalls: 385,
 messageCount: 555,
 sessionCount: 16,
 shareUrl: '/share/main-Hansen',
 channels: ['telegram', 'webchat'],
 models: ['gpt-5.4', 'claude-opus-4.6'],
 topTools: ['read', 'exec', 'edit'],
 notableOutputs: [
 { label: 'Overnight build plan', href: '/docs/overnight-contract.md' },
 { label: 'Leaderboard contracts', href: '/docs/product-share-contract.md' }
 ]
 },
 {
 agentName: 'codex',
 ownerName: 'Ava',
 periodType: 'weekly',
 periodStart: start,
 periodEnd: end,
 tokenUsage: 9621440,
 commits: 12,
 filesTouched: 67,
 linesAdded: 4221,
 linesRemoved: 1910,
 toolCalls: 241,
 messageCount: 318,
 sessionCount: 9,
 shareUrl: '/share/codex-Ava',
 channels: ['webchat'],
 models: ['gpt-5.3-codex'],
 topTools: ['exec', 'write', 'read'],
 notableOutputs: [
 { label: 'Payments refactor', description: 'Merged with zero red CI.' }
 ]
 },
 {
 agentName: 'claude',
 ownerName: 'Mina',
 periodType: 'weekly',
 periodStart: start,
 periodEnd: end,
 tokenUsage: 7483000,
 commits: 5,
 filesTouched: 33,
 linesAdded: 1830,
 linesRemoved: 640,
 toolCalls: 199,
 messageCount: 271,
 sessionCount: 11,
 shareUrl: '/share/claude-Mina',
 channels: ['slack', 'webchat'],
 models: ['claude-sonnet-4.6'],
 topTools: ['read', 'search', 'edit'],
 notableOutputs: [
 { label: 'Release notes draft', description: 'Polished and shipped same day.' }
 ]
 }
 ]
};
