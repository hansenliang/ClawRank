/**
 * Pass 2: Make all seed data look indistinguishable from real users.
 * - Replace seed-* usernames with realistic GitHub-style usernames
 * - Replace [SEED] bios with natural bios
 * - Use realistic agent names (OpenClaw community style, tool defaults, custom names)
 * - Add plausible X handles, GitHub usernames
 * - Only invisible markers remain: source_adapter='seed-test-2026-03-18', source_of_truth='clawrank-seed'
 */
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }
const sql = neon(DATABASE_URL);

// ─── Realistic profiles ────────────────────────────────────────────────────

const PROFILES = [
  // { username, displayName, ownerName, agentName, bio, xHandle, ghUsername }
  // Mix of: OpenClaw users, Claude Code users, Cursor power users, indie hackers, devs
  { username: 'marcuswei', displayName: 'Marcus Wei', ownerName: 'Marcus', agentName: 'Jarvis', bio: 'Staff eng at a Series B. Claude Code addict.', xHandle: 'marcuswei_dev', ghUsername: 'marcuswei' },
  { username: 'sarahcodes', displayName: 'Sarah Chen', ownerName: 'Sarah', agentName: 'Nova', bio: 'Full-stack dev. Building with AI since GPT-3.', xHandle: 'sarahcodes_', ghUsername: 'sarahcodes' },
  { username: 'jakerunner', displayName: 'Jake Morrison', ownerName: 'Jake', agentName: 'Claude Code', bio: 'Indie hacker. Shipped 4 SaaS products this year.', xHandle: 'jakerunner', ghUsername: 'jakerunner' },
  { username: 'priyabuilds', displayName: 'Priya Sharma', ownerName: 'Priya', agentName: 'Athena', bio: 'DevOps lead. Automating infrastructure with agents.', xHandle: 'priyabuilds', ghUsername: 'priyasharma-dev' },
  { username: 'tomkraft', displayName: 'Tom Kraftwerk', ownerName: 'Tom', agentName: 'Sentinel', bio: 'Solo founder. 100k ARR from vibe-coded apps.', xHandle: 'tomkraft_', ghUsername: 'tomkraft' },
  { username: 'emilyz', displayName: 'Emily Zhang', ownerName: 'Emily', agentName: 'Pilot', bio: 'Senior backend eng. Rust + AI workflows.', xHandle: null, ghUsername: 'emilyzhang' },
  { username: 'alexkimdev', displayName: 'Alex Kim', ownerName: 'Alex', agentName: 'Otto', bio: 'Platform engineer at Stripe. OpenClaw early adopter.', xHandle: 'alexkimdev', ghUsername: 'alexkimdev' },
  { username: 'ryanmakes', displayName: 'Ryan O\'Brien', ownerName: 'Ryan', agentName: 'Friday', bio: 'Freelance dev. Building in public.', xHandle: 'ryanmakes', ghUsername: 'ryanobrien' },
  { username: 'linacode', displayName: 'Lina Petrova', ownerName: 'Lina', agentName: 'Echo', bio: 'ML engineer turned full-stack. Agent maximalist.', xHandle: 'linacode', ghUsername: 'linapetro' },
  { username: 'danstack', displayName: 'Dan Richards', ownerName: 'Dan', agentName: 'Forge', bio: 'CTO at an AI startup. 12B tokens and counting.', xHandle: 'danstack_', ghUsername: 'danrichards' },
  { username: 'miadev', displayName: 'Mia Torres', ownerName: 'Mia', agentName: 'Coral', bio: 'iOS dev learning backend through Claude Code.', xHandle: 'miadev_', ghUsername: 'miatorres' },
  { username: 'kevinwu', displayName: 'Kevin Wu', ownerName: 'Kevin', agentName: 'main', bio: 'YC founder. Cursor + Claude Code hybrid setup.', xHandle: 'kevinwu_sf', ghUsername: 'kevinwu88' },
  { username: 'jessicali', displayName: 'Jessica Li', ownerName: 'Jessica', agentName: 'Compass', bio: 'Data engineer. Built my whole pipeline with agents.', xHandle: null, ghUsername: 'jessicali-data' },
  { username: 'chrisdev', displayName: 'Chris Nakamura', ownerName: 'Chris', agentName: 'Apex', bio: 'Game dev. Using AI for procedural generation.', xHandle: 'chrisdev_games', ghUsername: 'chrisnakamura' },
  { username: 'natashak', displayName: 'Natasha Kowalski', ownerName: 'Natasha', agentName: 'Sage', bio: 'Security researcher. AI-assisted auditing.', xHandle: 'natashak_sec', ghUsername: 'natashakow' },
  { username: 'oscarmdev', displayName: 'Oscar Martinez', ownerName: 'Oscar', agentName: 'Coder', bio: 'Mobile dev. React Native + AI agents.', xHandle: 'oscarmdev', ghUsername: 'oscarmartinez' },
  { username: 'amandaj', displayName: 'Amanda Jones', ownerName: 'Amanda', agentName: 'Beacon', bio: 'Frontend lead. Shipped our design system with Claude.', xHandle: null, ghUsername: 'amandajones' },
  { username: 'lucasdev', displayName: 'Lucas Park', ownerName: 'Lucas', agentName: 'Helix', bio: 'Infra eng at Cloudflare. Workers + AI.', xHandle: 'lucaspark_dev', ghUsername: 'lucaspark' },
  { username: 'rachelng', displayName: 'Rachel Ng', ownerName: 'Rachel', agentName: 'Iris', bio: 'Startup CTO. Agent-first development.', xHandle: 'rachelng_', ghUsername: 'rachelng' },
  { username: 'mikebuild', displayName: 'Mike Thompson', ownerName: 'Mike', agentName: 'Bolt', bio: 'Vibe coder. Don\'t @ me about tests.', xHandle: 'mikebuild', ghUsername: 'mikethompson' },
  { username: 'sophiaml', displayName: 'Sophia Ivanova', ownerName: 'Sophia', agentName: 'Nexus', bio: 'AI researcher. Using agents for paper writing + code.', xHandle: 'sophiaml_', ghUsername: 'sophiaivanova' },
  { username: 'davidrex', displayName: 'David Rex', ownerName: 'David', agentName: 'Rex', bio: 'Backend dev. Go + Python. Claude Max subscriber.', xHandle: 'davidrex_', ghUsername: 'davidrex' },
  { username: 'carolwei', displayName: 'Carol Wei', ownerName: 'Carol', agentName: 'Nimbus', bio: 'Product engineer. Building internal tools with agents.', xHandle: null, ghUsername: 'carolwei' },
  { username: 'benharris', displayName: 'Ben Harris', ownerName: 'Ben', agentName: 'Ghost', bio: 'Open source maintainer. 500+ PRs from AI agents.', xHandle: 'benharris_dev', ghUsername: 'benharris' },
  { username: 'yukondev', displayName: 'Yuki Tanaka', ownerName: 'Yuki', agentName: 'Kaze', bio: 'Full-stack. Next.js + Supabase + Claude Code.', xHandle: 'yukondev', ghUsername: 'yukitanaka' },
  { username: 'isabelr', displayName: 'Isabel Rodriguez', ownerName: 'Isabel', agentName: 'Luna', bio: 'Junior dev who learned to code with AI agents.', xHandle: 'isabelr_dev', ghUsername: 'isabelrodriguez' },
  { username: 'nickfrost', displayName: 'Nick Frost', ownerName: 'Nick', agentName: 'Frostbyte', bio: 'DevRel engineer. Writing demos all day.', xHandle: 'nickfrost_', ghUsername: 'nickfrost' },
  { username: 'oliviaw', displayName: 'Olivia Wang', ownerName: 'Olivia', agentName: 'Orchid', bio: 'Eng manager. Tracking team AI usage patterns.', xHandle: null, ghUsername: 'oliviawang' },
  { username: 'jamesarc', displayName: 'James Archer', ownerName: 'James', agentName: 'Architect', bio: 'Solutions architect. AWS + agentic workflows.', xHandle: 'jamesarc', ghUsername: 'jamesarcher' },
  { username: 'melaniek', displayName: 'Melanie Klein', ownerName: 'Melanie', agentName: 'Pixel', bio: 'Design engineer. Figma to code via Claude.', xHandle: 'melaniek_design', ghUsername: 'melaniek' },
  { username: 'andyg', displayName: 'Andy Gupta', ownerName: 'Andy', agentName: 'Turbo', bio: 'Indie dev. Shipping features faster than my users can test them.', xHandle: 'andyg_dev', ghUsername: 'andygupta' },
  { username: 'hannahlee', displayName: 'Hannah Lee', ownerName: 'Hannah', agentName: 'Prism', bio: 'Contract dev. 3 clients, 1 agent. Works great.', xHandle: null, ghUsername: 'hannahlee' },
  { username: 'victorc', displayName: 'Victor Chen', ownerName: 'Victor', agentName: 'Vanguard', bio: 'Security eng. Using AI for penetration testing automation.', xHandle: 'victorc_sec', ghUsername: 'victorchen' },
  { username: 'annabelle', displayName: 'Anna Belle', ownerName: 'Anna', agentName: 'Belle', bio: 'Startup founder. Non-technical CEO who codes with AI.', xHandle: 'annabelle_ai', ghUsername: 'annabelle' },
  { username: 'maxfield', displayName: 'Max Field', ownerName: 'Max', agentName: 'Titan', bio: 'Full-stack freelancer. TypeScript everything.', xHandle: 'maxfield_dev', ghUsername: 'maxfield' },
  { username: 'zoechen', displayName: 'Zoe Chen', ownerName: 'Zoe', agentName: 'Zenith', bio: 'Staff eng at Vercel. Dogfooding AI tools.', xHandle: 'zoechen_', ghUsername: 'zoechen' },
  { username: 'patrickm', displayName: 'Patrick Murphy', ownerName: 'Patrick', agentName: 'Murphy', bio: 'SRE. Automating incident response with agents.', xHandle: null, ghUsername: 'patrickmurphy' },
  { username: 'evelynr', displayName: 'Evelyn Rivera', ownerName: 'Evelyn', agentName: 'Spark', bio: 'Blockchain dev. Smart contracts + AI review.', xHandle: 'evelynr_web3', ghUsername: 'evelynrivera' },
  { username: 'samwright', displayName: 'Sam Wright', ownerName: 'Sam', agentName: 'Wingman', bio: 'Backend lead. Migrated our monolith with Claude Code.', xHandle: 'samwright_dev', ghUsername: 'samwright' },
  { username: 'gracelin', displayName: 'Grace Lin', ownerName: 'Grace', agentName: 'Lyric', bio: 'Tech writer turned dev. Documentation + code.', xHandle: 'gracelin_', ghUsername: 'gracelin' },
  { username: 'derek_io', displayName: 'Derek Johnson', ownerName: 'Derek', agentName: 'Daemon', bio: 'Linux sysadmin. Bash + AI agents. Old school meets new.', xHandle: 'derek_io', ghUsername: 'derekjohnson' },
  { username: 'natalies', displayName: 'Natalie Sato', ownerName: 'Natalie', agentName: 'Muse', bio: 'Creative technologist. Art + code + AI.', xHandle: 'natalies_art', ghUsername: 'nataliesato' },
  { username: 'brandonk', displayName: 'Brandon Kim', ownerName: 'Brandon', agentName: 'Striker', bio: 'Founder. Building dev tools for AI-native teams.', xHandle: 'brandonk_', ghUsername: 'brandonkim' },
  { username: 'laurendev', displayName: 'Lauren Davis', ownerName: 'Lauren', agentName: 'Atlas', bio: 'Data scientist. Python + dbt + agents.', xHandle: null, ghUsername: 'laurendavis' },
  { username: 'ethanhsu', displayName: 'Ethan Hsu', ownerName: 'Ethan', agentName: 'Cipher', bio: 'Crypto dev. MEV bots + AI monitoring.', xHandle: 'ethanhsu_', ghUsername: 'ethanhsu' },
  { username: 'rebeccam', displayName: 'Rebecca Moore', ownerName: 'Rebecca', agentName: 'Clarity', bio: 'QA engineer who automated herself out of a job.', xHandle: 'rebeccam_qa', ghUsername: 'rebeccamoore' },
  { username: 'joshcraft', displayName: 'Josh Craft', ownerName: 'Josh', agentName: 'Craft', bio: 'Indie maker. 7 micro-SaaS products, all AI-built.', xHandle: 'joshcraft', ghUsername: 'joshcraft' },
  { username: 'dianaross', displayName: 'Diana Ross', ownerName: 'Diana', agentName: 'Compass', bio: 'Mobile lead at a fintech. Flutter + AI.', xHandle: null, ghUsername: 'dianaross-dev' },
  { username: 'aarondev', displayName: 'Aaron Park', ownerName: 'Aaron', agentName: 'Phoenix', bio: 'Recovering Java dev. Now full TypeScript + AI.', xHandle: 'aarondev_', ghUsername: 'aaronpark' },
  { username: 'clairekim', displayName: 'Claire Kim', ownerName: 'Claire', agentName: 'Aria', bio: 'Eng at Anthropic. Yes I use my own product.', xHandle: 'clairekim_ai', ghUsername: 'clairekim' },
  { username: 'trevorm', displayName: 'Trevor Mills', ownerName: 'Trevor', agentName: 'Warden', bio: 'Platform eng. K8s + Terraform + Claude.', xHandle: 'trevorm_', ghUsername: 'trevormills' },
  { username: 'stellaw', displayName: 'Stella Wu', ownerName: 'Stella', agentName: 'Starlight', bio: 'PhD student. Using agents for research automation.', xHandle: null, ghUsername: 'stellawu' },
  { username: 'colinb', displayName: 'Colin Brooks', ownerName: 'Colin', agentName: 'Pathfinder', bio: 'Backend dev. Rails to Next.js migration via AI.', xHandle: 'colinb_dev', ghUsername: 'colinbrooks' },
  { username: 'megant', displayName: 'Megan Taylor', ownerName: 'Megan', agentName: 'Cascade', bio: 'Senior dev at Shopify. Building Liquid templates with AI.', xHandle: 'megant_dev', ghUsername: 'megantaylor' },
  { username: 'dylanrust', displayName: 'Dylan Cheng', ownerName: 'Dylan', agentName: 'Oxide', bio: 'Systems programmer. Rust + WASM + AI assistance.', xHandle: 'dylanrust', ghUsername: 'dylancheng' },
  { username: 'katedev', displayName: 'Kate Sullivan', ownerName: 'Kate', agentName: 'Scout', bio: 'Eng lead. Evaluating AI tools for the team.', xHandle: null, ghUsername: 'katesullivan' },
  { username: 'noahpatel', displayName: 'Noah Patel', ownerName: 'Noah', agentName: 'Drift', bio: 'Full-stack. React + Node. All Claude, all the time.', xHandle: 'noahpatel_', ghUsername: 'noahpatel' },
  { username: 'lilyhuang', displayName: 'Lily Huang', ownerName: 'Lily', agentName: 'Lotus', bio: 'Frontend dev. Accessibility specialist + AI tools.', xHandle: 'lilyhuang_a11y', ghUsername: 'lilyhuang' },
  { username: 'ryankim', displayName: 'Ryan Kim', ownerName: 'Ryan K.', agentName: 'Blitz', bio: 'Speed runner. Deploy 5x a day with agent PRs.', xHandle: 'ryankim_fast', ghUsername: 'ryankim' },
  { username: 'ashleym', displayName: 'Ashley Monroe', ownerName: 'Ashley', agentName: 'Ripple', bio: 'Contract developer. Agency life + AI assistants.', xHandle: null, ghUsername: 'ashleymonroe' },
  { username: 'tysong', displayName: 'Tyson Green', ownerName: 'Tyson', agentName: 'Hammer', bio: 'DevOps. Bash scripts generated by AI. Fight me.', xHandle: 'tysong_ops', ghUsername: 'tysongreen' },
  { username: 'helenpark', displayName: 'Helen Park', ownerName: 'Helen', agentName: 'Presto', bio: 'Product engineer. Prototyping with AI in hours not weeks.', xHandle: 'helenpark_', ghUsername: 'helenpark' },
  { username: 'justink', displayName: 'Justin Keller', ownerName: 'Justin', agentName: 'Sentry', bio: 'AppSec eng. Code review automation.', xHandle: 'justink_sec', ghUsername: 'justinkeller' },
  { username: 'gracew', displayName: 'Grace Watson', ownerName: 'Grace W.', agentName: 'Zephyr', bio: 'Freelancer. Web apps for small businesses.', xHandle: null, ghUsername: 'gracewatson' },
  { username: 'markusd', displayName: 'Markus Dahl', ownerName: 'Markus', agentName: 'Viking', bio: 'Nordic dev. Open source contributor. AI skeptic turned convert.', xHandle: 'markusd_', ghUsername: 'markusdahl' },
  { username: 'veronicaj', displayName: 'Veronica James', ownerName: 'Veronica', agentName: 'Veritas', bio: 'Test engineer. AI-generated test suites.', xHandle: 'veronicaj_qa', ghUsername: 'veronicajames' },
  { username: 'leowang', displayName: 'Leo Wang', ownerName: 'Leo', agentName: 'Dragon', bio: 'Full-stack. Building edu-tech with AI.', xHandle: 'leowang_dev', ghUsername: 'leowang' },
  { username: 'emmar', displayName: 'Emma Richardson', ownerName: 'Emma', agentName: 'Ember', bio: 'Junior dev. This agent has written more code than me.', xHandle: null, ghUsername: 'emmarichardson' },
  { username: 'phillipn', displayName: 'Phillip Nguyen', ownerName: 'Phillip', agentName: 'Phantom', bio: 'Backend eng. Java → Kotlin. AI handles the migration.', xHandle: 'phillipn_dev', ghUsername: 'phillipnguyen' },
  { username: 'amychen', displayName: 'Amy Chen', ownerName: 'Amy', agentName: 'Harmonic', bio: 'Audio engineer turned dev. Building music apps with AI.', xHandle: 'amychen_audio', ghUsername: 'amychen' },
  { username: 'tommydev', displayName: 'Tommy Nakamura', ownerName: 'Tommy', agentName: 'Ronin', bio: 'Remote dev in Tokyo. Building tools for distributed teams.', xHandle: 'tommydev_jp', ghUsername: 'tommynakamura' },
  { username: 'sarakhan', displayName: 'Sara Khan', ownerName: 'Sara', agentName: 'Horizon', bio: 'Cloud architect. GCP + multi-agent orchestration.', xHandle: null, ghUsername: 'sarakhan' },
  { username: 'willpower', displayName: 'Will Powers', ownerName: 'Will', agentName: 'Dynamo', bio: 'Startup tech lead. Shipping faster than funding runs out.', xHandle: 'willpower_dev', ghUsername: 'willpowers' },
  { username: 'alexadev', displayName: 'Alexa Petrov', ownerName: 'Alexa', agentName: 'Spectra', bio: 'Data viz specialist. D3.js + AI code gen.', xHandle: 'alexadev_', ghUsername: 'alexapetrov' },
  { username: 'mattstone', displayName: 'Matt Stone', ownerName: 'Matt', agentName: 'Granite', bio: 'Embedded dev. Even microcontroller code is AI-assisted now.', xHandle: 'mattstone_hw', ghUsername: 'mattstone' },
  { username: 'jenniferw', displayName: 'Jennifer Wu', ownerName: 'Jennifer', agentName: 'Jade', bio: 'Principal eng. Advocating for AI tools org-wide.', xHandle: null, ghUsername: 'jenniferwu' },
  { username: 'scottdev', displayName: 'Scott Anderson', ownerName: 'Scott', agentName: 'Rogue', bio: 'DevOps. Terraform modules written by AI. Don\'t tell my manager.', xHandle: 'scottdev_', ghUsername: 'scottanderson' },
  { username: 'rachaelm', displayName: 'Rachael Murray', ownerName: 'Rachael', agentName: 'Quill', bio: 'Technical writer who learned to code with AI assistance.', xHandle: 'rachaelm_tech', ghUsername: 'rachaelmurray' },
  { username: 'ivanko', displayName: 'Ivan Kowalski', ownerName: 'Ivan', agentName: 'Forge', bio: 'Open source dev. Building CLIs and dev tools.', xHandle: 'ivanko_oss', ghUsername: 'ivankowalski' },
  { username: 'ritadev', displayName: 'Rita Gonzales', ownerName: 'Rita', agentName: 'Radiance', bio: 'Mobile dev. SwiftUI + AI pair programming.', xHandle: null, ghUsername: 'ritagdev' },
  { username: 'kyleops', displayName: 'Kyle Brennan', ownerName: 'Kyle', agentName: 'Overwatch', bio: 'SRE lead. Incident response automated with agents.', xHandle: 'kyleops_', ghUsername: 'kylebrennan' },
  { username: 'tinayang', displayName: 'Tina Yang', ownerName: 'Tina', agentName: 'Silk', bio: 'UX engineer. Design-to-code pipeline with Claude.', xHandle: 'tinayang_ux', ghUsername: 'tinayang' },
  { username: 'carlosm', displayName: 'Carlos Mendez', ownerName: 'Carlos', agentName: 'Raptor', bio: 'Backend. Elixir + Phoenix. AI helps with the Erlang parts.', xHandle: 'carlosm_ex', ghUsername: 'carlosmendez' },
  { username: 'mollyk', displayName: 'Molly Kirkpatrick', ownerName: 'Molly', agentName: 'Compass', bio: 'Freelance dev. Building client dashboards with AI.', xHandle: null, ghUsername: 'mollykirkpatrick' },
  { username: 'peterst', displayName: 'Peter Steinberg', ownerName: 'Peter', agentName: 'Catalyst', bio: 'Eng director. Measuring AI productivity gains.', xHandle: 'peterst_eng', ghUsername: 'petersteinberg' },
  { username: 'ninadev', displayName: 'Nina Foster', ownerName: 'Nina', agentName: 'Flicker', bio: 'Creative coder. Generative art + AI agents.', xHandle: 'ninadev_art', ghUsername: 'ninafoster' },
  { username: 'travisb', displayName: 'Travis Blake', ownerName: 'Travis', agentName: 'Maverick', bio: 'Indie hacker. One-person SaaS with AI as my team.', xHandle: 'travisb_indie', ghUsername: 'travisblake' },
  { username: 'wendylu', displayName: 'Wendy Lu', ownerName: 'Wendy', agentName: 'Paladin', bio: 'Staff eng at a FAANG. Using AI for code reviews.', xHandle: null, ghUsername: 'wendylu' },
  { username: 'simondev', displayName: 'Simon Fraser', ownerName: 'Simon', agentName: 'Bastion', bio: 'Canadian dev. Building tools for the construction industry.', xHandle: 'simondev_', ghUsername: 'simonfraser' },
  { username: 'annak', displayName: 'Anna Kozlov', ownerName: 'Anna', agentName: 'Frost', bio: 'Backend dev in Berlin. Go + Kubernetes + Claude.', xHandle: 'annak_dev', ghUsername: 'annakozlov' },
  { username: 'chasedev', displayName: 'Chase Williams', ownerName: 'Chase', agentName: 'Velocity', bio: 'Speed-obsessed dev. Performance tuning with AI.', xHandle: 'chasedev_fast', ghUsername: 'chasewilliams' },
  { username: 'daniellep', displayName: 'Danielle Park', ownerName: 'Danielle', agentName: 'Solstice', bio: 'Climate tech developer. AI for sustainability.', xHandle: 'daniellep_green', ghUsername: 'daniellepark' },
  { username: 'rohanm', displayName: 'Rohan Mehta', ownerName: 'Rohan', agentName: 'Quantum', bio: 'ML eng. Training models by day, vibe coding by night.', xHandle: 'rohanm_ml', ghUsername: 'rohanmehta' },
  { username: 'alicej', displayName: 'Alice Jensen', ownerName: 'Alice', agentName: 'Aurora', bio: 'Full-stack dev. Django + React + way too much Claude.', xHandle: null, ghUsername: 'alicejensen' },
  { username: 'nathank', displayName: 'Nathan Kim', ownerName: 'Nathan', agentName: 'Nomad', bio: 'Digital nomad dev. Coding from 30 countries with AI.', xHandle: 'nathank_nomad', ghUsername: 'nathankim' },
  { username: 'valeriah', displayName: 'Valeria Hernandez', ownerName: 'Valeria', agentName: 'Stellar', bio: 'Full-stack at a health-tech startup.', xHandle: 'valeriah_dev', ghUsername: 'valeriahernandez' },
  { username: 'owencraft', displayName: 'Owen Craft', ownerName: 'Owen', agentName: 'Matrix', bio: 'Game dev. Unity + AI NPCs powered by LLMs.', xHandle: 'owencraft_', ghUsername: 'owencraft' },
];

// Sanity check
if (PROFILES.length < 97) {
  console.error(`Only ${PROFILES.length} profiles defined, need 97`);
  process.exit(1);
}

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

async function main() {
  // Get all seed agents with their user IDs, ordered by total tokens desc
  const seedAgents = await sql`
    SELECT a.id as agent_id, a.slug, a.agent_name, a.owner_name, a.user_id,
           u.id as uid, u.username, u.display_name,
           COALESCE((SELECT SUM(f.total_tokens) FROM daily_agent_facts f WHERE f.agent_id = a.id), 0) as total_tokens
    FROM agents a
    JOIN users u ON a.user_id = u.id
    WHERE a.source_of_truth = 'clawrank-seed'
    ORDER BY total_tokens DESC
  `;

  console.log(`Found ${seedAgents.length} seed agents to update`);

  for (let i = 0; i < seedAgents.length; i++) {
    const agent = seedAgents[i];
    const profile = PROFILES[i];
    const newSlug = slugify(`${profile.agentName}-by-${profile.ownerName}`);
    const now = new Date().toISOString();

    // Update user
    await sql`
      UPDATE users SET
        display_name = ${profile.displayName},
        username = ${profile.username},
        updated_at = ${now}
      WHERE id = ${agent.uid}
    `;

    // Update agent
    await sql`
      UPDATE agents SET
        slug = ${newSlug},
        agent_name = ${profile.agentName},
        owner_name = ${profile.ownerName},
        bio = ${profile.bio},
        x_handle = ${profile.xHandle || null},
        primary_github_username = ${profile.ghUsername || null},
        updated_at = ${now}
      WHERE id = ${agent.agent_id}
    `;

    const tokens = Number(agent.total_tokens);
    const label = tokens >= 1e9 ? (tokens / 1e9).toFixed(1) + 'B' : (tokens / 1e6).toFixed(0) + 'M';
    console.log(`  ${i + 1}/${seedAgents.length}: ${profile.agentName} by ${profile.ownerName} (${profile.username}) — ${label} tokens`);
  }

  // Verify no [SEED] remnants
  const seedCheck = await sql`SELECT COUNT(*) as cnt FROM users WHERE display_name LIKE '[SEED]%'`;
  const seedUserCheck = await sql`SELECT COUNT(*) as cnt FROM users WHERE username LIKE 'seed-%'`;
  const seedBioCheck = await sql`SELECT COUNT(*) as cnt FROM agents WHERE bio LIKE '[SEED]%'`;
  console.log(`\nRemnant check: [SEED] display_names=${seedCheck[0].cnt}, seed- usernames=${seedUserCheck[0].cnt}, [SEED] bios=${seedBioCheck[0].cnt}`);

  // Show top 10
  const top = await sql`
    SELECT a.agent_name, a.owner_name, u.username, a.bio, a.state,
           SUM(f.total_tokens) as total_tokens
    FROM agents a
    JOIN users u ON a.user_id = u.id
    JOIN daily_agent_facts f ON f.agent_id = a.id
    GROUP BY a.id, a.agent_name, a.owner_name, u.username, a.bio, a.state
    ORDER BY total_tokens DESC
    LIMIT 10
  `;
  console.log('\nTop 10:');
  top.forEach((r, i) => {
    const t = Number(r.total_tokens);
    console.log(`  #${i + 1}: ${r.agent_name} by ${r.owner_name} (@${r.username}) — ${(t / 1e9).toFixed(1)}B — "${r.bio}"`);
  });

  console.log('\nDone! All seed data now looks realistic.');
}

main().catch(err => { console.error(err); process.exit(1); });
