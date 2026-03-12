const path = require('path');
const fs = require('fs');

const indexPath = (process.env.OPENCLAW_SESSIONS_INDEX || '~/.openclaw/agents/main/sessions/sessions.json').replace(/^~\//, `${process.env.HOME}/`);
const repoPath = (process.env.CLAWRANK_REPO_PATH || '.').replace(/^~\//, `${process.env.HOME}/`);

const results = {
 sessionsIndex: { path: indexPath, exists: fs.existsSync(indexPath) },
 repoPath: { path: path.resolve(repoPath), exists: fs.existsSync(path.resolve(repoPath)) },
};

console.log(JSON.stringify(results, null, 2));
process.exit(results.sessionsIndex.exists && results.repoPath.exists ? 0 : 1);
