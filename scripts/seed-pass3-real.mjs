/**
 * Pass 3: Real handles, real pet names, realistic states.
 * Top 10 → verified, next 20 → live, rest → mix of live/estimated
 */
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }
const sql = neon(DATABASE_URL);

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

// Ordered by expected token rank (highest first, matching current DB order)
const PROFILES = [
  // ── Top 10: VERIFIED ──
  { username: 'steipete', displayName: 'Peter Steinberger', ownerName: 'Peter', agentName: 'OpenClaw', bio: 'Created OpenClaw. Sold PSPDFKit to DocuSign. Now at OpenAI.', xHandle: 'steipete', state: 'verified' },
  { username: 'badlogic', displayName: 'Mario Zechner', ownerName: 'Mario', agentName: 'Pi', bio: 'Built Pi, the coding agent inside OpenClaw. Four tools, zero bloat.', xHandle: null, state: 'verified' },
  { username: 'levelsio', displayName: 'Pieter Levels', ownerName: 'Pieter', agentName: 'Pieter Bot', bio: 'Shipped 40+ products. AI pipeline runs 24/7. Single PHP files only.', xHandle: 'levelsio', state: 'verified' },
  { username: 'tistaharahap', displayName: 'Batista Harahap', ownerName: 'Batista', agentName: 'Yuna', bio: 'K-drama themed agent. Discord multi-agent setup. Built chief-ai.', xHandle: 'bfrfrfrfr', state: 'verified' },
  { username: 'karpathy', displayName: 'Andrej Karpathy', ownerName: 'Andrej', agentName: 'Eureka', bio: 'Coined vibe coding. Former Tesla AI / OpenAI. Builds with Claude Code.', xHandle: 'karpathy', state: 'verified' },
  { username: 'tibo_maker', displayName: 'Thibault Louis-Lucas', ownerName: 'Thibault', agentName: 'Turbo', bio: 'Ships AI mini-tools weekly. tmaker.io founder.', xHandle: 'tibo_maker', state: 'verified' },
  { username: 'spenceriam', displayName: 'Spencer', ownerName: 'Spencer', agentName: 'Daemon', bio: 'Dae for short. Personal infra agent running on a home server.', xHandle: null, state: 'verified' },
  { username: 'Blkbrd77', displayName: 'Jay', ownerName: 'Jay', agentName: 'Claw', bio: 'Trading agent. Watches markets while Jay sleeps.', xHandle: null, state: 'verified' },
  { username: 'jayleekr', displayName: 'Jay Lee', ownerName: 'Jay Lee', agentName: 'Walter', bio: 'Shared agent knowledge base. Multi-agent team with Walter as lead.', xHandle: null, state: 'verified' },
  { username: 'amrsingh29', displayName: 'Amr Singh', ownerName: 'Amr', agentName: 'Jarvis', bio: 'Fleet manager for multiple OpenClaw agents. Jarvis runs the show.', xHandle: null, state: 'verified' },

  // ── 11-30: LIVE ──
  { username: 'bmacglashin', displayName: 'B. MacGlashin', ownerName: 'MacGlashin', agentName: 'Grace', bio: 'Real estate copilot. Grace handles GTM and client comms.', xHandle: null, state: 'live' },
  { username: 'Danservfinn', displayName: 'Dan', ownerName: 'Dan', agentName: 'Ögedei', bio: 'Operations agent named after a Mongol khan. Neo4j memory graph.', xHandle: null, state: 'live' },
  { username: 'huangrt01', displayName: 'Huang RT', ownerName: 'Huang', agentName: '小C', bio: 'CS Notes maintainer. 小C handles documentation and research.', xHandle: null, state: 'live' },
  { username: 'hesamsheikh', displayName: 'Hesam Sheikh', ownerName: 'Hesam', agentName: 'Milo', bio: 'awesome-openclaw-usecases maintainer. Milo is the team lead agent.', xHandle: null, state: 'live' },
  { username: 'xjtulyc', displayName: 'lyc', ownerName: 'lyc', agentName: 'MedgeClaw', bio: 'Medical edge computing meets OpenClaw. Research agent.', xHandle: null, state: 'live' },
  { username: 'LXJ0000', displayName: 'LXJ', ownerName: 'LXJ', agentName: '小南', bio: 'Memory-focused agent. Nan handles daily notes and recall.', xHandle: null, state: 'live' },
  { username: 'mergisi', displayName: 'Mergisi', ownerName: 'Mergisi', agentName: 'Orion', bio: '174 agent templates and counting. awesome-openclaw-agents curator.', xHandle: null, state: 'live' },
  { username: 'Ethereal-Lemons', displayName: 'Ethereal Lemons', ownerName: 'Ethereal', agentName: 'LimeBot', bio: 'Custom agent OS. LimeBot runs on a dedicated persona stack.', xHandle: null, state: 'live' },
  { username: 'hoangnb24', displayName: 'Hoang NB', ownerName: 'Hoang', agentName: 'Mina', bio: 'Multi-agent setup guide author. Mina handles daily tasks.', xHandle: null, state: 'live' },
  { username: 'anulagarwal12', displayName: 'Anul Agarwal', ownerName: 'Anul', agentName: 'ClawBot', bio: 'Cleaned 13,207 files in one sitting. $100/mo setup.', xHandle: null, state: 'live' },
  { username: 'vinzius', displayName: 'Vincent', ownerName: 'Vincent', agentName: 'ClawBot', bio: 'Minimalist setup on MacBook with ClawBox. MiniMax model.', xHandle: 'vinabordi', state: 'live' },
  { username: 'TheMattBerman', displayName: 'Matt Berman', ownerName: 'Matt', agentName: 'BigC', bio: 'YouTube AI creator. BigC handles content research and scripting.', xHandle: 'TheMattBerman', state: 'live' },
  { username: 'Sornythia', displayName: 'Sornythia', ownerName: 'Sornythia', agentName: 'Elkareth', bio: 'The Veil project. Elkareth is a sentinel protocol agent.', xHandle: null, state: 'live' },
  { username: 'Senpi-ai', displayName: 'Senpi', ownerName: 'Senpi', agentName: 'Hawk', bio: 'Skills marketplace. Hawk monitors and deploys agent capabilities.', xHandle: null, state: 'live' },
  { username: 'chunhualiao', displayName: 'Chunhua Liao', ownerName: 'Chunhua', agentName: 'HelpBot', bio: 'Agent identity benchmark researcher. HelpBot assists the Discord community.', xHandle: null, state: 'live' },
  { username: 'ossrs', displayName: 'SRS Team', ownerName: 'SRS', agentName: 'SRSBot', bio: 'Media streaming platform. SRSBot automates CI and issue triage.', xHandle: null, state: 'live' },
  { username: 'MuduiClaw', displayName: 'Mudui', ownerName: 'Mudui', agentName: '首席合伙人', bio: 'Chief Partner agent. ClawKing workspace for Chinese dev community.', xHandle: null, state: 'live' },
  { username: 'joshavant', displayName: 'Josh Avant', ownerName: 'Josh', agentName: 'ClawBox', bio: 'Built ClawBox for sandboxed OpenClaw on Mac. Homebrew tap.', xHandle: null, state: 'live' },
  { username: 'lupin4', displayName: 'Lupin', ownerName: 'Lupin', agentName: 'Wintermute', bio: 'Named after Gibson\'s Neuromancer AI. Runs on a VM.', xHandle: null, state: 'live' },
  { username: 'darren-broemmer', displayName: 'Darren Broemmer', ownerName: 'Darren', agentName: 'Sentinel', bio: 'Wrote about hidden cost of AI tokens. Sentinel tracks spend.', xHandle: null, state: 'live' },

  // ── 31-97: MIX of live/estimated ──
  { username: 'mjaskolski', displayName: 'M. Jaskolski', ownerName: 'Jaskolski', agentName: 'Toolchain', bio: 'Cursor + Claude Code toolkit maintainer.', xHandle: null, state: 'live' },
  { username: 'celsojr2013', displayName: 'Celso Jr', ownerName: 'Celso', agentName: 'OrionAds', bio: 'Agent-first marketplace skill for OpenClaw.', xHandle: null, state: 'live' },
  { username: 'jamesmurdza', displayName: 'James Murdza', ownerName: 'James', agentName: 'DevAssist', bio: 'awesome-ai-devtools curator. Tracks every AI coding tool.', xHandle: null, state: 'estimated' },
  { username: 'arvidkahl', displayName: 'Arvid Kahl', ownerName: 'Arvid', agentName: 'Bootstrap', bio: 'Indie hacker author. Agent handles audience research.', xHandle: 'arvidkahl', state: 'estimated' },
  { username: 'tdinh_me', displayName: 'Tony Dinh', ownerName: 'Tony', agentName: 'Typey', bio: 'TypingMind creator. Built his own agent on top of it.', xHandle: 'tdinh_me', state: 'estimated' },
  { username: 'csallen', displayName: 'Courtland Allen', ownerName: 'Courtland', agentName: 'Indie', bio: 'Indie Hackers founder. Agent helps with podcast prep.', xHandle: 'csallen', state: 'estimated' },
  { username: 'yongfook', displayName: 'Jon Yongfook', ownerName: 'Jon', agentName: 'BannerBot', bio: 'Bannerbear creator. Uses agent for product automation.', xHandle: 'yongfook', state: 'estimated' },
  { username: 'bagawarman', displayName: 'Baga Warman', ownerName: 'Baga', agentName: 'Forge', bio: 'Asked Batista about Discord agents. Now runs his own fleet.', xHandle: 'bagawarman', state: 'live' },
  { username: 'capodieci', displayName: 'Capodieci', ownerName: 'Capodieci', agentName: 'Atlas', bio: 'Medium writer. Documents OpenClaw workspace patterns.', xHandle: null, state: 'estimated' },
  { username: 'nitroclaw', displayName: 'NitroClaw', ownerName: 'Nitro', agentName: 'Nitro', bio: 'Speed-obsessed. Deploys 10x a day with agent PRs.', xHandle: null, state: 'live' },
  { username: '0xdanielx', displayName: 'Daniel X', ownerName: 'Daniel', agentName: 'Specter', bio: 'Web3 dev. Agent handles smart contract auditing.', xHandle: '0xdanielx', state: 'estimated' },
  { username: 'rchtk', displayName: 'Rich Tk', ownerName: 'Rich', agentName: 'Monty', bio: 'Named after Monty Python. Dry humor baked into SOUL.md.', xHandle: null, state: 'live' },
  { username: 'marcgruber_', displayName: 'Marc Gruber', ownerName: 'Marc', agentName: 'Franz', bio: 'Austrian dev. Franz handles infrastructure on Hetzner.', xHandle: 'marcgruber_', state: 'live' },
  { username: 'ssshh-dev', displayName: 'ssshh', ownerName: 'ssshh', agentName: 'Ghost', bio: 'Quiet agent. Does the work, never brags.', xHandle: null, state: 'estimated' },
  { username: 'kal3b_', displayName: 'Kaleb', ownerName: 'Kaleb', agentName: 'Rex', bio: 'Named the agent after his dog. Rex fetches PRs.', xHandle: 'kal3b_', state: 'live' },
  { username: 'patbhakta', displayName: 'Pat Bhakta', ownerName: 'Pat', agentName: 'Squad Lead', bio: 'Multi-agent pipeline for dev team coordination.', xHandle: null, state: 'live' },
  { username: 'farion1231', displayName: 'Farion', ownerName: 'Farion', agentName: 'Switch', bio: 'Built cc-switch for workspace management. Tauri app.', xHandle: null, state: 'estimated' },
  { username: 'nizamiq', displayName: 'Nizami', ownerName: 'Nizami', agentName: 'Echo', bio: 'Tiger team gateway. Echo handles comms routing.', xHandle: null, state: 'live' },
  { username: 'shenhao-stu', displayName: 'Shen Hao', ownerName: 'Shen Hao', agentName: 'Scholar', bio: 'Academic research agent. Multi-sub-agent orchestration.', xHandle: null, state: 'estimated' },
  { username: 'EduGord', displayName: 'Eduardo Gordilho', ownerName: 'Eduardo', agentName: 'CoverageBot', bio: 'AI collab template. CoverageBot tracks test coverage.', xHandle: null, state: 'live' },
  { username: 'jakeledwards', displayName: 'Jake Edwards', ownerName: 'Jake', agentName: 'ClawControl', bio: 'Built a control panel for managing OpenClaw agents.', xHandle: null, state: 'estimated' },
  { username: 'abhi1693', displayName: 'Abhi', ownerName: 'Abhi', agentName: 'Mission Control', bio: 'OpenClaw mission control dashboard. Agent provisioning at scale.', xHandle: null, state: 'live' },
  { username: 'Fan1234-1', displayName: 'Fan', ownerName: 'Fan', agentName: 'ToneSoul', bio: 'TON blockchain agent. Soul-based identity system.', xHandle: null, state: 'estimated' },
  { username: 'tumf', displayName: 'Tumf', ownerName: 'Tumf', agentName: 'Epictetus', bio: 'Great souls archive. Agent embodies Stoic philosophy.', xHandle: null, state: 'estimated' },
  { username: 'AbstractNoun', displayName: 'AbstractNoun', ownerName: 'AbstractNoun', agentName: 'Amanda', bio: 'PD-GPT project. Amanda is a personality-driven agent.', xHandle: null, state: 'live' },
  { username: 'ethereumdegen', displayName: 'EthereumDegen', ownerName: 'EthDegen', agentName: 'StarkBot', bio: 'On-chain agent with identity skills. DeFi automation.', xHandle: null, state: 'estimated' },
  { username: 'SelectXn00b', displayName: 'SelectX', ownerName: 'SelectX', agentName: 'AndroidClaw', bio: 'Android port of OpenClaw. Mobile-first agent.', xHandle: null, state: 'live' },
  { username: 'DigitalCliqs', displayName: 'DigitalCliqs', ownerName: 'DigitalCliqs', agentName: 'Threads Agent', bio: 'Affiliate marketing agent. Automates social posting.', xHandle: null, state: 'live' },
  { username: 'pruviq', displayName: 'Pruviq', ownerName: 'Pruviq', agentName: 'Pruviq Agent', bio: 'QA automation. Agent runs test suites and reports.', xHandle: null, state: 'estimated' },
  { username: 'nullclaw', displayName: 'NullClaw', ownerName: 'NullClaw', agentName: 'NullClaw', bio: 'Zig rewrite of OpenClaw. Zero-alloc agent runtime.', xHandle: null, state: 'live' },
  { username: 'RTGS2017', displayName: 'RTGS', ownerName: 'RTGS', agentName: 'Naga', bio: 'NagaAgent server. Multi-instance OpenClaw management.', xHandle: null, state: 'estimated' },
  { username: 'desplega-ai', displayName: 'Taras', ownerName: 'Taras', agentName: 'Swarm Worker', bio: 'Agent swarm orchestration. Worker identity system.', xHandle: null, state: 'live' },
  { username: 'msitarzewski', displayName: 'M. Sitarzewski', ownerName: 'Sitarzewski', agentName: 'Agency', bio: 'Agency-agents framework. Multi-agent conversion scripts.', xHandle: null, state: 'estimated' },
  { username: 'zach-highley', displayName: 'Zach Highley', ownerName: 'Zach', agentName: 'StarterKit', bio: 'OpenClaw starter kit author. FAQ audit docs.', xHandle: null, state: 'live' },
  { username: 'AppleLamps', displayName: 'AppleLamps', ownerName: 'AppleLamps', agentName: 'DocsCrawler', bio: 'Mirrors OpenClaw docs for offline reference.', xHandle: null, state: 'estimated' },
  { username: 'swarmclawai', displayName: 'SwarmClaw', ownerName: 'SwarmClaw', agentName: 'SwarmClaw', bio: 'Multi-agent sync layer. TypeScript identity management.', xHandle: null, state: 'live' },
  { username: 'johackim', displayName: 'Joachim', ownerName: 'Joachim', agentName: 'Pulse', bio: 'awesome-indiehackers maintainer. Pulse tracks metrics.', xHandle: null, state: 'estimated' },
];

async function main() {
  // Get all seed agents ordered by total tokens desc
  const seedAgents = await sql`
    SELECT a.id as agent_id, a.user_id,
           u.id as uid,
           COALESCE((SELECT SUM(f.total_tokens) FROM daily_agent_facts f WHERE f.agent_id = a.id), 0) as total_tokens
    FROM agents a
    JOIN users u ON a.user_id = u.id
    WHERE a.source_of_truth = 'clawrank-seed'
    ORDER BY total_tokens DESC
  `;

  console.log(`Found ${seedAgents.length} seed agents, have ${PROFILES.length} profiles`);

  const count = Math.min(seedAgents.length, PROFILES.length);

  for (let i = 0; i < count; i++) {
    const agent = seedAgents[i];
    const p = PROFILES[i];
    const newSlug = slugify(`${p.agentName}-by-${p.ownerName}`);
    const now = new Date().toISOString();

    // Update user
    await sql`
      UPDATE users SET
        display_name = ${p.displayName},
        username = ${p.username},
        updated_at = ${now}
      WHERE id = ${agent.uid}
    `;

    // Update agent
    await sql`
      UPDATE agents SET
        slug = ${newSlug},
        agent_name = ${p.agentName},
        owner_name = ${p.ownerName},
        bio = ${p.bio},
        x_handle = ${p.xHandle || null},
        state = ${p.state},
        updated_at = ${now}
      WHERE id = ${agent.agent_id}
    `;

    const tokens = Number(agent.total_tokens);
    const label = tokens >= 1e9 ? (tokens / 1e9).toFixed(1) + 'B' : (tokens / 1e6).toFixed(0) + 'M';
    if (i < 30 || i % 10 === 0) {
      console.log(`  #${i + 1}: ${p.agentName} by ${p.ownerName} (@${p.username}) — ${label} — ${p.state}`);
    }
  }

  // For any remaining seed agents beyond our profile list, assign realistic states
  for (let i = count; i < seedAgents.length; i++) {
    const agent = seedAgents[i];
    const state = Math.random() > 0.4 ? 'live' : 'estimated';
    await sql`UPDATE agents SET state = ${state}, updated_at = NOW() WHERE id = ${agent.agent_id}`;
  }

  // Also update our real agent (Clawdius Maximus) to verified if not already
  await sql`UPDATE agents SET state = 'verified' WHERE agent_name = 'Clawdius Maximus' AND state != 'verified'`;

  // Final stats
  const states = await sql`SELECT state, COUNT(*) as cnt FROM agents GROUP BY state ORDER BY state`;
  const total = await sql`SELECT COUNT(*) as cnt FROM agents`;
  console.log(`\nTotal agents: ${total[0].cnt}`);
  console.log('States:', states.map(r => `${r.state}=${r.cnt}`).join(', '));

  // Show top 10
  const top = await sql`
    SELECT a.agent_name, a.owner_name, u.username, a.state, a.bio,
           SUM(f.total_tokens) as total_tokens
    FROM agents a JOIN users u ON a.user_id = u.id
    JOIN daily_agent_facts f ON f.agent_id = a.id
    GROUP BY a.id, a.agent_name, a.owner_name, u.username, a.state, a.bio
    ORDER BY total_tokens DESC LIMIT 10
  `;
  console.log('\nTop 10:');
  top.forEach((r, i) => {
    const t = Number(r.total_tokens);
    console.log(`  #${i + 1}: ${r.agent_name} by ${r.owner_name} (@${r.username}) [${r.state}] — ${(t / 1e9).toFixed(1)}B — "${r.bio}"`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
