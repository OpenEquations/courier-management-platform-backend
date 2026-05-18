import { Injectable, Logger } from '@nestjs/common';
import { INotificationPort } from 'src/application/delivery/ports/out/notification.port';

@Injectable()
export class NotificationAdapter implements INotificationPort {
  private readonly logger = new Logger(NotificationAdapter.name);

  async notifySender(senderId: string, message: string): Promise<void> {
    // TODO: call notification-service via HTTP
    this.logger.log(`[Sender ${senderId}] ${message}`);
  }

  async notifyRecipient(phone: string, message: string): Promise<void> {
    // TODO: call notification-service via HTTP
    this.logger.log(`[Recipient ${phone}] ${message}`);
  }
}
