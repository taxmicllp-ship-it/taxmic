#!/usr/bin/env node
/**
 * Quick smoke test for Resend integration.
 * Usage: node scripts/test-resend.js <to_email>
 * Example: node scripts/test-resend.js you@example.com
 */

require('dotenv').config({ path: 'apps/api/.env' });

const { Resend } = require('resend');

const to = process.argv[2];
if (!to) {
  console.error('Usage: node scripts/test-resend.js <to_email>');
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;

if (!apiKey) {
  console.error('RESEND_API_KEY not set in apps/api/.env');
  process.exit(1);
}

console.log(`Sending test email from: ${from}`);
console.log(`Sending test email to:   ${to}`);

const resend = new Resend(apiKey);

resend.emails.send({
  from,
  to,
  subject: 'Resend Integration Test',
  html: '<h2>It works!</h2><p>Resend is wired up correctly in your API.</p>',
}).then(({ data, error }) => {
  if (error) {
    console.error('FAILED:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
  console.log('SUCCESS — email id:', data.id);
}).catch((err) => {
  console.error('EXCEPTION:', err.message);
  process.exit(1);
});
