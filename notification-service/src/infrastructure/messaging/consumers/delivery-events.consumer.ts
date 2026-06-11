import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { NotificationService } from '../../../application/notification/notification.service';
import { UserServiceAdapter } from '../../external/user-service.adapter';

// ── Inbound payload shapes (mirrors delivery-service domain events) ───────────

interface DeliveryCreatedPayload {
  eventType: 'delivery.created';
  eventId: string;
  deliveryId: string;
  trackingNumber: string;
  senderId: string;
  recipientPhone: string;
  pickupLocation: { lat: number; lng: number; address: string };
  dropoffLocation: { lat: number; lng: number; address: string };
  packageDetails: {
    description: string;
    weightKg: number;
    isFragile: boolean;
  };
  occurredAt: string;
}

interface DeliveryPickedUpPayload {
  eventType: 'delivery.picked_up';
  eventId: string;
  deliveryId: string;
  trackingNumber: string;
  riderId: string;
  tripId: string;
  occurredAt: string;
}

interface DeliveryDeliveredPayload {
  eventType: 'delivery.delivered';
  eventId: string;
  deliveryId: string;
  trackingNumber: string;
  riderId: string;
  tripId: string | null;
  hasCod: boolean;
  occurredAt: string;
}

interface DeliveryAttemptFailedPayload {
  eventType: 'delivery.attempt_failed';
  eventId: string;
  deliveryId: string;
  trackingNumber: string;
  riderId: string;
  reason: string;
  attemptCount: number;
  occurredAt: string;
}

interface DeliveryReturnedPayload {
  eventType: 'delivery.returned';
  eventId: string;
  deliveryId: string;
  trackingNumber: string;
  senderId: string;
  reason: string;
  occurredAt: string;
}

interface DeliveryCancelledPayload {
  eventType: 'delivery.cancelled';
  eventId: string;
  deliveryId: string;
  trackingNumber: string;
  reason: string;
  occurredAt: string;
}

interface CodCollectedPayload {
  eventType: 'delivery.cod_collected';
  eventId: string;
  deliveryId: string;
  trackingNumber: string;
  riderId: string;
  amount: number;
  occurredAt: string;
}

type DeliveryEvent =
  | DeliveryCreatedPayload
  | DeliveryPickedUpPayload
  | DeliveryDeliveredPayload
  | DeliveryAttemptFailedPayload
  | DeliveryReturnedPayload
  | DeliveryCancelledPayload
  | CodCollectedPayload;

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Holds the recipient phone for a delivery so that subsequent events
 * (picked_up, delivered, failed) can notify the recipient even though
 * those events only carry deliveryId and trackingNumber.
 *
 * This in-process cache is intentionally simple — a Redis cache or
 * dedicated read-model would be appropriate in production.
 */
const recipientPhoneCache = new Map<string, string>();

@Injectable()
export class DeliveryEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeliveryEventsConsumer.name);
  private consumer!: Consumer;

  constructor(
    private readonly notifications: NotificationService,
    private readonly userService: UserServiceAdapter,
  ) {}

  async onModuleInit(): Promise<void> {
    const kafka = new Kafka({
      clientId: 'notification-service-delivery-consumer',
      brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
      retry: { retries: 10 },
    });

    this.consumer = kafka.consumer({ groupId: 'notification-service-delivery' });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'delivery.events', fromBeginning: false });
    await this.consumer.run({ eachMessage: ({ message }) => this.dispatch(message) });

    this.logger.log('Listening on delivery.events');
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer?.disconnect();
  }

  private async dispatch(message: { value: Buffer | null }): Promise<void> {
    if (!message.value) return;

    let payload: DeliveryEvent;
    try {
      payload = JSON.parse(message.value.toString()) as DeliveryEvent;
    } catch {
      this.logger.warn('Received non-JSON message on delivery.events — skipping');
      return;
    }

    this.logger.debug(`delivery.events received: ${payload.eventType} (delivery: ${payload.deliveryId})`);

    try {
      switch (payload.eventType) {
        case 'delivery.created':
          await this.onDeliveryCreated(payload);
          break;
        case 'delivery.picked_up':
          await this.onDeliveryPickedUp(payload);
          break;
        case 'delivery.delivered':
          await this.onDeliveryDelivered(payload);
          break;
        case 'delivery.attempt_failed':
          await this.onDeliveryAttemptFailed(payload);
          break;
        case 'delivery.returned':
          await this.onDeliveryReturned(payload);
          break;
        case 'delivery.cancelled':
          await this.onDeliveryCancelled(payload);
          break;
        case 'delivery.cod_collected':
          await this.onCodCollected(payload);
          break;
        default:
          this.logger.debug(`Unhandled delivery event type: ${(payload as any).eventType}`);
      }
    } catch (err) {
      this.logger.error(
        `Error handling ${payload.eventType} for delivery ${payload.deliveryId}: ${(err as Error).message}`,
      );
    }
  }

  private async onDeliveryCreated(p: DeliveryCreatedPayload): Promise<void> {
    // Cache recipient phone for subsequent events
    recipientPhoneCache.set(p.deliveryId, p.recipientPhone);

    // Notify the recipient that a package is on its way
    await this.notifications.notifyDeliveryCreated(
      p.recipientPhone,
      p.trackingNumber,
      p.dropoffLocation.address,
    );

    // Notify the sender that their delivery has been registered
    const sender = await this.userService.getUserById(p.senderId);
    if (sender?.email) {
      await this.notifications.sendEmail(
        sender.email,
        'Your delivery has been registered',
        `Your delivery (${p.trackingNumber}) has been successfully registered. The recipient will be notified once a rider picks it up.`,
        `<p>Your delivery <strong>${p.trackingNumber}</strong> has been registered.</p><p>The recipient will be notified when the package is on the way.</p>`,
      );
    }
  }

  private async onDeliveryPickedUp(p: DeliveryPickedUpPayload): Promise<void> {
    const recipientPhone = recipientPhoneCache.get(p.deliveryId);
    if (!recipientPhone) {
      this.logger.warn(`delivery.picked_up: no cached phone for delivery ${p.deliveryId}`);
      return;
    }
    await this.notifications.notifyDeliveryPickedUp(recipientPhone, p.trackingNumber);
  }

  private async onDeliveryDelivered(p: DeliveryDeliveredPayload): Promise<void> {
    const recipientPhone = recipientPhoneCache.get(p.deliveryId);
    if (!recipientPhone) {
      this.logger.warn(`delivery.delivered: no cached phone for delivery ${p.deliveryId}`);
      return;
    }
    await this.notifications.notifyDeliveryDelivered(recipientPhone, p.trackingNumber);

    // Notify the rider with COD reminder if applicable
    if (p.hasCod) {
      const rider = await this.userService.getRiderById(p.riderId);
      if (rider?.phone) {
        await this.notifications.sendSms(
          rider.phone,
          `Delivery ${p.trackingNumber} completed. Remember to remit the collected COD amount to the platform.`,
        );
      }
    }

    // Clean up the cache
    recipientPhoneCache.delete(p.deliveryId);
  }

  private async onDeliveryAttemptFailed(p: DeliveryAttemptFailedPayload): Promise<void> {
    const recipientPhone = recipientPhoneCache.get(p.deliveryId);
    if (!recipientPhone) {
      this.logger.warn(`delivery.attempt_failed: no cached phone for delivery ${p.deliveryId}`);
      return;
    }
    await this.notifications.notifyDeliveryFailed(recipientPhone, p.trackingNumber, p.reason, p.attemptCount);
  }

  private async onDeliveryReturned(p: DeliveryReturnedPayload): Promise<void> {
    const sender = await this.userService.getUserById(p.senderId);
    if (!sender?.email) {
      this.logger.warn(`delivery.returned: no email for sender ${p.senderId}`);
      return;
    }
    await this.notifications.notifyDeliveryReturned(sender.email, p.trackingNumber, p.reason);
    recipientPhoneCache.delete(p.deliveryId);
  }

  private async onDeliveryCancelled(p: DeliveryCancelledPayload): Promise<void> {
    this.logger.warn(`Delivery ${p.trackingNumber} cancelled — reason: "${p.reason}"`);
    recipientPhoneCache.delete(p.deliveryId);
  }

  private async onCodCollected(p: CodCollectedPayload): Promise<void> {
    const rider = await this.userService.getRiderById(p.riderId);
    if (!rider?.phone) return;
    await this.notifications.sendSms(
      rider.phone,
      `COD of $${p.amount.toFixed(2)} collected for delivery ${p.trackingNumber}. Please remit this to the platform within 24 hours.`,
    );
  }
}
