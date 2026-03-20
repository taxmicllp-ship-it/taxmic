import express from 'express';
import * as Sentry from '@sentry/node';
import { Router } from 'express';
import authRouter from './modules/auth/auth.routes';
import { authController } from './modules/auth/auth.controller';
import { authenticate } from './shared/middleware/authenticate';
import { validate } from './shared/middleware/validation';
import { UpdateMeSchema } from './modules/auth/auth.validation';
import crmRouter from './modules/crm/index';
import documentsRouter from './modules/documents/documents.routes';
import tasksRouter from './modules/tasks/tasks.routes';
import billingRouter from './modules/billing/index';
import notificationsRouter from './modules/notifications/index';
import portalRouter from './modules/portal/index';
import dashboardRouter from './modules/dashboard/dashboard.routes';
import { errorHandler } from './shared/middleware/error-handler';

const app = express();

// Body parsing
app.use(express.json());

// Health check (public, no auth required)
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Auth routes — MUST be mounted BEFORE global authenticate middleware
app.use('/api/v1/auth', authRouter);

// Document-defined top-level /me and /me PATCH (Section 8.1 system endpoints)
const meRouter = Router();
meRouter.get('/me', authenticate, authController.getMe.bind(authController));
meRouter.patch('/me', authenticate, validate(UpdateMeSchema), authController.updateMe.bind(authController));
app.use('/api/v1', meRouter);

// CRM routes
app.use('/api/v1', crmRouter);

// Documents routes
app.use('/api/v1', documentsRouter);

// Tasks routes
app.use('/api/v1', tasksRouter);

// Billing routes (invoices + payments + webhook)
app.use('/api/v1', billingRouter);

// Notifications routes
app.use('/api/v1', notificationsRouter);

// Dashboard routes
app.use('/api/v1/dashboard', dashboardRouter);

// Portal routes (client-facing)
app.use('/api/v1/portal', portalRouter);

// Error handler — must be last
Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

export default app;
