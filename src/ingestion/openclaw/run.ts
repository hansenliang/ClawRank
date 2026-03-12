import type { IngestOpenClawResult } from '@/src/contracts/clawrank-domain';
import { loadOpenClawUsageMessages } from '@/src/adapters/openclaw/parser';
import { getStorePath, readStore, submitDailyFactSubmission, writeStore } from '@/src/domain/clawrank-store';
import { translateOpenClawToDailyFactSubmissions } from '@/src/ingestion/openclaw/translate';

export interface RunOpenClawPilotOptions {
  indexPath?: string;
  ownerName?: string;
  agentNames?: Record<string, string>;
}

export function runOpenClawPilotIngestion(options: RunOpenClawPilotOptions = {}): IngestOpenClawResult {
  const indexPath = options.indexPath || process.env.OPENCLAW_SESSIONS_INDEX || '';
  const storePath = getStorePath();
  const messages = loadOpenClawUsageMessages(indexPath);
  const submissions = translateOpenClawToDailyFactSubmissions(messages, {
    ownerName: options.ownerName,
    agentNames: options.agentNames,
  });

  const store = readStore(storePath);
  let upsertedFacts = 0;
  const agentSlugs: string[] = [];

  for (const submission of submissions) {
    const result = submitDailyFactSubmission(store, submission);
    upsertedFacts += result.upsertedFacts;
    agentSlugs.push(result.agent.slug);
  }

  writeStore(store, storePath);

  return {
    indexPath,
    parsedMessages: messages.length,
    translatedFacts: submissions.reduce((sum, submission) => sum + submission.facts.length, 0),
    agentCount: submissions.length,
    upsertedFacts,
    agentSlugs,
    storePath,
  };
}
