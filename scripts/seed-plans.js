/**
 * ⚠️  LAST-RESORT BOOTSTRAP TOOL — for fresh environments only.
 *
 * This script is NOT the primary mechanism for plan management.
 * Use one of the following instead:
 *
 *   Option A — Admin UI:  /billing/admin/plans  (create/edit plans via the dashboard)
 *   Option B — Stripe webhooks: create products & prices in the Stripe Dashboard;
 *              webhooks will automatically sync them to the database.
 *
 * Only run this script when bootstrapping a brand-new environment where no plans
 * exist and neither Option A nor Option B has been run yet.
 *
 * NOTE: The env vars STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, and
 * STRIPE_PRICE_ENTERPRISE are only required for this seed script. Once Option A
 * or Option B is in use, these variables are no longer needed and can be removed
 * from your .env files.
 *
 * SaaS Plans Seed Script — Phase 9
 * Plain JS — runs directly with node from packages/database directory.
 *
 * Usage:
 *   node ../../scripts/seed-plans.js
 *   (run from packages/database so @prisma/client resolves correctly)
 *
 * Required env vars (set in packages/database/.env or export before running):
 *   STRIPE_PRICE_STARTER   — Stripe monthly price ID for Starter plan  (e.g. price_1ABC...)
 *   STRIPE_PRICE_PRO       — Stripe monthly price ID for Pro plan
 *   STRIPE_PRICE_ENTERPRISE — Stripe monthly price ID for Enterprise plan
 *
 * How to get these IDs:
 *   1. Go to https://dashboard.stripe.com/products
 *   2. Create a product for each plan (Starter / Pro / Enterprise)
 *   3. Add a recurring monthly price to each product
 *   4. Copy the price ID (starts with price_) into the env vars above
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Validate Stripe price IDs are set and not placeholders
const STRIPE_PRICE_STARTER    = process.env.STRIPE_PRICE_STARTER;
const STRIPE_PRICE_PRO        = process.env.STRIPE_PRICE_PRO;
const STRIPE_PRICE_ENTERPRISE = process.env.STRIPE_PRICE_ENTERPRISE;

const missing = [];
if (!STRIPE_PRICE_STARTER    || STRIPE_PRICE_STARTER.includes('placeholder'))    missing.push('STRIPE_PRICE_STARTER');
if (!STRIPE_PRICE_PRO        || STRIPE_PRICE_PRO.includes('placeholder'))        missing.push('STRIPE_PRICE_PRO');
if (!STRIPE_PRICE_ENTERPRISE || STRIPE_PRICE_ENTERPRISE.includes('placeholder')) missing.push('STRIPE_PRICE_ENTERPRISE');

if (missing.length > 0) {
  console.error('\n❌  Missing or placeholder Stripe price IDs:');
  missing.forEach((v) => console.error(`     ${v} is not set`));
  console.error('\n   Set these env vars before running this script.');
  console.error('   See script header for instructions.\n');
  process.exit(1);
}

const PLANS = [
  {
    name: 'Starter',
    slug: 'starter',
    description: 'For small firms getting started',
    price_monthly: 29.00,
    price_annual: 290.00,
    max_users: 3,
    max_clients: 25,
    max_storage_gb: 5,
    features: { stripe_price_id: STRIPE_PRICE_STARTER },
    is_active: true,
    sort_order: 1,
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'For growing firms',
    price_monthly: 79.00,
    price_annual: 790.00,
    max_users: 10,
    max_clients: 100,
    max_storage_gb: 25,
    features: { stripe_price_id: STRIPE_PRICE_PRO },
    is_active: true,
    sort_order: 2,
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Unlimited for large firms',
    price_monthly: 199.00,
    price_annual: 1990.00,
    max_users: null,
    max_clients: null,
    max_storage_gb: null,
    features: { stripe_price_id: STRIPE_PRICE_ENTERPRISE },
    is_active: true,
    sort_order: 3,
  },
];

async function main() {
  console.log('Starting plans seed...\n');
  const results = [];

  for (const plan of PLANS) {
    const existing = await prisma.plans.findUnique({ where: { slug: plan.slug } });
    const status = existing ? 'updated' : 'created';

    await prisma.plans.upsert({
      where: { slug: plan.slug },
      create: plan,
      update: {
        name: plan.name,
        description: plan.description,
        price_monthly: plan.price_monthly,
        price_annual: plan.price_annual,
        max_users: plan.max_users,
        max_clients: plan.max_clients,
        max_storage_gb: plan.max_storage_gb,
        features: plan.features,
        is_active: plan.is_active,
        sort_order: plan.sort_order,
      },
    });

    console.log(`  OK    ${plan.slug}`);
    results.push({ ...plan, status });
  }

  console.log('\n=== Plans Summary ===\n');
  console.log('Slug        | price_monthly | max_users   | max_clients | max_storage_gb | status');
  console.log('------------|---------------|-------------|-------------|----------------|--------');
  for (const r of results) {
    const mu = r.max_users === null ? 'unlimited' : String(r.max_users);
    const mc = r.max_clients === null ? 'unlimited' : String(r.max_clients);
    const ms = r.max_storage_gb === null ? 'unlimited' : String(r.max_storage_gb);
    console.log(
      `${r.slug.padEnd(11)} | ${String(r.price_monthly.toFixed(2)).padEnd(13)} | ${mu.padEnd(11)} | ${mc.padEnd(11)} | ${ms.padEnd(14)} | ${r.status}`
    );
  }
  console.log('');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
