import { AppError } from '../../shared/utils/errors';
import { foldersRepository } from './folders.repository';
import { CreateFolderDto } from './documents.types';

export class FoldersService {
  async createFolder(firmId: string, clientId: string, data: CreateFolderDto) {
    // Validate parent folder belongs to same firm/client if provided
    if (data.parent_id) {
      const parent = await foldersRepository.findById(firmId, data.parent_id);
      if (!parent) {
        throw new AppError('Parent folder not found', 404, 'NOT_FOUND');
      }
    }

    return foldersRepository.create(firmId, clientId, data);
  }

  async listFolders(firmId: string, clientId: string) {
    return foldersRepository.findByClient(firmId, clientId);
  }
}

export const foldersService = new FoldersService();
