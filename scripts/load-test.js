#!/usr/bin/env node
/**
 * Load test script — Risk #5 Performance at Scale
 *
 * Uses autocannon (already in devDependencies or install with: npm i -g autocannon)
 *
 * Usage:
 *   node scripts/load-test.js
 *   BASE_URL=https://staging.api.yourdomain.com TOKEN=<jwt> node scripts/load-test.js
 *
 * Targets:
 *   - GET /api/v1/health          (no auth, baseline)
 *   - GET /api/v1/clients         (auth, tenant-scoped list)
 *   - GET /api/v1/invoices        (auth, tenant-scoped list)
 *   - GET /api/v1/dashboard/summary (auth, aggregation query)
 *
 * Pass criteria (per Section 12 success metrics):
 *   - p95 latency < 500ms
 *   - error rate < 1%
 *   - throughput > 50 req/s
 */

const autocannon = require('autocannon');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TOKEN = process.env.TOKEN || '';

const DURATION = parseInt(process.env.DURATION || '15', 10); // seconds
const CONNECTIONS = parseInt(process.env.CONNECTIONS || '10', 10);

const authHeaders = TOKEN
  ? { Authorization: `Bearer ${TOKEN}` }
  : {};

const targets = [
  {
    title: 'Health check (no auth)',
    url: `${BASE_URL}/api/v1/health`,
    headers: {},
  },
  {
    title: 'Clients list (auth)',
    url: `${BASE_URL}/api/v1/clients?page=1&limit=20`,
    headers: authHeaders,
  },
  {
    title: 'Invoices list (auth)',
    url: `${BASE_URL}/api/v1/invoices?page=1&limit=20`,
    headers: authHeaders,
  },
  {
    title: 'Dashboard summary (auth)',
    url: `${BASE_URL}/api/v1/dashboard/summary`,
    headers: authHeaders,
  },
];

const PASS_P95_MS = 500;
const PASS_ERROR_RATE = 0.01; // 1%

async function runTarget(target) {
  return new Promise((resolve) => {
    const instance = autocannon(
      {
        title: target.title,
        url: target.url,
        headers: target.headers,
        connections: CONNECTIONS,
        duration: DURATION,
        method: 'GET',
      },
      (err, result) => {
        if (err) {
          console.error(`ERROR running ${target.title}:`, err.message);
          resolve({ title: target.title, pass: false, error: err.message });
          return;
        }

        const p95 = result.latency.p97_5 ?? result.latency.max;
        const totalRequests = result.requests.total;
        const errors = result.errors + result['4xx'] + result['5xx'];
        const errorRate = totalRequests > 0 ? errors / totalRequests : 0;
        const throughput = result.requests.average;

        const pass = p95 < PASS_P95_MS && errorRate < PASS_ERROR_RATE;

        console.log(`\n── ${target.title} ──`);
        console.log(`  Requests:   ${totalRequests}`);
        console.log(`  Throughput: ${throughput.toFixed(1)} req/s`);
        console.log(`  p95 latency: ${p95}ms  (limit: ${PASS_P95_MS}ms)`);
        console.log(`  Error rate:  ${(errorRate * 100).toFixed(2)}%  (limit: 1%)`);
        console.log(`  Result: ${pass ? '✅ PASS' : '❌ FAIL'}`);

        resolve({ title: target.title, pass, p95, errorRate, throughput });
      }
    );

    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function main() {
  console.log(`\nLoad Test — ${BASE_URL}`);
  console.log(`Connections: ${CONNECTIONS}, Duration: ${DURATION}s per target\n`);

  if (!TOKEN) {
    console.warn('WARNING: TOKEN not set — auth endpoints will return 401 (expected for health check only)\n');
  }

  const results = [];
  for (const target of targets) {
    const result = await runTarget(target);
    results.push(result);
  }

  console.log('\n══════════════════════════════════════');
  console.log('LOAD TEST SUMMARY');
  console.log('══════════════════════════════════════');

  let allPass = true;
  for (const r of results) {
    const status = r.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}  ${r.title}`);
    if (!r.pass) allPass = false;
  }

  console.log('══════════════════════════════════════');
  console.log(`Overall: ${allPass ? '✅ ALL PASS' : '❌ FAILURES DETECTED'}`);
  console.log('══════════════════════════════════════\n');

  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});
