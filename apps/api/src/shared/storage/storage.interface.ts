export interface UploadResult {
  fileKey: string;
  url: string;
}

export interface StorageProvider {
  upload(fileKey: string, buffer: Buffer, mimeType: string): Promise<UploadResult>;
  getSignedUrl(fileKey: string, expiresInSeconds?: number): Promise<string>;
  delete(fileKey: string): Promise<void>;
}
