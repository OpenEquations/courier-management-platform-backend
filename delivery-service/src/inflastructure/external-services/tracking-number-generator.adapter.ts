import { Injectable } from '@nestjs/common';
import { ITrackingNumberGeneratorPort } from 'src/application/delivery/ports/out/tracking-number-generator.port';

@Injectable()
export class TrackingNumberGeneratorAdapter implements ITrackingNumberGeneratorPort {
  private static readonly CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  generate(): string {
    let suffix = '';
    for (let i = 0; i < 10; i++) {
      suffix += TrackingNumberGeneratorAdapter.CHARS.charAt(
        Math.floor(Math.random() * TrackingNumberGeneratorAdapter.CHARS.length),
      );
    }
    return `DLV-${suffix}`;
  }
}
