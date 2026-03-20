import { Router } from 'express';
import { invoicesController } from './invoices.controller';
import { authenticate } from '../../../shared/middleware/authenticate';
import { tenantContext } from '../../../shared/middleware/tenant-context';
import { validate } from '../../../shared/middleware/validation';
import { CreateInvoiceSchema, UpdateInvoiceSchema } from './invoices.validation';

const router = Router();

router.get('/invoices', authenticate, tenantContext, invoicesController.listInvoices);
router.post('/invoices', authenticate, tenantContext, validate(CreateInvoiceSchema), invoicesController.createInvoice);
router.get('/invoices/:id', authenticate, tenantContext, invoicesController.getInvoice);
router.patch('/invoices/:id', authenticate, tenantContext, validate(UpdateInvoiceSchema), invoicesController.updateInvoice);
router.delete('/invoices/:id', authenticate, tenantContext, invoicesController.deleteInvoice);
router.post('/invoices/:id/send', authenticate, tenantContext, invoicesController.sendInvoice);
router.patch('/invoices/:id/mark-paid', authenticate, tenantContext, invoicesController.markPaid);

router.get('/clients/:id/invoices', authenticate, tenantContext, invoicesController.listClientInvoices);

export default router;
