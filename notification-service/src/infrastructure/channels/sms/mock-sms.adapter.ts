import { Injectable, Logger } from '@nestjs/common';
import type { ISmsSenderPort, SendSmsOptions } from '../../../domain/notification/interfaces/sms-sender.port';

/**
 * Console-based SMS adapter for development.
 * Swap for a Twilio/Africa's Talking adapter in production by binding
 * SMS_SENDER_PORT to a real implementation in channels.module.ts.
 */
@Injectable()
export class MockSmsAdapter implements ISmsSenderPort {
  private readonly logger = new Logger(MockSmsAdapter.name);

  async send(options: SendSmsOptions): Promise<void> {
    this.logger.log(
      `[SMS] ┌─────────────────────────────────────────────\n` +
      `[SMS] │ TO  : ${options.to}\n` +
      `[SMS] │ BODY: ${options.body}\n` +
      `[SMS] └─────────────────────────────────────────────`,
    );
  }
}
