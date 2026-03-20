import { Router } from 'express';
import { authenticate } from '../../../shared/middleware/authenticate';
import { requireAdmin } from '../../../shared/middleware/require-admin';
import { validate } from '../../../shared/middleware/validation';
import { plansController } from './plans.controller';
import { createPlanSchema, updatePlanSchema } from './subscriptions.validation';

const plansRouter = Router();

// Admin plan routes — no tenantContext, platform-level only
plansRouter.get('/admin/plans', authenticate, requireAdmin, plansController.listAllPlans);
plansRouter.post('/admin/plans', authenticate, requireAdmin, validate(createPlanSchema), plansController.createPlan);
plansRouter.patch('/admin/plans/:id', authenticate, requireAdmin, validate(updatePlanSchema), plansController.updatePlan);
plansRouter.delete('/admin/plans/:id', authenticate, requireAdmin, plansController.deactivatePlan);

export default plansRouter;
