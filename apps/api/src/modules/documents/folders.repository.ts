import { prisma } from '@repo/database';
import { randomUUID } from 'crypto';
import { CreateFolderDto } from './documents.types';

export class FoldersRepository {
  async create(firmId: string, clientId: string, data: CreateFolderDto) {
    return prisma.folders.create({
      data: {
        id: randomUUID(),
        firm_id: firmId,
        client_id: clientId,
        parent_id: data.parent_id ?? null,
        name: data.name,
        description: data.description ?? null,
      },
    });
  }

  async findByClient(firmId: string, clientId: string) {
    return prisma.folders.findMany({
      where: {
        firm_id: firmId,
        client_id: clientId,
        deleted_at: null,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findById(firmId: string, folderId: string) {
    return prisma.folders.findFirst({
      where: {
        id: folderId,
        firm_id: firmId,
        deleted_at: null,
      },
    });
  }
}

export const foldersRepository = new FoldersRepository();
