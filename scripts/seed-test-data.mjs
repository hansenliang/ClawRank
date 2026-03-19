/**
 * Seed 97 realistic test agents into the live ClawRank DB.
 * All test data is clearly marked for easy removal:
 *   - agents.bio starts with '[SEED]'
 *   - daily_agent_facts.source_adapter = 'seed-test-2026-03-18'
 *   - users.display_name starts with '[SEED]'
 * 
 * Cleanup:
 *   DELETE FROM daily_agent_facts WHERE source_adapter = 'seed-test-2026-03-18';
 *   DELETE FROM agents WHERE bio LIKE '[SEED]%';
 *   DELETE FROM users WHERE display_name LIKE '[SEED]%';
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }
const sql = neon(DATABASE_URL);

// ─── Realistic data pools ───────────────────────────────────────────────────

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Sam', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery',
  'Taylor', 'Blake', 'Drew', 'Jamie', 'Kai', 'Robin', 'Sage', 'Skyler',
  'Reese', 'Cameron', 'Dakota', 'Emery', 'Finley', 'Harper', 'Jessie',
  'Kennedy', 'Logan', 'Mason', 'Noah', 'Oakley', 'Parker', 'River',
  'Sawyer', 'Tatum', 'Val', 'Winter', 'Wren', 'Zion', 'Ash', 'Bay',
  'Cedar', 'Devon', 'Ellis', 'Flynn', 'Gray', 'Haven', 'Indigo', 'Jules',
  'Kit', 'Lake', 'Marlowe', 'Noel', 'Orion', 'Phoenix', 'Rain', 'Sterling',
  'Toby', 'Uri', 'West', 'Yael', 'Zephyr', 'Ari', 'Briar', 'Cruz',
  'Dax', 'Echo', 'Fox', 'Gage', 'Hollis', 'Ivory', 'Jett', 'Lark',
  'Micah', 'Nico', 'Onyx', 'Penn', 'Remy', 'Shea', 'Teal', 'Vale',
  'Xen', 'Yarrow', 'Zen', 'Atlas', 'Blaine', 'Cade', 'Dane', 'Eli',
  'Fern', 'Glen', 'Heath', 'Ivy', 'Jade', 'Koa', 'Lux', 'Mars',
  'Nyx', 'Pax', 'Ren', 'Sol', 'True',
];

const LAST_INITIALS = 'ABCDEFGHJKLMNPQRSTVWXYZ'.split('');

const AGENT_NAMES = [
  // Custom named agents (like people actually name them)
  'Jarvis', 'Friday', 'Atlas', 'Cortana', 'Nova', 'Beacon', 'Cipher',
  'Daedalus', 'Echo', 'Forge', 'Ghost', 'Helix', 'Iris', 'Juno',
  'Kestrel', 'Loom', 'Meridian', 'Nexus', 'Oracle', 'Prism',
  'Quantum', 'Raven', 'Sentinel', 'Titan', 'Umbra', 'Vortex', 'Wraith',
  'Zenith', 'Aether', 'Bolt', 'Chimera', 'Drift', 'Ember', 'Flux',
  'Glitch', 'Haze', 'Ion', 'Jinx', 'Karma', 'Lyra', 'Muse',
  'Nimbus', 'Opus', 'Pixel', 'Quasar', 'Ripple', 'Spark', 'Thorn',
  // Tool-default style names
  'Claude Dev', 'Cursor Agent', 'Copilot Assistant', 'Windsurf Bot',
  'Claude Code Main', 'DevBot', 'CodePilot', 'BuildAgent',
  'Main', 'Dev', 'Coder', 'Assistant', 'Agent', 'Helper',
  'Architect', 'Debugger', 'Deployer', 'Reviewer', 'Planner',
  // OpenClaw-style names
  'Clawdia', 'Pinchy', 'Snipper', 'Shelldon', 'Crusty',
  'Lobster Prime', 'Red Claw', 'Deep Claw', 'Iron Claw', 'Shadow Claw',
  'Claw Commander', 'The Lobster', 'Clawbot', 'Crawdad', 'Mantis',
  'Hermit', 'Coral', 'Barnacle', 'Tide', 'Reef',
];

const MODELS = [
  { name: 'claude-sonnet-4.5', weight: 25, costPerMTok: 9 },
  { name: 'claude-opus-4.5', weight: 10, costPerMTok: 40 },
  { name: 'claude-sonnet-4.6', weight: 15, costPerMTok: 9 },
  { name: 'claude-opus-4.6', weight: 5, costPerMTok: 30 },
  { name: 'claude-haiku-4.5', weight: 8, costPerMTok: 3 },
  { name: 'gpt-4o', weight: 12, costPerMTok: 7.5 },
  { name: 'gpt-5.4', weight: 5, costPerMTok: 10 },
  { name: 'gemini-2.5-pro', weight: 8, costPerMTok: 5 },
  { name: 'gemini-2.5-flash', weight: 5, costPerMTok: 1.5 },
  { name: 'deepseek-v3', weight: 4, costPerMTok: 1 },
  { name: 'codex-mini', weight: 3, costPerMTok: 3 },
];

const TOOLS = [
  'file_read', 'file_write', 'terminal', 'web_search', 'browser',
  'git_commit', 'git_push', 'code_edit', 'lint', 'test_run',
  'deploy', 'docker', 'ssh', 'database', 'api_call',
  'image_gen', 'screenshot', 'clipboard', 'calendar', 'email',
];

const BIOS = [
  'Full-stack dev shipping features at 3am',
  'Building the future one prompt at a time',
  'Indie hacker with too many side projects',
  'Senior engineer automating everything',
  'Open source contributor and AI enthusiast',
  'DevOps by day, vibe coder by night',
  'Startup founder moving fast',
  'Backend specialist with a frontend problem',
  'ML engineer who discovered agentic coding',
  'Solo dev shipping SaaS products',
  'Freelance developer building client apps',
  'Systems programmer exploring AI workflows',
  'Mobile dev transitioning to full-stack with AI',
  'Data engineer leveraging AI for pipelines',
  'Security researcher using AI for auditing',
  'Game developer scripting with AI agents',
  'Platform engineer automating infrastructure',
  'Tech lead scaling AI-assisted development',
  'Junior dev learning with AI pair programming',
  'Researcher building academic tools',
];

const X_HANDLES = [
  'alexcodes', 'devjordan_', 'sambuilds', 'casey_dev', 'morganAI',
  'rileyships', 'quinnhacks', 'avery_eng', 'taylordev', 'blaketerm',
  'drew_codes', 'jamierust', 'kai_builds', 'robin_dev', 'sage_ai',
  'skyler_ops', 'reese_dev', 'cam_codes', 'dakotadev', 'emery_ai',
  null, null, null, null, null, null, null, null, null, null, // many have no X handle
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function rng(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rng(0, arr.length - 1)]; }
function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) { r -= item.weight; if (r <= 0) return item; }
  return items[items.length - 1];
}

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

// Power-law-ish distribution for total tokens
// ~5 whales (10B-50B), ~15 heavy (1B-10B), ~30 medium (100M-1B), ~47 light (5M-100M)
function generateTotalTokens(rank) {
  if (rank <= 5) return rng(10_000_000_000, 50_000_000_000);
  if (rank <= 20) return rng(1_000_000_000, 10_000_000_000);
  if (rank <= 50) return rng(100_000_000, 1_000_000_000);
  return rng(5_000_000, 100_000_000);
}

function generateTopTools() {
  const count = rng(2, 5);
  const selected = [];
  const pool = [...TOOLS];
  for (let i = 0; i < count; i++) {
    const idx = rng(0, pool.length - 1);
    selected.push(pool.splice(idx, 1)[0]);
  }
  const obj = {};
  for (const tool of selected) {
    obj[tool] = rng(50, 5000);
  }
  return obj;
}

function generateModelsUsed(topModel) {
  const obj = {};
  obj[topModel] = rng(50, 80);
  // Add 1-2 secondary models
  const secondary = MODELS.filter(m => m.name !== topModel);
  const count = rng(1, 2);
  for (let i = 0; i < count; i++) {
    const m = pick(secondary);
    obj[m.name] = rng(5, 30);
  }
  return obj;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting seed of 97 test agents...');

  const usedNames = new Set();
  const usedAgentNames = new Set();
  const agents = [];

  for (let i = 0; i < 97; i++) {
    // Generate unique owner
    let firstName, username;
    do {
      firstName = pick(FIRST_NAMES);
      const lastInit = pick(LAST_INITIALS);
      username = `${firstName.toLowerCase()}${lastInit.toLowerCase()}`;
    } while (usedNames.has(username));
    usedNames.add(username);

    // Generate unique agent name
    let agentName;
    do {
      agentName = pick(AGENT_NAMES);
    } while (usedAgentNames.has(`${agentName}-${username}`));
    usedAgentNames.add(`${agentName}-${username}`);

    const slug = slugify(`${agentName}-by-${firstName}`);
    const totalTokens = generateTotalTokens(i + 1); // i+1 for rank-based distribution
    const model = pickWeighted(MODELS);
    const bio = pick(BIOS);
    const xHandle = pick(X_HANDLES);
    const daysActive = rng(7, 90);

    agents.push({
      firstName,
      username,
      agentName,
      slug,
      totalTokens,
      model,
      bio,
      xHandle,
      daysActive,
    });
  }

  // Sort by total tokens descending for realistic rank distribution
  agents.sort((a, b) => b.totalTokens - a.totalTokens);

  let created = 0;

  for (const agent of agents) {
    const now = new Date().toISOString();

    // 1. Create user
    const userRows = await sql`
      INSERT INTO users (display_name, username, avatar_url, created_at, updated_at)
      VALUES (${`[SEED] ${agent.firstName}`}, ${`seed-${agent.username}`}, ${null}, ${now}, ${now})
      RETURNING id
    `;
    const userId = userRows[0].id;

    // 2. Create agent
    const agentRows = await sql`
      INSERT INTO agents (user_id, slug, agent_name, owner_name, state, bio, x_handle, source_of_truth, created_at, updated_at, last_submission_at)
      VALUES (
        ${userId},
        ${agent.slug},
        ${agent.agentName},
        ${agent.firstName},
        ${'estimated'},
        ${`[SEED] ${agent.bio}`},
        ${agent.xHandle},
        ${'clawrank-seed'},
        ${now},
        ${now},
        ${now}
      )
      RETURNING id
    `;
    const agentId = agentRows[0].id;

    // 3. Generate daily facts
    // Distribute total tokens across active days
    const today = new Date('2026-03-18');
    const startOffset = rng(agent.daysActive, agent.daysActive + 30); // started N days ago
    let remainingTokens = agent.totalTokens;
    const factDates = [];

    // Pick random active days within the range
    const possibleDays = [];
    for (let d = 0; d < startOffset; d++) {
      possibleDays.push(d);
    }
    // Shuffle and pick daysActive
    for (let i = possibleDays.length - 1; i > 0; i--) {
      const j = rng(0, i);
      [possibleDays[i], possibleDays[j]] = [possibleDays[j], possibleDays[i]];
    }
    const activeDays = possibleDays.slice(0, agent.daysActive).sort((a, b) => a - b);

    for (let dayIdx = 0; dayIdx < activeDays.length; dayIdx++) {
      const daysAgo = activeDays[dayIdx];
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().slice(0, 10);

      // Distribute tokens with some variance
      let dayTokens;
      if (dayIdx === activeDays.length - 1) {
        dayTokens = remainingTokens;
      } else {
        const avgRemaining = remainingTokens / (activeDays.length - dayIdx);
        dayTokens = Math.max(1000, Math.floor(avgRemaining * (0.3 + Math.random() * 1.4)));
        dayTokens = Math.min(dayTokens, remainingTokens - (activeDays.length - dayIdx - 1) * 1000);
      }
      remainingTokens -= dayTokens;

      const inputTokens = Math.floor(dayTokens * (0.55 + Math.random() * 0.15));
      const outputTokens = dayTokens - inputTokens;
      const cacheReadTokens = Math.floor(inputTokens * (0.1 + Math.random() * 0.4));
      const cacheWriteTokens = Math.floor(inputTokens * (0.02 + Math.random() * 0.08));

      const sessionCount = Math.max(1, Math.floor(dayTokens / rng(500_000, 5_000_000)));
      const longestRunSeconds = rng(300, 14400); // 5min to 4hr
      const mostActiveHour = rng(8, 23);
      const estimatedCostUsd = (dayTokens / 1_000_000) * agent.model.costPerMTok;

      const userMessageCount = Math.max(1, Math.floor(sessionCount * rng(5, 30)));
      const assistantMessageCount = Math.floor(userMessageCount * (1.2 + Math.random() * 0.8));
      const toolCallCount = Math.floor(assistantMessageCount * (0.5 + Math.random() * 2));

      const topTools = generateTopTools();
      const modelsUsed = generateModelsUsed(agent.model.name);

      const commitCount = rng(0, Math.max(1, Math.floor(sessionCount * 0.5)));
      const linesAdded = rng(10, commitCount * 200 + 50);
      const linesRemoved = rng(5, Math.floor(linesAdded * 0.6));
      const prCount = rng(0, Math.max(0, Math.floor(commitCount * 0.3)));

      const topToolsJson = JSON.stringify(topTools);
      const modelsUsedJson = JSON.stringify(modelsUsed);

      await sql`
        INSERT INTO daily_agent_facts (
          agent_id, date, total_tokens, input_tokens, output_tokens,
          cache_read_tokens, cache_write_tokens, session_count, longest_run_seconds,
          most_active_hour, top_model, estimated_cost_usd,
          user_message_count, assistant_message_count, tool_call_count,
          top_tools, models_used,
          commit_count, lines_added, lines_removed, pr_count,
          source_type, source_adapter, date_precision,
          created_at, updated_at
        ) VALUES (
          ${agentId}, ${dateStr}::date, ${dayTokens}, ${inputTokens}, ${outputTokens},
          ${cacheReadTokens}, ${cacheWriteTokens}, ${sessionCount}, ${longestRunSeconds},
          ${mostActiveHour}, ${agent.model.name}, ${estimatedCostUsd.toFixed(4)},
          ${userMessageCount}, ${assistantMessageCount}, ${toolCallCount},
          ${topToolsJson}::jsonb, ${modelsUsedJson}::jsonb,
          ${commitCount}, ${linesAdded}, ${linesRemoved}, ${prCount},
          ${'manual'}, ${'seed-test-2026-03-18'}, ${'day'},
          ${now}, ${now}
        )
      `;

      factDates.push(dateStr);
    }

    created++;
    if (created % 10 === 0) {
      console.log(`  Created ${created}/97 agents (${agent.agentName} by ${agent.firstName}: ${(agent.totalTokens / 1e9).toFixed(2)}B tokens, ${activeDays.length} days)`);
    }
  }

  // Verify
  const countResult = await sql`SELECT COUNT(*) as cnt FROM agents`;
  const factCount = await sql`SELECT COUNT(*) as cnt FROM daily_agent_facts WHERE source_adapter = 'seed-test-2026-03-18'`;

  console.log(`\nDone! Total agents in DB: ${countResult[0].cnt}`);
  console.log(`Test facts inserted: ${factCount[0].cnt}`);
  console.log(`\nTo clean up later:`);
  console.log(`  DELETE FROM daily_agent_facts WHERE source_adapter = 'seed-test-2026-03-18';`);
  console.log(`  DELETE FROM agents WHERE bio LIKE '[SEED]%';`);
  console.log(`  DELETE FROM users WHERE display_name LIKE '[SEED]%';`);
}

main().catch(err => { console.error(err); process.exit(1); });
