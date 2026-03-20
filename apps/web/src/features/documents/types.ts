export interface Folder {
  id: string;
  firm_id: string;
  client_id: string | null;
  parent_id: string | null;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  firm_id: string;
  client_id: string | null;
  folder_id: string | null;
  filename: string;
  mime_type: string | null;
  size_bytes: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DownloadResponse {
  url: string;
  filename: string;
  mime_type: string | null;
}

export interface CreateFolderDto {
  name: string;
  description?: string;
  parent_id?: string;
}
