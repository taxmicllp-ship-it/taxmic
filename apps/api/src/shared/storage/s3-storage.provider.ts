import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider, UploadResult } from './storage.interface';
import { logger } from '../utils/logger';

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET || '';

    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is required when STORAGE_PROVIDER=s3');
    }

    this.client = new S3Client({
      region,
      ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    });

    logger.info({ event: 'S3_PROVIDER_INIT', bucket: this.bucket, region });
  }

  async upload(fileKey: string, buffer: Buffer, mimeType: string): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      Body: buffer,
      ContentType: mimeType,
      // Bucket is private by default — no ACL needed
    });

    await this.client.send(command);
    logger.info({ event: 'S3_UPLOAD', fileKey });

    return {
      fileKey,
      url: `s3://${this.bucket}/${fileKey}`, // internal reference only; access via signed URL
    };
  }

  async getSignedUrl(fileKey: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    logger.info({ event: 'S3_SIGNED_URL', fileKey, expiresInSeconds });
    return url;
  }

  async delete(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });

    await this.client.send(command);
    logger.info({ event: 'S3_DELETE', fileKey });
  }
}
