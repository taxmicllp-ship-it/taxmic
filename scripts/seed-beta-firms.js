/**
 * Beta Seed Script — Phase 7
 * Plain JS — runs directly with node from packages/database directory.
 *
 * Usage:
 *   node ../../scripts/seed-beta-firms.js
 *   (run from packages/database so @prisma/client resolves correctly)
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const BETA_FIRMS = [
  {
    firmName: 'Beta Firm One',
    firmSlug: 'beta-firm-1',
    firmEmail: 'admin@betafirm1.com',
    firstName: 'Alice',
    lastName: 'Johnson',
    userEmail: 'admin@betafirm1.com',
    password: 'BetaPass1!',
  },
  {
    firmName: 'Beta Firm Two',
    firmSlug: 'beta-firm-2',
    firmEmail: 'admin@betafirm2.com',
    firstName: 'Bob',
    lastName: 'Williams',
    userEmail: 'admin@betafirm2.com',
    password: 'BetaPass2!',
  },
  {
    firmName: 'Beta Firm Three',
    firmSlug: 'beta-firm-3',
    firmEmail: 'admin@betafirm3.com',
    firstName: 'Carol',
    lastName: 'Martinez',
    userEmail: 'admin@betafirm3.com',
    password: 'BetaPass3!',
  },
  {
    firmName: 'Beta Firm Four',
    firmSlug: 'beta-firm-4',
    firmEmail: 'admin@betafirm4.com',
    firstName: 'David',
    lastName: 'Chen',
    userEmail: 'admin@betafirm4.com',
    password: 'BetaPass4!',
  },
  {
    firmName: 'Beta Firm Five',
    firmSlug: 'beta-firm-5',
    firmEmail: 'admin@betafirm5.com',
    firstName: 'Eva',
    lastName: 'Patel',
    userEmail: 'admin@betafirm5.com',
    password: 'BetaPass5!',
  },
];

async function main() {
  console.log('Starting beta firm seed...\n');

  const ownerRole = await prisma.roles.findFirst({ where: { name: 'owner' } });
  if (!ownerRole) {
    throw new Error('Owner role not found. Register one firm first via POST /api/v1/auth/register to create the owner role.');
  }

  const results = [];

  for (const beta of BETA_FIRMS) {
    const existing = await prisma.firms.findUnique({ where: { slug: beta.firmSlug } });
    if (existing) {
      console.log(`  SKIP  ${beta.firmSlug} — already exists`);
      results.push({ slug: beta.firmSlug, email: beta.userEmail, password: beta.password, status: 'skipped' });
      continue;
    }

    const passwordHash = await bcrypt.hash(beta.password, 12);

    await prisma.$transaction(async (tx) => {
      const firm = await tx.firms.create({
        data: { name: beta.firmName, slug: beta.firmSlug, email: beta.firmEmail },
      });

      await tx.firm_settings.create({ data: { firm_id: firm.id } });
      await tx.invoice_sequences.create({ data: { firm_id: firm.id } });
      await tx.storage_usage.create({ data: { firm_id: firm.id, total_bytes: 0, document_count: 0 } });

      const user = await tx.users.create({
        data: {
          firm_id: firm.id,
          email: beta.userEmail,
          password_hash: passwordHash,
          first_name: beta.firstName,
          last_name: beta.lastName,
          is_active: true,
          email_verified: true,
        },
      });

      await tx.user_roles.create({
        data: { user_id: user.id, role_id: ownerRole.id, firm_id: firm.id },
      });
    });

    console.log(`  OK    ${beta.firmSlug} — ${beta.userEmail}`);
    results.push({ slug: beta.firmSlug, email: beta.userEmail, password: beta.password, status: 'created' });
  }

  console.log('\n=== Beta Firm Credentials ===\n');
  console.log('Firm Slug         | Email                    | Password     | Status');
  console.log('------------------|--------------------------|--------------|--------');
  for (const r of results) {
    console.log(`${r.slug.padEnd(17)} | ${r.email.padEnd(24)} | ${r.password.padEnd(12)} | ${r.status}`);
  }
  console.log('\nLogin URL: http://localhost:3001/login');
  console.log('Use firm slug + email + password to authenticate.\n');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
