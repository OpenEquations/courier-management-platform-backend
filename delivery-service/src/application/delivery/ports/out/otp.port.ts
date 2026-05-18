export interface IOtpPort {
  generate(deliveryId: string): Promise<string>;
  verify(deliveryId: string, otp: string): Promise<boolean>;
}
