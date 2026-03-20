import { randomUUID } from 'crypto';
import { AppError } from '../../shared/utils/errors';
import { getStorageProvider } from '../../shared/storage/storage.factory';
import { documentsRepository } from './documents.repository';
import { foldersRepository } from './folders.repository';
import { logger } from '../../shared/utils/logger';
import { notificationsService } from '../notifications/index';
import { usageService } from '../billing/subscriptions/usage.service';

export class DocumentsService {
  async uploadDocument(data: {
    firmId: string;
    clientId: string;
    folderId: string;
    filename: string;
    mimeType: string;
    buffer: Buffer;
    uploadedBy: string;
  }) {
    // Verify folder belongs to this firm
    const folder = await foldersRepository.findById(data.firmId, data.folderId);
    if (!folder) {
      throw new AppError('Folder not found', 404, 'NOT_FOUND');
    }

    // Resolve client_id from folder if not explicitly provided
    const resolvedClientId = data.clientId ?? folder.client_id;

    await usageService.checkStorageLimit(data.firmId, data.buffer.length);

    const fileKey = `${data.firmId}/${resolvedClientId}/${data.folderId}/${randomUUID()}_${data.filename}`;
    const storage = getStorageProvider();

    await storage.upload(fileKey, data.buffer, data.mimeType);

    const doc = await documentsRepository.create({
      firmId: data.firmId,
      clientId: resolvedClientId,
      folderId: data.folderId,
      filename: data.filename,
      fileKey,
      mimeType: data.mimeType,
      sizeBytes: BigInt(data.buffer.length),
      uploadedBy: data.uploadedBy,
    });

    if (data.uploadedBy) {
      try {
        await notificationsService.createNotification(data.firmId, {
          user_id: data.uploadedBy,
          type: 'document_uploaded',
          title: `Document Uploaded: ${data.filename}`,
          message: 'A new document has been uploaded.',
          entity_type: 'document',
          entity_id: doc.id,
        });
      } catch (err) {
        logger.warn({ event: 'NOTIFICATION_CREATE_FAILED', error: err });
      }
    }

    return { ...doc, size_bytes: doc.size_bytes.toString() };
  }

  async getDocument(firmId: string, documentId: string) {
    const doc = await documentsRepository.findById(firmId, documentId);
    if (!doc) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }
    return { ...doc, size_bytes: doc.size_bytes.toString() };
  }

  async getDownloadUrl(firmId: string, documentId: string) {
    const doc = await documentsRepository.findById(firmId, documentId);
    if (!doc) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }

    const storage = getStorageProvider();
    const url = await storage.getSignedUrl(doc.file_key, 3600);

    return { url, filename: doc.filename, mime_type: doc.mime_type };
  }

  async deleteDocument(firmId: string, documentId: string) {
    const doc = await documentsRepository.findById(firmId, documentId);
    if (!doc) {
      throw new AppError('Document not found', 404, 'NOT_FOUND');
    }

    // Soft delete in DB
    await documentsRepository.softDelete(firmId, documentId);

    // Remove from storage
    const storage = getStorageProvider();
    await storage.delete(doc.file_key).catch(() => {
      // Log but don't fail if storage delete fails
    });
  }

  async listDocuments(firmId: string, clientId: string, folderId?: string) {
    const docs = await documentsRepository.findByClient(firmId, clientId, folderId);
    // Serialize BigInt size_bytes as string for JSON
    return docs.map((d) => ({ ...d, size_bytes: d.size_bytes.toString() }));
  }
}

export const documentsService = new DocumentsService();
