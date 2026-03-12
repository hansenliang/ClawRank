import path from 'path';
import os from 'os';

export function expandHome(input) {
  if (!input) return input;
  return input.startsWith('~/') ? path.join(os.homedir(), input.slice(2)) : input;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'http://localhost:3000';
}

export function getSessionsIndexPath() {
  return expandHome(process.env.OPENCLAW_SESSIONS_INDEX || '~/.openclaw/agents/main/sessions/sessions.json');
}

export function getRepoPath() {
  return expandHome(process.env.CLAWRANK_REPO_PATH || process.cwd());
}

export function getOwnerName() {
  return process.env.CLAWRANK_OWNER_NAME || 'Hansen';
}
