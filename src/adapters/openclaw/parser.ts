import fs from 'fs';
import path from 'path';
import { expandHomePath } from '@/src/lib/paths';

export interface OpenClawUsageMessage {
 agentKey: string;
 sessionKey: string;
 sessionId: string;
 timestampMs: number;
 modelId: string;
 providerId: string;
 inputTokens: number;
 outputTokens: number;
 cacheReadTokens: number;
 cacheWriteTokens: number;
 totalTokens: number;
 estimatedCostUsd: number;
}

interface SessionIndexEntry {
 sessionId?: string;
 sessionFile?: string;
}

interface RawOpenClawEntry {
 type?: string;
 timestamp?: string;
 modelId?: string;
 provider?: string;
 message?: {
 role?: string;
 timestamp?: number;
 usage?: {
 input?: number;
 output?: number;
 cacheRead?: number;
 cacheWrite?: number;
 totalTokens?: number;
 cost?: {
 total?: number;
 };
 };
 };
}

function parseSessionKey(sessionKey: string): { agentKey: string } {
 const parts = String(sessionKey || '').split(':');
 return {
 agentKey: parts[1] || 'unknown-agent',
 };
}

function resolveSessionPath(indexPath: string, entry: SessionIndexEntry): string {
 const indexDir = path.dirname(indexPath);
 const rawSessionFile = expandHomePath(String(entry.sessionFile || '').trim());

 if (rawSessionFile) {
 if (path.isAbsolute(rawSessionFile)) return rawSessionFile;
 return path.join(indexDir, rawSessionFile);
 }

 return path.join(indexDir, `${entry.sessionId || 'unknown'}.jsonl`);
}

function safeReadJsonLines(filePath: string): RawOpenClawEntry[] {
 if (!fs.existsSync(filePath)) return [];
 const lines = fs.readFileSync(filePath, 'utf8').split('\n');
 const parsed: RawOpenClawEntry[] = [];

 for (const line of lines) {
 const trimmed = line.trim();
 if (!trimmed) continue;
 try {
 parsed.push(JSON.parse(trimmed) as RawOpenClawEntry);
 } catch (error) {
 console.error(`OpenClaw adapter: failed to parse JSONL line in ${filePath}:`, error);
 }
 }

 return parsed;
}

function parseTranscript(sessionPath: string, sessionKey: string, sessionId: string): OpenClawUsageMessage[] {
 const { agentKey } = parseSessionKey(sessionKey);
 const entries = safeReadJsonLines(sessionPath);
 const fileMtimeMs = fs.existsSync(sessionPath) ? fs.statSync(sessionPath).mtimeMs : 0;

 let currentModelId = '';
 let currentProviderId = 'unknown';
 const messages: OpenClawUsageMessage[] = [];

 for (const entry of entries) {
 if (entry.type === 'model_change') {
 if (entry.modelId) currentModelId = entry.modelId;
 if (entry.provider) currentProviderId = entry.provider;
 continue;
 }

 if (entry.type !== 'message') continue;
 const message = entry.message;
 if (!message || message.role !== 'assistant' || !message.usage || !currentModelId) continue;

 const inputTokens = Math.max(0, Number(message.usage.input || 0));
 const outputTokens = Math.max(0, Number(message.usage.output || 0));
 const cacheReadTokens = Math.max(0, Number(message.usage.cacheRead || 0));
 const cacheWriteTokens = Math.max(0, Number(message.usage.cacheWrite || 0));
 const totalTokens = Math.max(
 inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens,
 Number(message.usage.totalTokens || 0),
 );
 const estimatedCostUsd = Math.max(0, Number(message.usage.cost?.total || 0));
 const timestampMs = Number(message.timestamp || Date.parse(entry.timestamp || '') || fileMtimeMs || 0);

 if (!timestampMs) continue;

 messages.push({
 agentKey,
 sessionKey,
 sessionId,
 timestampMs,
 modelId: currentModelId,
 providerId: currentProviderId || 'unknown',
 inputTokens,
 outputTokens,
 cacheReadTokens,
 cacheWriteTokens,
 totalTokens,
 estimatedCostUsd,
 });
 }

 return messages;
}

export function loadOpenClawUsageMessages(indexPath: string): OpenClawUsageMessage[] {
 const resolvedIndexPath = expandHomePath(indexPath);
 if (!resolvedIndexPath || !fs.existsSync(resolvedIndexPath)) {
 throw new Error(`OpenClaw sessions index not found: ${resolvedIndexPath || indexPath}`);
 }

 const index = JSON.parse(fs.readFileSync(resolvedIndexPath, 'utf8')) as Record<string, SessionIndexEntry>;
 const messages: OpenClawUsageMessage[] = [];

 for (const [sessionKey, entry] of Object.entries(index)) {
 const sessionId = String(entry.sessionId || '').trim();
 if (!sessionId) continue;

 const sessionPath = resolveSessionPath(resolvedIndexPath, entry);
 if (!fs.existsSync(sessionPath)) continue;
 messages.push(...parseTranscript(sessionPath, sessionKey, sessionId));
 }

 return messages.sort((a, b) => a.timestampMs - b.timestampMs);
}
