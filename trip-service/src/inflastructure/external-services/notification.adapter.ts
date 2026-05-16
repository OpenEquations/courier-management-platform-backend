import { Injectable, Logger } from '@nestjs/common';
import type { INotificationPort } from 'src/application/trip/ports/out/notification.port';

@Injectable()
export class NotificationAdapter implements INotificationPort {
  private readonly logger = new Logger(NotificationAdapter.name);

  async notifyUser(userId: string, message: string, data?: Record<string, unknown>): Promise<void> {
    this.logger.log(`Notify user ${userId}: ${message}`);
    // TODO: call notification-service
  }

  async notifyRider(riderId: string, message: string, data?: Record<string, unknown>): Promise<void> {
    this.logger.log(`Notify rider ${riderId}: ${message}`);
    // TODO: call notification-service
  }
}
