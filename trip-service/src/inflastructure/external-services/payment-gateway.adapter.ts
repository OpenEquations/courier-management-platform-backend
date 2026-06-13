import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios';
import type { IPaymentGatewayPort } from 'src/application/trip/ports/out/payment-gateway.port';
import { ConflictException } from 'src/domain/shared/exceptions/conflict.exception';

const CURRENCY = 'USD';

@Injectable()
export class PaymentGatewayAdapter implements IPaymentGatewayPort {
  private readonly logger = new Logger(PaymentGatewayAdapter.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl = configService.getOrThrow<string>('PAYMENT_SERVICE_URL');
  }

  async hold(userId: string, amount: number, currency: string = CURRENCY): Promise<string> {
    this.logger.log(`Hold ${amount} ${currency} for user ${userId}`);
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/transactions/hold`, { userId, amount, currency }),
      );
      return data.id;
    } catch (e) {
      if (isAxiosError(e) && e.response) {
        const message = (e.response.data as { message?: string })?.message ?? 'Payment hold failed';
        throw new ConflictException(message);
      }
      throw e;
    }
  }

  async release(transactionId: string): Promise<void> {
    this.logger.log(`Release transaction ${transactionId}`);
    await firstValueFrom(this.httpService.post(`${this.baseUrl}/transactions/${transactionId}/release`));
  }

  async refund(transactionId: string): Promise<void> {
    this.logger.log(`Refund transaction ${transactionId}`);
    await firstValueFrom(this.httpService.post(`${this.baseUrl}/transactions/${transactionId}/refund`));
  }

  async payout(userId: string, amount: number, currency: string = CURRENCY): Promise<void> {
    this.logger.log(`Payout ${amount} ${currency} to user ${userId}`);
    await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/accounts/payout`, { userId, amount, currency }),
    );
  }
}
