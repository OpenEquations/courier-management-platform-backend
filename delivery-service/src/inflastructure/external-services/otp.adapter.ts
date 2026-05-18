import { Injectable } from '@nestjs/common';
import { IOtpPort } from 'src/application/delivery/ports/out/otp.port';

@Injectable()
export class OtpAdapter implements IOtpPort {
  async generate(deliveryId: string): Promise<string> {
    // TODO: store and return a real OTP
    void deliveryId;
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async verify(deliveryId: string, otp: string): Promise<boolean> {
    // TODO: verify against stored OTP
    void deliveryId;
    void otp;
    return false;
  }
}
