import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  // PRODUCTION: must be set to 'production' — default 'development' leaks reset tokens in API responses
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  // Stripe — optional at startup; all Stripe calls fail at runtime without these
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // PRODUCTION: must be set to 's3' — default 'local' is not suitable for production deployments
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  // PRODUCTION: must be set to the public app URL — default causes Stripe Checkout redirects to fail
  FRONTEND_URL: z.string().url().default('http://localhost:3001'),
  // Resend — optional; falls back to stub logging if absent
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('onboarding@resend.dev'),
  // Sentry — optional; error tracking disabled if absent
  SENTRY_DSN: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  nodeEnv: parsed.data.NODE_ENV,
  port: parseInt(parsed.data.PORT, 10),
  stripeSecretKey: parsed.data.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsed.data.STRIPE_WEBHOOK_SECRET,
  storageProvider: parsed.data.STORAGE_PROVIDER,
  frontendUrl: parsed.data.FRONTEND_URL,
  resendApiKey: parsed.data.RESEND_API_KEY,
  emailFrom: parsed.data.EMAIL_FROM,
  sentryDsn: parsed.data.SENTRY_DSN,
} as const;
