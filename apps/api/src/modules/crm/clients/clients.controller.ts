import { Request, Response, NextFunction } from 'express';
import { clientsService } from './clients.service';
import { ListClientsQuerySchema } from './clients.validation';

class ClientsController {
  async getFirm(req: Request, res: Response, next: NextFunction) {
    try {
      const firm = await clientsService.getFirm(req.user!.firmId);
      res.json(firm);
    } catch (err) {
      next(err);
    }
  }

  async updateFirm(req: Request, res: Response, next: NextFunction) {
    try {
      const firm = await clientsService.updateFirm(req.user!.firmId, req.body);
      res.json(firm);
    } catch (err) {
      next(err);
    }
  }

  async listClients(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ListClientsQuerySchema.parse(req.query);
      const result = await clientsService.listClients(req.user!.firmId, query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getClient(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await clientsService.getClient(req.user!.firmId, req.params.id);
      res.json(client);
    } catch (err) {
      next(err);
    }
  }

  async createClient(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await clientsService.createClient(req.user!.firmId, req.body);
      res.status(201).json(client);
    } catch (err) {
      next(err);
    }
  }

  async updateClient(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await clientsService.updateClient(req.user!.firmId, req.params.id, req.body);
      res.json(client);
    } catch (err) {
      next(err);
    }
  }

  async deleteClient(req: Request, res: Response, next: NextFunction) {
    try {
      await clientsService.deleteClient(req.user!.firmId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async linkContact(req: Request, res: Response, next: NextFunction) {
    try {
      const link = await clientsService.linkContact(req.user!.firmId, req.params.id, req.body.contactId);
      res.status(201).json(link);
    } catch (err) {
      next(err);
    }
  }

  async unlinkContact(req: Request, res: Response, next: NextFunction) {
    try {
      await clientsService.unlinkContact(req.user!.firmId, req.params.id, req.params.contactId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const clientsController = new ClientsController();
