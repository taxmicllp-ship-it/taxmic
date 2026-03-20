import { Request, Response, NextFunction } from 'express';
import { plansService } from './plans.service';

class PlansController {
  listAllPlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await plansService.listAllPlans();
      res.json(plans);
    } catch (err) {
      next(err);
    }
  };

  createPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await plansService.createPlan(req.body);
      res.status(201).json(plan);
    } catch (err) {
      next(err);
    }
  };

  updatePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await plansService.updatePlan(req.params.id, req.body);
      res.json(plan);
    } catch (err) {
      next(err);
    }
  };

  deactivatePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await plansService.deactivatePlan(req.params.id);
      res.json(plan);
    } catch (err) {
      next(err);
    }
  };
}

export const plansController = new PlansController();
