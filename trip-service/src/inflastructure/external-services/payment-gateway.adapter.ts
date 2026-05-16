import { Injectable, Logger } from '@nestjs/common';
import type { IPaymentGatewayPort } from 'src/application/trip/ports/out/payment-gateway.port';

@Injectable()
export class PaymentGatewayAdapter implements IPaymentGatewayPort {
  private readonly logger = new Logger(PaymentGatewayAdapter.name);

  async hold(userId: string, amount: number, currency: string): Promise<string> {
    this.logger.log(`Hold ${amount} ${currency} for user ${userId}`);
    // TODO: call payment-service
    return 'txn-placeholder';
  }

  async release(transactionId: string): Promise<void> {
    this.logger.log(`Release transaction ${transactionId}`);
    // TODO: call payment-service
  }

  async refund(transactionId: string): Promise<void> {
    this.logger.log(`Refund transaction ${transactionId}`);
    // TODO: call payment-service
  }
}
