import { StorageProvider } from './storage.interface';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (instance) return instance;

  const provider = process.env.STORAGE_PROVIDER || 'local';

  if (provider === 's3') {
    instance = new S3StorageProvider();
  } else {
    instance = new LocalStorageProvider();
  }

  return instance;
}
