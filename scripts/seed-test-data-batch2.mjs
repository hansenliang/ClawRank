/**
 * Seed remaining test agents (batch 2). Same marking conventions.
 * Uses fewer, larger INSERT batches for speed.
 */
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }
const sql = neon(DATABASE_URL);

const EXISTING_USERNAMES = new Set([
  'seed-alexc','seed-ashr','seed-caseyc','seed-caseys','seed-cruzm','seed-dakotah',
  'seed-daxd','seed-devonf','seed-echoa','seed-echof','seed-echox','seed-ellisa',
  'seed-ellisc','seed-ellism','seed-emeryv','seed-foxp','seed-gagek','seed-gagel',
  'seed-glent','seed-glenw','seed-grayn','seed-grayz','seed-heathy','seed-ivyn',
  'seed-jamiec','seed-jessiez','seed-jettz','seed-jordanh','seed-kennedys','seed-kitm',
  'seed-larkj','seed-loganj','seed-luxk','seed-marlowef','seed-marlowem','seed-marst',
  'seed-masonv','seed-micaha','seed-noeld','seed-onyxc','seed-penns','seed-quinnh',
  'seed-remym','seed-remyn','seed-rileyh','seed-rileyp','seed-riverz','seed-robinj',
  'seed-same','seed-solb','seed-tatumy','seed-teala','seed-vals','seed-winterk',
  'seed-xene','seed-xenj','seed-yarrows','seed-zionp','seed-zionz',
]);

const FIRST_NAMES = [
  'Aria','Brock','Caleb','Demi','Ethan','Faye','Grant','Holly',
  'Isaac','Jada','Kyle','Luna','Miles','Nina','Otto','Petra',
  'Rory','Suki','Theo','Uma','Vera','Wade','Xia','Yuki',
  'Zara','Axel','Bianca','Clark','Dion','Eve','Felix','Gwen',
  'Hank','Iris','Jack','Kira','Leo','Mira','Nate','Olive',
];
const LAST_INITIALS = 'ABCDEFGHJKLMNPQRSTVWXYZ'.split('');

const AGENT_NAMES = [
  'Spectre','Phantom','Warden','Nomad','Scout','Saber','Lance','Bishop',
  'Sterling','Aegis','Bastion','Crucible','Dynamo','Flare','Grit','Harbinger',
  'Impulse','Keystone','Matrix','Onyx','Paladin','Raptor','Strider','Turbo',
  'Vanguard','Watcher','Zephyr','Axiom','Blitz','Chronicle','Defiant',
  'Enigma','Fury','Glacier','Horizon','Inferno','Javelin','Kinetic','Monsoon',
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
  'file_read','file_write','terminal','web_search','browser',
  'git_commit','git_push','code_edit','lint','test_run',
  'deploy','docker','ssh','database','api_call',
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
  'Solo dev shipping SaaS products',
  'Freelance developer building client apps',
  'Platform engineer automating infrastructure',
  'Tech lead scaling AI-assisted development',
];

function rng(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rng(0, arr.length - 1)]; }
function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) { r -= item.weight; if (r <= 0) return item; }
  return items[items.length - 1];
}
function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function generateTopTools() {
  const count = rng(2, 4);
  const pool = [...TOOLS];
  const obj = {};
  for (let i = 0; i < count; i++) {
    const idx = rng(0, pool.length - 1);
    obj[pool.splice(idx, 1)[0]] = rng(50, 3000);
  }
  return obj;
}

// Need 38 more agents. Rank them from 60-97 for token ranges.
async function main() {
  const NEEDED = 38;
  console.log(`Seeding ${NEEDED} more agents...`);

  for (let i = 0; i < NEEDED; i++) {
    const rank = 60 + i; // continuing from where batch 1 left off
    let firstName, username;
    do {
      firstName = pick(FIRST_NAMES);
      const lastInit = pick(LAST_INITIALS);
      username = `seed-${firstName.toLowerCase()}${lastInit.toLowerCase()}`;
    } while (EXISTING_USERNAMES.has(username));
    EXISTING_USERNAMES.add(username);

    const agentName = AGENT_NAMES[i % AGENT_NAMES.length];
    const slug = slugify(`${agentName}-by-${firstName}`);
    const model = pickWeighted(MODELS);
    const bio = pick(BIOS);

    // Token range for ranks 60-97: mix of medium and light
    let totalTokens;
    if (rank <= 65) totalTokens = rng(80_000_000, 200_000_000);
    else if (rank <= 80) totalTokens = rng(20_000_000, 80_000_000);
    else totalTokens = rng(5_000_000, 25_000_000);

    const daysActive = rng(5, 60);
    const now = new Date().toISOString();

    // Create user
    const userRows = await sql`
      INSERT INTO users (display_name, username, avatar_url, created_at, updated_at)
      VALUES (${`[SEED] ${firstName}`}, ${username}, ${null}, ${now}, ${now})
      RETURNING id
    `;
    const userId = userRows[0].id;

    // Create agent
    const agentRows = await sql`
      INSERT INTO agents (user_id, slug, agent_name, owner_name, state, bio, x_handle, source_of_truth, created_at, updated_at, last_submission_at)
      VALUES (${userId}, ${slug}, ${agentName}, ${firstName}, ${'estimated'}, ${`[SEED] ${bio}`}, ${null}, ${'clawrank-seed'}, ${now}, ${now}, ${now})
      RETURNING id
    `;
    const agentId = agentRows[0].id;

    // Generate and batch-insert daily facts
    const today = new Date('2026-03-18');
    const startOffset = rng(daysActive, daysActive + 20);
    const possibleDays = Array.from({ length: startOffset }, (_, d) => d);
    // Shuffle
    for (let j = possibleDays.length - 1; j > 0; j--) {
      const k = rng(0, j);
      [possibleDays[j], possibleDays[k]] = [possibleDays[k], possibleDays[j]];
    }
    const activeDays = possibleDays.slice(0, daysActive).sort((a, b) => a - b);

    let remainingTokens = totalTokens;

    // Build all fact values and insert in one big query using a loop of smaller batches
    const BATCH_SIZE = 10;
    const factBatch = [];

    for (let dayIdx = 0; dayIdx < activeDays.length; dayIdx++) {
      const daysAgo = activeDays[dayIdx];
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().slice(0, 10);

      let dayTokens;
      if (dayIdx === activeDays.length - 1) {
        dayTokens = Math.max(1000, remainingTokens);
      } else {
        const avgRemaining = remainingTokens / (activeDays.length - dayIdx);
        dayTokens = Math.max(1000, Math.floor(avgRemaining * (0.3 + Math.random() * 1.4)));
        dayTokens = Math.min(dayTokens, remainingTokens - (activeDays.length - dayIdx - 1) * 1000);
      }
      remainingTokens -= dayTokens;

      const inputTokens = Math.floor(dayTokens * (0.55 + Math.random() * 0.15));
      const outputTokens = dayTokens - inputTokens;
      const cacheRead = Math.floor(inputTokens * (0.1 + Math.random() * 0.4));
      const cacheWrite = Math.floor(inputTokens * (0.02 + Math.random() * 0.08));
      const sessionCount = Math.max(1, Math.floor(dayTokens / rng(500_000, 3_000_000)));
      const longestRun = rng(300, 7200);
      const activeHour = rng(8, 23);
      const cost = (dayTokens / 1_000_000) * model.costPerMTok;
      const userMsgs = Math.max(1, Math.floor(sessionCount * rng(5, 25)));
      const assistMsgs = Math.floor(userMsgs * (1.2 + Math.random() * 0.8));
      const toolCalls = Math.floor(assistMsgs * (0.5 + Math.random() * 1.5));
      const commits = rng(0, Math.max(1, Math.floor(sessionCount * 0.4)));
      const added = rng(10, commits * 150 + 50);
      const removed = rng(5, Math.floor(added * 0.5));
      const prs = rng(0, Math.max(0, Math.floor(commits * 0.25)));

      factBatch.push({
        agentId, dateStr, dayTokens, inputTokens, outputTokens,
        cacheRead, cacheWrite, sessionCount, longestRun, activeHour,
        modelName: model.name, cost: cost.toFixed(4),
        userMsgs, assistMsgs, toolCalls,
        topTools: JSON.stringify(generateTopTools()),
        modelsUsed: JSON.stringify({ [model.name]: rng(60, 90) }),
        commits, added, removed, prs, now,
      });
    }

    // Insert facts in small batches
    for (let b = 0; b < factBatch.length; b += BATCH_SIZE) {
      const chunk = factBatch.slice(b, b + BATCH_SIZE);
      for (const f of chunk) {
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
            ${f.agentId}, ${f.dateStr}::date, ${f.dayTokens}, ${f.inputTokens}, ${f.outputTokens},
            ${f.cacheRead}, ${f.cacheWrite}, ${f.sessionCount}, ${f.longestRun},
            ${f.activeHour}, ${f.modelName}, ${f.cost},
            ${f.userMsgs}, ${f.assistMsgs}, ${f.toolCalls},
            ${f.topTools}::jsonb, ${f.modelsUsed}::jsonb,
            ${f.commits}, ${f.added}, ${f.removed}, ${f.prs},
            ${'manual'}, ${'seed-test-2026-03-18'}, ${'day'},
            ${f.now}, ${f.now}
          )
        `;
      }
    }

    console.log(`  ${i + 1}/${NEEDED}: ${agentName} by ${firstName} (${(totalTokens / 1e6).toFixed(1)}M tokens, ${daysActive} days)`);
  }

  // Final counts
  const total = await sql`SELECT COUNT(*) as cnt FROM agents`;
  const seedFacts = await sql`SELECT COUNT(*) as cnt FROM daily_agent_facts WHERE source_adapter = 'seed-test-2026-03-18'`;
  console.log(`\nDone! Total agents: ${total[0].cnt}, seed facts: ${seedFacts[0].cnt}`);
}

main().catch(err => { console.error(err); process.exit(1); });
