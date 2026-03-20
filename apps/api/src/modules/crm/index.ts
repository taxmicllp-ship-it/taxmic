import { Router } from 'express';
import clientsRouter from './clients/clients.routes';
import contactsRouter from './contacts/contacts.routes';

const router = Router();

router.use(clientsRouter);
router.use(contactsRouter);

export default router;
