import { Request, Response, NextFunction } from 'express';
import { portalService } from './portal.service';
import { config } from '../../config';

export const portalController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await portalService.login(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async createAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await portalService.createAccount(
        req.user!.firmId,
        req.body,
        req.user!.userId
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await portalService.getDashboard(
        req.portalUser!.firmId,
        req.portalUser!.clientId
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await portalService.listDocuments(
        req.portalUser!.firmId,
        req.portalUser!.clientId
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async downloadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await portalService.downloadDocument(
        req.portalUser!.firmId,
        req.portalUser!.clientId,
        req.params.id
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await portalService.uploadDocument(
        req.portalUser!.firmId,
        req.portalUser!.clientId,
        req.portalUser!.clientUserId,
        req.file!
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await portalService.listInvoices(
        req.portalUser!.firmId,
        req.portalUser!.clientId
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await portalService.getInvoiceById(
        req.portalUser!.firmId,
        req.portalUser!.clientId,
        req.params.id
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async payInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceId = req.params.id;
      const successUrl = `${config.frontendUrl}/portal/payment-success?invoice_id=${invoiceId}`;
      const cancelUrl = `${config.frontendUrl}/portal/invoices`;
      const result = await portalService.payInvoice(
        req.portalUser!.firmId,
        req.portalUser!.clientId,
        invoiceId,
        req.portalUser!.clientUserId,
        successUrl,
        cancelUrl
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async listTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await portalService.listTasks(
        req.portalUser!.firmId,
        req.portalUser!.clientId
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
