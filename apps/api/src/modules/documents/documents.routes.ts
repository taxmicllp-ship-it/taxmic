import { Router } from 'express';
import { documentsController } from './documents.controller';
import { authenticate } from '../../shared/middleware/authenticate';
import { tenantContext } from '../../shared/middleware/tenant-context';
import { handleUpload } from './upload.middleware';

const router = Router();

// Folder endpoints
router.post('/clients/:id/folders', authenticate, tenantContext, documentsController.createFolder.bind(documentsController));
router.get('/clients/:id/folders', authenticate, tenantContext, documentsController.listFolders.bind(documentsController));

// Document endpoints
router.post('/folders/:id/upload', authenticate, tenantContext, handleUpload, documentsController.uploadDocument.bind(documentsController));
router.get('/documents/:id/download', authenticate, tenantContext, documentsController.downloadDocument.bind(documentsController));
router.get('/documents/:id', authenticate, tenantContext, documentsController.getDocument.bind(documentsController));
router.delete('/documents/:id', authenticate, tenantContext, documentsController.deleteDocument.bind(documentsController));
router.get('/clients/:id/documents', authenticate, tenantContext, documentsController.listDocuments.bind(documentsController));

export default router;
