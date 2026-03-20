import { Request, Response, NextFunction } from 'express';
import { foldersService } from './folders.service';
import { documentsService } from './documents.service';
import { CreateFolderSchema, ListDocumentsQuerySchema } from './documents.validation';

export class DocumentsController {
  // POST /clients/:id/folders
  async createFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateFolderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR' });
      }

      const folder = await foldersService.createFolder(
        req.user!.firmId,
        req.params.id,
        parsed.data,
      );
      res.status(201).json(folder);
    } catch (err) {
      next(err);
    }
  }

  // GET /clients/:id/folders
  async listFolders(req: Request, res: Response, next: NextFunction) {
    try {
      const folders = await foldersService.listFolders(req.user!.firmId, req.params.id);
      res.json(folders);
    } catch (err) {
      next(err);
    }
  }

  // POST /folders/:id/upload
  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided', code: 'NO_FILE' });
      }

      const doc = await documentsService.uploadDocument({
        firmId: req.user!.firmId,
        clientId: req.body.client_id || null,
        folderId: req.params.id,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        buffer: req.file.buffer,
        uploadedBy: req.user!.userId,
      });

      res.status(201).json({ ...doc, size_bytes: doc.size_bytes.toString() });
    } catch (err) {
      next(err);
    }
  }

  // GET /documents/:id
  async getDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await documentsService.getDocument(req.user!.firmId, req.params.id);
      res.json(doc);
    } catch (err) {
      next(err);
    }
  }

  // GET /documents/:id/download
  async downloadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentsService.getDownloadUrl(req.user!.firmId, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // DELETE /documents/:id
  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      await documentsService.deleteDocument(req.user!.firmId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  // GET /clients/:id/documents
  async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ListDocumentsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR' });
      }

      const docs = await documentsService.listDocuments(
        req.user!.firmId,
        req.params.id,
        parsed.data.folder_id,
      );
      res.json(docs);
    } catch (err) {
      next(err);
    }
  }
}

export const documentsController = new DocumentsController();
