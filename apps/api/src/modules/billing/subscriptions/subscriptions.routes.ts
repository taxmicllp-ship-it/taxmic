import { Router } from 'express';
import express from 'express';
import { authenticate } from '../../../shared/middleware/authenticate';
import { tenantContext } from '../../../shared/middleware/tenant-context';
import { validate } from '../../../shared/middleware/validation';
import { subscriptionsController } from './subscriptions.controller';
import { stripeSubscriptionsWebhookHandler } from './stripe-subscriptions-webhook.controller';
import { createSubscriptionSchema, updateSubscriptionSchema } from './subscriptions.validation';

const router = Router();

// Stripe webhook — raw body required, NO auth middleware
router.post(
  '/subscriptions/webhook',
  express.raw({ type: 'application/json' }),
  stripeSubscriptionsWebhookHandler
);

// Plans — authenticated
router.get('/plans', authenticate, tenantContext, subscriptionsController.listPlans);

// Current subscription — resolves by firmId, no ID needed
router.get('/subscriptions/current', authenticate, tenantContext, subscriptionsController.getCurrentSubscription);

// Stripe Checkout session
router.post('/subscriptions/checkout-session', authenticate, tenantContext, subscriptionsController.createCheckoutSession);

// Subscriptions — authenticated
router.post(
  '/subscriptions',
  authenticate,
  tenantContext,
  validate(createSubscriptionSchema),
  subscriptionsController.createSubscription
);

router.get('/subscriptions/:id', authenticate, tenantContext, subscriptionsController.getSubscription);

router.patch(
  '/subscriptions/:id',
  authenticate,
  tenantContext,
  validate(updateSubscriptionSchema),
  subscriptionsController.updateSubscription
);

router.delete('/subscriptions/:id', authenticate, tenantContext, subscriptionsController.cancelSubscription);

// Usage & History — authenticated
router.get('/usage', authenticate, tenantContext, subscriptionsController.getUsage);

router.get('/subscriptions/:id/history', authenticate, tenantContext, subscriptionsController.getHistory);

export default router;
