import { prisma } from '@repo/database';
import { randomUUID } from 'crypto';

export class DocumentsRepository {
  async create(data: {
    firmId: string;
    clientId: string | null;
    folderId: string | null;
    filename: string;
    fileKey: string;
    mimeType: string;
    sizeBytes: bigint;
    uploadedBy: string;
  }) {
    return prisma.documents.create({
      data: {
        id: randomUUID(),
        firm_id: data.firmId,
        client_id: data.clientId,
        folder_id: data.folderId,
        filename: data.filename,
        file_key: data.fileKey,
        mime_type: data.mimeType,
        size_bytes: data.sizeBytes,
        uploaded_by: data.uploadedBy,
      },
    });
  }

  async findById(firmId: string, documentId: string) {
    return prisma.documents.findFirst({
      where: {
        id: documentId,
        firm_id: firmId,
        deleted_at: null,
      },
    });
  }

  async findByClient(firmId: string, clientId: string, folderId?: string) {
    return prisma.documents.findMany({
      where: {
        firm_id: firmId,
        client_id: clientId,
        folder_id: folderId ?? undefined,
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async softDelete(firmId: string, documentId: string) {
    return prisma.documents.updateMany({
      where: {
        id: documentId,
        firm_id: firmId,
        deleted_at: null,
      },
      data: { deleted_at: new Date() },
    });
  }
}

export const documentsRepository = new DocumentsRepository();
