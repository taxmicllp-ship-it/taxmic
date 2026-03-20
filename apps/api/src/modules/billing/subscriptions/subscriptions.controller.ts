import { Request, Response, NextFunction } from 'express';
import { plansService } from './plans.service';
import { subscriptionsService } from './subscriptions.service';
import { usageService } from './usage.service';
import { subscriptionsRepository } from './subscriptions.repository';

class SubscriptionsController {
  listPlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await plansService.listPlans();
      res.json(plans);
    } catch (err) {
      next(err);
    }
  };

  getCurrentSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscription = await subscriptionsService.getCurrentSubscription(req.user!.firmId);
      res.json(subscription ?? null);
    } catch (err) {
      next(err);
    }
  };

  createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { planId } = req.body;
      const result = await subscriptionsService.createCheckoutSession(req.user!.firmId, planId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  createSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscription = await subscriptionsService.createSubscription(req.user!.firmId, req.body);
      res.status(201).json(subscription);
    } catch (err) {
      next(err);
    }
  };

  getSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscription = await subscriptionsService.getSubscription(req.user!.firmId, req.params.id);
      res.json(subscription);
    } catch (err) {
      next(err);
    }
  };

  updateSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscription = await subscriptionsService.updateSubscription(req.user!.firmId, req.params.id, req.body);
      res.json(subscription);
    } catch (err) {
      next(err);
    }
  };

  cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscription = await subscriptionsService.cancelSubscription(req.user!.firmId, req.params.id);
      res.json(subscription);
    } catch (err) {
      next(err);
    }
  };

  getUsage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usage = await usageService.getUsageSummary(req.user!.firmId);
      res.json(usage);
    } catch (err) {
      next(err);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subscription = await subscriptionsRepository.findByFirmId(req.user!.firmId);
      if (!subscription) {
        return res.json([]);
      }
      const events = await subscriptionsRepository.listEvents(subscription.id);
      res.json(events);
    } catch (err) {
      next(err);
    }
  };
}

export const subscriptionsController = new SubscriptionsController();
