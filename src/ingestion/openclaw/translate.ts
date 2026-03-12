import type { DailyAgentFactInput, DailyFactSubmission } from '@/src/contracts/clawrank-domain';
import type { OpenClawUsageMessage } from '@/src/adapters/openclaw/parser';

function slugify(value: string): string {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown-agent';
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

interface AgentBucket {
  agentKey: string;
  agentSlug: string;
  agentName: string;
  ownerName: string;
  factsByDate: Map<string, {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    estimatedCostUsd: number;
    sessions: Set<string>;
    sessionBounds: Map<string, { min: number; max: number }>;
    hours: Map<number, number>;
    modelTotals: Map<string, number>;
  }>;
}

export interface TranslateOpenClawOptions {
  ownerName?: string;
  agentNames?: Record<string, string>;
}

export function translateOpenClawToDailyFactSubmissions(
  messages: OpenClawUsageMessage[],
  options: TranslateOpenClawOptions = {},
): DailyFactSubmission[] {
  const ownerName = (options.ownerName || process.env.CLAWRANK_OWNER_NAME || 'Unknown Owner').trim();
  const buckets = new Map<string, AgentBucket>();

  for (const message of messages) {
    const agentName = options.agentNames?.[message.agentKey] || titleCase(message.agentKey);
    const agentSlug = slugify(agentName);
    const date = new Date(message.timestampMs).toISOString().slice(0, 10);
    const hour = new Date(message.timestampMs).getUTCHours();

    let bucket = buckets.get(message.agentKey);
    if (!bucket) {
      bucket = {
        agentKey: message.agentKey,
        agentSlug,
        agentName,
        ownerName,
        factsByDate: new Map(),
      };
      buckets.set(message.agentKey, bucket);
    }

    const fact = bucket.factsByDate.get(date) || {
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      estimatedCostUsd: 0,
      sessions: new Set<string>(),
      sessionBounds: new Map<string, { min: number; max: number }>(),
      hours: new Map<number, number>(),
      modelTotals: new Map<string, number>(),
    };

    fact.totalTokens += message.totalTokens;
    fact.inputTokens += message.inputTokens;
    fact.outputTokens += message.outputTokens;
    fact.cacheReadTokens += message.cacheReadTokens;
    fact.cacheWriteTokens += message.cacheWriteTokens;
    fact.estimatedCostUsd += message.estimatedCostUsd;
    fact.sessions.add(message.sessionId);
    fact.hours.set(hour, (fact.hours.get(hour) || 0) + message.totalTokens);
    fact.modelTotals.set(message.modelId, (fact.modelTotals.get(message.modelId) || 0) + message.totalTokens);

    const bounds = fact.sessionBounds.get(message.sessionId) || { min: message.timestampMs, max: message.timestampMs };
    bounds.min = Math.min(bounds.min, message.timestampMs);
    bounds.max = Math.max(bounds.max, message.timestampMs);
    fact.sessionBounds.set(message.sessionId, bounds);

    bucket.factsByDate.set(date, fact);
  }

  return [...buckets.values()].map((bucket) => {
    const facts: DailyAgentFactInput[] = [...bucket.factsByDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, fact]) => {
        const longestRunSeconds = [...fact.sessionBounds.values()].reduce((max, bounds) => {
          const seconds = Math.max(0, Math.round((bounds.max - bounds.min) / 1000));
          return Math.max(max, seconds);
        }, 0);

        const mostActiveHour = [...fact.hours.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? null;
        const topModel = [...fact.modelTotals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;

        return {
          date,
          totalTokens: fact.totalTokens,
          inputTokens: fact.inputTokens,
          outputTokens: fact.outputTokens,
          cacheReadTokens: fact.cacheReadTokens,
          cacheWriteTokens: fact.cacheWriteTokens,
          sessionCount: fact.sessions.size,
          longestRunSeconds,
          mostActiveHour,
          topModel,
          estimatedCostUsd: Number(fact.estimatedCostUsd.toFixed(4)),
          sourceType: 'skill',
          sourceAdapter: 'openclaw',
        };
      });

    return {
      agent: {
        slug: bucket.agentSlug,
        agentName: bucket.agentName,
        ownerName: bucket.ownerName,
        state: 'live',
        sourceOfTruth: 'skill',
      },
      facts,
    };
  });
}
