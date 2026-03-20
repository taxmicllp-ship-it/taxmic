import { Router } from 'express';
import express from 'express';
import { paymentsController } from './payments.controller';
import { stripeWebhookHandler } from './webhook.controller';
import { authenticate } from '../../../shared/middleware/authenticate';
import { tenantContext } from '../../../shared/middleware/tenant-context';
import { validate } from '../../../shared/middleware/validation';
import { CreateCheckoutSessionSchema } from './payments.validation';

const router = Router();

// Stripe webhook — raw body required, NO auth middleware
router.post(
  '/payments/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

// Document-defined alias
router.post(
  '/payments/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

// Authenticated routes
router.post(
  '/payments/checkout-session',
  authenticate,
  tenantContext,
  validate(CreateCheckoutSessionSchema),
  paymentsController.createCheckoutSession
);

// POST /invoices/:id/pay — document-defined alias for checkout session
router.post(
  '/invoices/:id/pay',
  authenticate,
  tenantContext,
  paymentsController.payInvoice
);

router.get('/payments', authenticate, tenantContext, paymentsController.listPayments);
router.get('/clients/:id/payments', authenticate, tenantContext, paymentsController.listClientPayments);

export default router;
