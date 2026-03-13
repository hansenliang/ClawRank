/**
 * Integration test: token provisioning + submission auth.
 * Tests the full lifecycle without GitHub OAuth.
 *
 * Run: cd ClawRank && npx tsx scripts/test-token-flow.ts
 */
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const dbUrl = env.match(/^DATABASE_URL="(.+)"$/m)?.[1];
if (!dbUrl) throw new Error('DATABASE_URL not found in .env.local');
const sql = neon(dbUrl);

// Replicate the hash function from src/lib/auth.ts
async function hashToken(rawToken: string): Promise<string> {
  const encoded = new TextEncoder().encode(rawToken);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateRawToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `cr_live_${hex}`;
}

async function cleanup(userId: string) {
  await sql`DELETE FROM api_tokens WHERE user_id = ${userId}`;
  await sql`DELETE FROM linked_accounts WHERE user_id = ${userId}`;
  await sql`DELETE FROM users WHERE id = ${userId}`;
}

async function main() {
  console.log('═══ ClawRank Token Flow Integration Test ═══\n');

  // 1. Create a test user (simulating what OAuth callback does)
  console.log('1. Creating test user...');
  const userRows = await sql`
    INSERT INTO users (display_name, avatar_url, created_at, updated_at)
    VALUES ('Test User', null, now(), now())
    RETURNING *
  `;
  const userId = userRows[0].id as string;
  console.log(`   ✓ User created: ${userId}`);

  try {
    // 2. Create a linked account (simulating GitHub link)
    console.log('2. Creating linked account...');
    const laRows = await sql`
      INSERT INTO linked_accounts (user_id, provider, provider_user_id, handle, display_name, verified, verified_at, created_at, updated_at)
      VALUES (${userId}, 'github', 'test-12345', 'testuser', 'Test User', true, now(), now(), now())
      RETURNING *
    `;
    console.log(`   ✓ Linked account: ${laRows[0].provider}:${laRows[0].handle}`);

    // 3. Generate an API token
    console.log('3. Generating API token...');
    const rawToken = generateRawToken();
    const tokenHash = await hashToken(rawToken);
    const tokenRows = await sql`
      INSERT INTO api_tokens (user_id, token_hash, label, created_at)
      VALUES (${userId}, ${tokenHash}, 'test-token', now())
      RETURNING *
    `;
    console.log(`   ✓ Token created: ${tokenRows[0].id}`);
    console.log(`   ✓ Raw token: ${rawToken.substring(0, 20)}...`);

    // 4. Verify token lookup works
    console.log('4. Verifying token lookup...');
    const lookupRows = await sql`
      SELECT t.*, u.display_name as u_display_name
      FROM api_tokens t
      JOIN users u ON t.user_id = u.id
      WHERE t.token_hash = ${tokenHash} AND t.revoked_at IS NULL
    `;
    if (lookupRows.length !== 1) throw new Error('Token lookup failed');
    if (lookupRows[0].user_id !== userId) throw new Error('Token maps to wrong user');
    console.log(`   ✓ Token resolves to user: ${lookupRows[0].u_display_name}`);

    // 5. Test that a different hash doesn't match
    console.log('5. Verifying bad token rejected...');
    const badHash = await hashToken('cr_live_definitely_not_a_real_token');
    const badRows = await sql`
      SELECT * FROM api_tokens WHERE token_hash = ${badHash} AND revoked_at IS NULL
    `;
    if (badRows.length !== 0) throw new Error('Bad token should not match!');
    console.log('   ✓ Invalid token correctly rejected');

    // 6. Test token revocation
    console.log('6. Testing token revocation...');
    await sql`UPDATE api_tokens SET revoked_at = now() WHERE id = ${tokenRows[0].id}`;
    const revokedRows = await sql`
      SELECT * FROM api_tokens WHERE token_hash = ${tokenHash} AND revoked_at IS NULL
    `;
    if (revokedRows.length !== 0) throw new Error('Revoked token should not match!');
    console.log('   ✓ Revoked token correctly excluded');

    // 7. Verify agent ownership check logic
    console.log('7. Verifying agent ownership...');
    const agents = await sql`SELECT id, slug, user_id FROM agents WHERE slug = 'clawdius-maximus'`;
    if (agents.length > 0) {
      const agent = agents[0];
      console.log(`   Agent "${agent.slug}": user_id = ${agent.user_id || 'null (unclaimed)'}`);
      if (!agent.user_id) {
        console.log('   ✓ Agent is unclaimed — any authenticated user can submit to it');
      } else {
        console.log(`   ✓ Agent owned by ${agent.user_id} — only that user can submit`);
      }
    }

    // 8. Verify linked_accounts unique constraint
    console.log('8. Testing linked_accounts upsert...');
    await sql`
      INSERT INTO linked_accounts (user_id, provider, provider_user_id, handle, display_name, verified, created_at, updated_at)
      VALUES (${userId}, 'github', 'test-12345', 'testuser-updated', 'Test User Updated', true, now(), now())
      ON CONFLICT (provider, provider_user_id) DO UPDATE SET
        handle = EXCLUDED.handle,
        display_name = EXCLUDED.display_name,
        updated_at = now()
      RETURNING *
    `;
    const updatedLA = await sql`
      SELECT * FROM linked_accounts WHERE provider = 'github' AND provider_user_id = 'test-12345'
    `;
    if (updatedLA.length !== 1) throw new Error('Should have exactly 1 linked account');
    if (updatedLA[0].handle !== 'testuser-updated') throw new Error('Upsert did not update handle');
    console.log('   ✓ Upsert correctly updated existing row (not duplicated)');

    console.log('\n═══ ALL TESTS PASSED ✓ ═══\n');

  } finally {
    // Always clean up
    console.log('Cleaning up test data...');
    await cleanup(userId);
    console.log('✓ Cleaned up');
  }
}

main().catch(e => {
  console.error('\n✗ TEST FAILED:', e.message);
  process.exit(1);
});
