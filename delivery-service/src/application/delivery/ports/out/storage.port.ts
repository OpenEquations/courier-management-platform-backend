export interface IStoragePort {
  uploadFile(buffer: Buffer, fileName: string, mimeType: string): Promise<string>;
}
