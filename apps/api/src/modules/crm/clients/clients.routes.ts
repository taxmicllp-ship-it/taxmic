import { Router } from 'express';
import { clientsController } from './clients.controller';
import { authenticate } from '../../../shared/middleware/authenticate';
import { tenantContext } from '../../../shared/middleware/tenant-context';
import { validate } from '../../../shared/middleware/validation';
import {
  CreateClientSchema,
  UpdateClientSchema,
  UpdateFirmSchema,
  LinkContactSchema,
} from './clients.validation';

const router = Router();

// Firms - current firm only (firmId from token)
router.get('/firms/current', authenticate, tenantContext, clientsController.getFirm.bind(clientsController));
router.patch('/firms/current', authenticate, tenantContext, validate(UpdateFirmSchema), clientsController.updateFirm.bind(clientsController));

// Document-defined aliases: GET/PATCH /firms/:id — firmId from token, param ignored
router.get('/firms/:id', authenticate, tenantContext, clientsController.getFirm.bind(clientsController));
router.patch('/firms/:id', authenticate, tenantContext, validate(UpdateFirmSchema), clientsController.updateFirm.bind(clientsController));

// Clients
router.get('/clients', authenticate, tenantContext, clientsController.listClients.bind(clientsController));
// Document-defined dedicated search endpoint — must be before /clients/:id
router.get('/clients/search', authenticate, tenantContext, clientsController.listClients.bind(clientsController));
router.post('/clients', authenticate, tenantContext, validate(CreateClientSchema), clientsController.createClient.bind(clientsController));
router.get('/clients/:id', authenticate, tenantContext, clientsController.getClient.bind(clientsController));
router.patch('/clients/:id', authenticate, tenantContext, validate(UpdateClientSchema), clientsController.updateClient.bind(clientsController));
router.delete('/clients/:id', authenticate, tenantContext, clientsController.deleteClient.bind(clientsController));

// Relationships
router.post('/clients/:id/contacts/link', authenticate, tenantContext, validate(LinkContactSchema), clientsController.linkContact.bind(clientsController));
router.delete('/clients/:id/contacts/:contactId', authenticate, tenantContext, clientsController.unlinkContact.bind(clientsController));

export default router;
