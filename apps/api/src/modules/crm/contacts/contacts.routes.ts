import { Router } from 'express';
import { contactsController } from './contacts.controller';
import { authenticate } from '../../../shared/middleware/authenticate';
import { tenantContext } from '../../../shared/middleware/tenant-context';
import { validate } from '../../../shared/middleware/validation';
import { CreateContactSchema, UpdateContactSchema } from './contacts.validation';

const router = Router();

router.get('/contacts', authenticate, tenantContext, contactsController.listContacts.bind(contactsController));
router.post('/contacts', authenticate, tenantContext, validate(CreateContactSchema), contactsController.createContact.bind(contactsController));
router.get('/contacts/:id', authenticate, tenantContext, contactsController.getContact.bind(contactsController));
router.patch('/contacts/:id', authenticate, tenantContext, validate(UpdateContactSchema), contactsController.updateContact.bind(contactsController));
router.delete('/contacts/:id', authenticate, tenantContext, contactsController.deleteContact.bind(contactsController));

export default router;
