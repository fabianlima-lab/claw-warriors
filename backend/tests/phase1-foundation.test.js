import { PrismaClient } from '@prisma/client';
import { build } from '../src/server.js';

const prisma = new PrismaClient();

let app;
let passed = 0;
let failed = 0;
const results = [];

function assert(label, condition, detail) {
  if (condition) {
    passed++;
    results.push(`  PASS  ${label}`);
  } else {
    failed++;
    results.push(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function request(method, url, opts = {}) {
  const res = await app.inject({
    method,
    url,
    payload: opts.body,
    headers: {
      'content-type': 'application/json',
      ...opts.headers,
    },
  });
  return {
    status: res.statusCode,
    body: JSON.parse(res.body),
  };
}

// ═══════════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════════

async function testHealthCheck() {
  console.log('\n1. Health Check');
  const res = await request('GET', '/health');
  assert('GET /health returns 200', res.status === 200);
  assert('Response has status: ok', res.body.status === 'ok');
  assert('Response has timestamp', !!res.body.timestamp);
}

async function testDatabaseConnection() {
  console.log('\n2. Database Connection');
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    assert('Raw SQL query succeeds', result[0].connected === 1);
  } catch (err) {
    assert('Raw SQL query succeeds', false, err.message);
  }

  try {
    const count = await prisma.user.count();
    assert('User table is accessible', count >= 0);
  } catch (err) {
    assert('User table is accessible', false, err.message);
  }

  try {
    const count = await prisma.warrior.count();
    assert('Warrior table is accessible', count >= 0);
  } catch (err) {
    assert('Warrior table is accessible', false, err.message);
  }

  try {
    const count = await prisma.energy.count();
    assert('Energy table is accessible', count >= 0);
  } catch (err) {
    assert('Energy table is accessible', false, err.message);
  }

  try {
    const count = await prisma.message.count();
    assert('Message table is accessible', count >= 0);
  } catch (err) {
    assert('Message table is accessible', false, err.message);
  }

  try {
    const count = await prisma.elixirPurchase.count();
    assert('ElixirPurchase table is accessible', count >= 0);
  } catch (err) {
    assert('ElixirPurchase table is accessible', false, err.message);
  }
}

async function testWarriorTemplates() {
  console.log('\n3. Warrior Templates');
  const templates = await prisma.warriorTemplate.findMany();
  assert('15 templates exist', templates.length === 15, `got ${templates.length}`);

  const classes = [...new Set(templates.map((t) => t.class))].sort();
  const expectedClasses = ['artificer', 'bard', 'guardian', 'rogue', 'scholar'];
  assert(
    '5 classes present',
    JSON.stringify(classes) === JSON.stringify(expectedClasses),
    `got ${JSON.stringify(classes)}`
  );

  for (const cls of expectedClasses) {
    const count = templates.filter((t) => t.class === cls).length;
    assert(`${cls} has 3 templates`, count === 3, `got ${count}`);
  }

  // Validate each template has required fields
  const requiredFields = [
    'id', 'class', 'name', 'gender', 'introQuote',
    'firstMessage', 'baseSystemPrompt', 'stats',
    'recommendedTier', 'recommendedChannel', 'modelDefault', 'artFile',
  ];

  let allFieldsPresent = true;
  let missingDetail = '';
  for (const t of templates) {
    for (const field of requiredFields) {
      if (t[field] === null || t[field] === undefined || t[field] === '') {
        allFieldsPresent = false;
        missingDetail = `${t.id} missing ${field}`;
        break;
      }
    }
    if (!allFieldsPresent) break;
  }
  assert('All templates have required fields', allFieldsPresent, missingDetail);

  // Validate stats are valid JSON with numeric values
  let allStatsValid = true;
  let statsDetail = '';
  for (const t of templates) {
    if (typeof t.stats !== 'object' || t.stats === null) {
      allStatsValid = false;
      statsDetail = `${t.id} stats is not an object`;
      break;
    }
    const values = Object.values(t.stats);
    if (values.length === 0 || !values.every((v) => typeof v === 'number')) {
      allStatsValid = false;
      statsDetail = `${t.id} stats values not all numbers`;
      break;
    }
  }
  assert('All template stats are valid JSON with numbers', allStatsValid, statsDetail);

  // Validate GET /api/warriors/templates returns grouped data
  const res = await request('GET', '/api/warriors/templates');
  assert('GET /api/warriors/templates returns 200', res.status === 200);
  const groupKeys = Object.keys(res.body).sort();
  assert(
    'Templates grouped by 5 classes',
    JSON.stringify(groupKeys) === JSON.stringify(expectedClasses),
    `got ${JSON.stringify(groupKeys)}`
  );
}

async function testSignup() {
  console.log('\n4. Signup');
  const email = `test-${Date.now()}@phase1.test`;

  // Validation tests first (count toward rate limit: 3/min)
  // 1. Missing fields
  const noFields = await request('POST', '/api/auth/signup', {
    body: {},
  });
  assert('Missing fields returns 400', noFields.status === 400);

  // 2. Bad email format
  const badEmail = await request('POST', '/api/auth/signup', {
    body: { email: 'notanemail', password: 'securepass123' },
  });
  assert('Invalid email returns 400', badEmail.status === 400);

  // 3. Short password (last one before rate limit)
  const shortPw = await request('POST', '/api/auth/signup', {
    body: { email: 'short@phase1.test', password: 'short' },
  });
  assert('Short password returns 400', shortPw.status === 400);

  // Rate limit hit — verify it triggers (request 4 of 3/min)
  const rateLimited = await request('POST', '/api/auth/signup', {
    body: { email, password: 'securepass123' },
  });
  assert('Signup rate limit triggers after 3 requests', rateLimited.status === 429);

  // Wait for rate limit to reset (use a fresh Fastify instance approach:
  // close and rebuild to reset in-memory rate limit counters)
  await app.close();
  app = await build();

  // Now do the actual successful signup
  const res = await request('POST', '/api/auth/signup', {
    body: { email, password: 'securepass123' },
  });
  assert('Signup returns 201', res.status === 201, `got ${res.status}`);
  assert('Signup returns user_id', !!res.body.user_id);
  assert('Signup returns JWT token', !!res.body.token);
  assert('JWT is well-formed (3 parts)', res.body.token?.split('.').length === 3);

  // Verify user in DB
  const user = await prisma.user.findUnique({ where: { email } });
  assert('User exists in database', !!user);
  assert('Password is hashed (not plaintext)', user.passwordHash !== 'securepass123');
  assert('Default tier is free', user.tier === 'free');

  // Verify energy record created
  const energy = await prisma.energy.findUnique({ where: { userId: user.id } });
  assert('Energy record created', !!energy);
  assert('Energy starts at 0 used', energy.usedThisMonth === 0);

  // Duplicate signup
  const dup = await request('POST', '/api/auth/signup', {
    body: { email, password: 'securepass123' },
  });
  assert('Duplicate email returns 409', dup.status === 409);

  return { email, password: 'securepass123', userId: res.body.user_id };
}

async function testLogin(credentials) {
  console.log('\n5. Login');

  // Successful login
  const res = await request('POST', '/api/auth/login', {
    body: { email: credentials.email, password: credentials.password },
  });
  assert('Login returns 200', res.status === 200, `got ${res.status}`);
  assert('Login returns user_id', res.body.user_id === credentials.userId);
  assert('Login returns JWT token', !!res.body.token);

  // Wrong password
  const wrongPw = await request('POST', '/api/auth/login', {
    body: { email: credentials.email, password: 'wrongpassword' },
  });
  assert('Wrong password returns 401', wrongPw.status === 401);

  // Non-existent user
  const noUser = await request('POST', '/api/auth/login', {
    body: { email: 'nobody@test.com', password: 'whatever123' },
  });
  assert('Non-existent user returns 401', noUser.status === 401);

  // Missing fields
  const noFields = await request('POST', '/api/auth/login', {
    body: {},
  });
  assert('Missing fields returns 400', noFields.status === 400);

  return res.body.token;
}

async function testAuthProtection(token) {
  console.log('\n6. JWT Protection');

  const protectedEndpoints = [
    { method: 'POST', url: '/api/warriors/deploy' },
    { method: 'GET',  url: '/api/warriors/mine' },
    { method: 'GET',  url: '/api/dashboard/stats' },
    { method: 'GET',  url: '/api/dashboard/messages' },
    { method: 'POST', url: '/api/billing/checkout' },
    { method: 'GET',  url: '/api/billing/status' },
  ];

  // No token — all should return 401
  for (const ep of protectedEndpoints) {
    const res = await request(ep.method, ep.url, {
      body: ep.method === 'POST' ? { dummy: true } : undefined,
    });
    assert(
      `${ep.method} ${ep.url} rejects without token`,
      res.status === 401,
      `got ${res.status}`
    );
  }

  // Invalid token — all should return 401
  for (const ep of protectedEndpoints) {
    const res = await request(ep.method, ep.url, {
      headers: { authorization: 'Bearer invalid.token.here' },
      body: ep.method === 'POST' ? { dummy: true } : undefined,
    });
    assert(
      `${ep.method} ${ep.url} rejects invalid token`,
      res.status === 401,
      `got ${res.status}`
    );
  }

  // Valid token — should NOT return 401
  for (const ep of protectedEndpoints) {
    const res = await request(ep.method, ep.url, {
      headers: { authorization: `Bearer ${token}` },
      body: ep.method === 'POST' ? { dummy: true } : undefined,
    });
    assert(
      `${ep.method} ${ep.url} accepts valid token`,
      res.status !== 401,
      `got ${res.status}`
    );
  }
}

// ═══════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════

async function run() {
  console.log('='.repeat(50));
  console.log(' Phase 1 Foundation Tests');
  console.log('='.repeat(50));

  try {
    app = await build();

    await testHealthCheck();
    await testDatabaseConnection();
    await testWarriorTemplates();
    const credentials = await testSignup();
    const token = await testLogin(credentials);
    await testAuthProtection(token);

  } catch (err) {
    console.error('\n  FATAL TEST ERROR:', err.message);
    console.error(err.stack);
    failed++;
  } finally {
    // Cleanup test data
    try {
      await prisma.warrior.deleteMany({
        where: { user: { email: { contains: '@phase1.test' } } },
      });
      await prisma.energy.deleteMany({
        where: { user: { email: { contains: '@phase1.test' } } },
      });
      await prisma.user.deleteMany({
        where: { email: { contains: '@phase1.test' } },
      });
    } catch (err) {
      // Ignore cleanup errors
    }

    await prisma.$disconnect();
    if (app) await app.close();
  }

  // Print results
  console.log('\n' + '='.repeat(50));
  console.log(' Results');
  console.log('='.repeat(50));
  for (const r of results) {
    console.log(r);
  }
  console.log('\n' + '-'.repeat(50));
  console.log(`  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('-'.repeat(50));

  if (failed > 0) {
    console.log('\n  SOME TESTS FAILED\n');
    process.exit(1);
  } else {
    console.log('\n  ALL TESTS PASSED\n');
    process.exit(0);
  }
}

run();
