// IMPORTANT: This file must be imported before anything else in server.ts
// Sentry must be initialized before any other imports to ensure proper instrumentation.
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';
dotenv.config();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    sendDefaultPii: true,
  });
}
