import { Router } from 'express';
import invoicesRouter from './invoices/invoices.routes';
import paymentsRouter from './payments/payments.routes';
import subscriptionsRouter from './subscriptions/subscriptions.routes';
import plansRouter from './subscriptions/plans.routes';

const billingRouter = Router();

billingRouter.use(invoicesRouter);
billingRouter.use(paymentsRouter);
billingRouter.use(subscriptionsRouter);
billingRouter.use(plansRouter);

export default billingRouter;
