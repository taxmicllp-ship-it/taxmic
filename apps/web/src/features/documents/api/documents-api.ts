import api from '../../../lib/api';
import { Folder, Document, DownloadResponse, CreateFolderDto } from '../types';

export const documentsApi = {
  createFolder: (clientId: string, data: CreateFolderDto) =>
    api.post<Folder>(`/clients/${clientId}/folders`, data).then((r) => r.data),

  listFolders: (clientId: string) =>
    api.get<Folder[]>(`/clients/${clientId}/folders`).then((r) => r.data),

  uploadDocument: (folderId: string, clientId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('client_id', clientId);
    return api
      .post<Document>(`/folders/${folderId}/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  getDownloadUrl: (documentId: string) =>
    api.get<DownloadResponse>(`/documents/${documentId}/download`).then((r) => r.data),

  deleteDocument: (documentId: string) =>
    api.delete(`/documents/${documentId}`),

  listDocuments: (clientId: string, folderId?: string) => {
    const params = folderId ? { folder_id: folderId } : {};
    return api.get<Document[]>(`/clients/${clientId}/documents`, { params }).then((r) => r.data);
  },
};
