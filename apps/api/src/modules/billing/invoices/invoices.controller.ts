import { Request, Response, NextFunction } from 'express';
import { invoicesService } from './invoices.service';
import { ListInvoicesQuerySchema } from './invoices.validation';

class InvoicesController {
  listInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = ListInvoicesQuerySchema.parse(req.query);
      const result = await invoicesService.listInvoices(req.user!.firmId, query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await invoicesService.createInvoice(req.user!.firmId, req.body);
      res.status(201).json(invoice);
    } catch (err) {
      next(err);
    }
  };

  getInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await invoicesService.getInvoice(req.user!.firmId, req.params.id);
      res.json(invoice);
    } catch (err) {
      next(err);
    }
  };

  updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await invoicesService.updateInvoice(req.user!.firmId, req.params.id, req.body);
      res.json(invoice);
    } catch (err) {
      next(err);
    }
  };

  sendInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await invoicesService.sendInvoice(req.user!.firmId, req.params.id, req.user!.userId);
      res.json(invoice);
    } catch (err) {
      next(err);
    }
  };

  listClientInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoices = await invoicesService.listClientInvoices(req.user!.firmId, req.params.id);
      res.json(invoices);
    } catch (err) {
      next(err);
    }
  };

  markPaid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await invoicesService.markPaid(req.user!.firmId, req.params.id, req.user!.userId);
      res.json(invoice);
    } catch (err) {
      next(err);
    }
  };

  deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await invoicesService.deleteInvoice(req.user!.firmId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}

export const invoicesController = new InvoicesController();
