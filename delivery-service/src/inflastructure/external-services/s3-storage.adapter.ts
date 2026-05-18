import { Injectable } from '@nestjs/common';
import { IStoragePort } from 'src/application/delivery/ports/out/storage.port';

@Injectable()
export class S3StorageAdapter implements IStoragePort {
  async uploadFile(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    // TODO: implement S3/compatible object storage upload
    void buffer; void fileName; void mimeType;
    throw new Error('S3 storage is not configured');
  }
}
