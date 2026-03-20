// IMPORTANT: instrument.ts must be the very first import
import './instrument';
import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { logger } from './shared/utils/logger';

const PORT = process.env.PORT || 3000;

if (!process.env.STRIPE_SECRET_KEY) {
  logger.warn('STRIPE_SECRET_KEY is not set — Stripe endpoints will return 503');
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  logger.warn('STRIPE_WEBHOOK_SECRET is not set — webhook endpoint will return 503');
}

app.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
});
