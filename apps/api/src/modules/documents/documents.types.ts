export interface Folder {
  id: string;
  firm_id: string;
  client_id: string | null;
  parent_id: string | null;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Document {
  id: string;
  firm_id: string;
  client_id: string | null;
  folder_id: string | null;
  filename: string;
  file_key: string;
  mime_type: string | null;
  size_bytes: bigint;
  description: string | null;
  uploaded_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreateFolderDto {
  name: string;
  description?: string;
  parent_id?: string;
}

export interface DocumentResponse {
  id: string;
  firm_id: string;
  client_id: string | null;
  folder_id: string | null;
  filename: string;
  mime_type: string | null;
  size_bytes: string; // serialized as string (BigInt)
  description: string | null;
  uploaded_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
];

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
