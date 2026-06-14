import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { IStoragePort } from 'src/application/delivery/ports/out/storage.port';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');

@Injectable()
export class LocalStorageAdapter implements IStoragePort {
  async uploadFile(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    void mimeType;
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';
    const storedName = `${Date.now()}-${randomUUID()}${ext}`;
    await fs.writeFile(join(UPLOADS_DIR, storedName), buffer);
    return `/deliveries/uploads/${storedName}`;
  }
}
