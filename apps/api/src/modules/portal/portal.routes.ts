import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { authenticate } from '../../shared/middleware/authenticate';
import { authenticatePortal } from '../../shared/middleware/authenticate-portal';
import { validate } from '../../shared/middleware/validation';
import { portalController } from './portal.controller';
import { PortalLoginSchema, CreatePortalAccountSchema } from './portal.validation';

const router = Router();

// Rate limiter for portal login — 5 requests per minute per IP
const portalLoginRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a minute.' },
});

// Multer for portal document uploads — memory storage, 50MB max, MIME filter
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const portalUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ALLOWED_MIME_TYPES.includes(file.mimetype));
  },
});

// Auth routes
router.post('/auth/login', portalLoginRateLimiter, validate(PortalLoginSchema), portalController.login);
router.post('/auth/create-account', authenticate, validate(CreatePortalAccountSchema), portalController.createAccount);
// Document-defined alias
router.post('/auth/register', authenticate, validate(CreatePortalAccountSchema), portalController.createAccount);

// Portal authenticated routes
router.get('/dashboard', authenticatePortal, portalController.getDashboard);
router.get('/documents', authenticatePortal, portalController.listDocuments);
router.post('/documents/upload', authenticatePortal, portalUpload.single('file'), portalController.uploadDocument);
router.get('/documents/:id/download', authenticatePortal, portalController.downloadDocument);
router.get('/invoices', authenticatePortal, portalController.listInvoices);
router.get('/invoices/:id', authenticatePortal, portalController.getInvoiceById);
router.post('/invoices/:id/pay', authenticatePortal, portalController.payInvoice);
router.get('/tasks', authenticatePortal, portalController.listTasks);

export default router;
