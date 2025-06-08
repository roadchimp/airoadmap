import { put, del } from '@vercel/blob';
import { BLOB_READ_WRITE_TOKEN } from '../config';

export class BlobStorage {
  private static instance: BlobStorage;
  private token: string;

  private constructor() {
    this.token = BLOB_READ_WRITE_TOKEN;
  }

  public static getInstance(): BlobStorage {
    if (!BlobStorage.instance) {
      BlobStorage.instance = new BlobStorage();
    }
    return BlobStorage.instance;
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    const blob = await put(filename, file, {
      access: 'public',
      token: this.token,
    });
    return blob.url;
  }

  async deleteFile(url: string): Promise<void> {
    await del(url, { token: this.token });
  }
} 