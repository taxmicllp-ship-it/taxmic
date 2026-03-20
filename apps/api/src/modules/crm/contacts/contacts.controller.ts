import { Request, Response, NextFunction } from 'express';
import { contactsService } from './contacts.service';
import { ListContactsQuerySchema } from './contacts.validation';

class ContactsController {
  async listContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ListContactsQuerySchema.parse(req.query);
      const result = await contactsService.listContacts(req.user!.firmId, query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getContact(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await contactsService.getContact(req.user!.firmId, req.params.id);
      res.json(contact);
    } catch (err) {
      next(err);
    }
  }

  async createContact(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await contactsService.createContact(req.user!.firmId, req.body);
      res.status(201).json(contact);
    } catch (err) {
      next(err);
    }
  }

  async updateContact(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await contactsService.updateContact(req.user!.firmId, req.params.id, req.body);
      res.json(contact);
    } catch (err) {
      next(err);
    }
  }

  async deleteContact(req: Request, res: Response, next: NextFunction) {
    try {
      await contactsService.deleteContact(req.user!.firmId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const contactsController = new ContactsController();
