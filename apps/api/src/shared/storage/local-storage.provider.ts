import fs from 'fs';
import path from 'path';
import { StorageProvider, UploadResult } from './storage.interface';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export class LocalStorageProvider implements StorageProvider {
  constructor() {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async upload(fileKey: string, buffer: Buffer, _mimeType: string): Promise<UploadResult> {
    const filePath = path.join(UPLOAD_DIR, fileKey.replace(/\//g, '_'));
    fs.writeFileSync(filePath, buffer);
    return {
      fileKey,
      url: `/uploads/${fileKey}`,
    };
  }

  async getSignedUrl(fileKey: string, _expiresInSeconds = 3600): Promise<string> {
    // Simulate signed URL for local dev — in production this would be a real S3 presigned URL
    const token = Buffer.from(`${fileKey}:${Date.now()}`).toString('base64url');
    return `/api/v1/documents/serve/${token}`;
  }

  async delete(fileKey: string): Promise<void> {
    const filePath = path.join(UPLOAD_DIR, fileKey.replace(/\//g, '_'));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Helper to read file for serving (local dev only)
  readFile(fileKey: string): Buffer | null {
    const filePath = path.join(UPLOAD_DIR, fileKey.replace(/\//g, '_'));
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    return null;
  }
}
