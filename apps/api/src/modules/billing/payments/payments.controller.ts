import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';

class PaymentsController {
  payInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoiceId = req.params.id;
      const { success_url, cancel_url } = req.body;
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      const result = await paymentsService.createCheckoutSession(
        req.user!.firmId,
        invoiceId,
        success_url ?? `${frontendUrl}/invoices/payment-success?invoice_id=${invoiceId}`,
        cancel_url ?? `${frontendUrl}/invoices/${invoiceId}`
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  listPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payments = await paymentsService.listPayments(req.user!.firmId);
      res.json(payments);
    } catch (err) {
      next(err);
    }
  };

  createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { invoice_id, success_url, cancel_url } = req.body;
      const result = await paymentsService.createCheckoutSession(
        req.user!.firmId,
        invoice_id,
        success_url,
        cancel_url
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  listClientPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payments = await paymentsService.listClientPayments(req.user!.firmId, req.params.id);
      res.json(payments);
    } catch (err) {
      next(err);
    }
  };
}

export const paymentsController = new PaymentsController();
