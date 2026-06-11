import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { NotificationService } from '../../../application/notification/notification.service';
import { UserServiceAdapter } from '../../external/user-service.adapter';

interface RiderOfferDispatchedPayload {
  eventType: 'rider.offer.dispatched';
  eventId: string;
  tripId: string;
  passengerId: string;
  riderIds: string[];
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  vehicleType: string;
  predictedPrice: number;
  occurredAt: string;
}

@Injectable()
export class MatchingEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchingEventsConsumer.name);
  private consumer!: Consumer;

  constructor(
    private readonly notifications: NotificationService,
    private readonly userService: UserServiceAdapter,
  ) {}

  async onModuleInit(): Promise<void> {
    const kafka = new Kafka({
      clientId: 'notification-service-matching-consumer',
      brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
      retry: { retries: 10 },
    });

    this.consumer = kafka.consumer({ groupId: 'notification-service-matching' });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'matching.events', fromBeginning: false });
    await this.consumer.run({ eachMessage: ({ message }) => this.dispatch(message) });

    this.logger.log('Listening on matching.events');
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer?.disconnect();
  }

  private async dispatch(message: { value: Buffer | null }): Promise<void> {
    if (!message.value) return;

    let payload: RiderOfferDispatchedPayload;
    try {
      payload = JSON.parse(message.value.toString()) as RiderOfferDispatchedPayload;
    } catch {
      this.logger.warn('Received non-JSON message on matching.events — skipping');
      return;
    }

    if (payload.eventType !== 'rider.offer.dispatched') return;

    this.logger.debug(
      `matching.events: ${payload.riderIds.length} rider(s) offered for trip ${payload.tripId}`,
    );

    try {
      await this.onRiderOfferDispatched(payload);
    } catch (err) {
      this.logger.error(`Error handling rider.offer.dispatched for trip ${payload.tripId}: ${(err as Error).message}`);
    }
  }

  private async onRiderOfferDispatched(p: RiderOfferDispatchedPayload): Promise<void> {
    // Notify the passenger that riders are being matched
    const passenger = await this.userService.getUserById(p.passengerId);
    if (!passenger?.email) {
      this.logger.warn(`rider.offer.dispatched: no email for passenger ${p.passengerId}`);
      return;
    }

    await this.notifications.notifyRidersOffered(passenger.email, p.tripId, p.riderIds.length);
  }
}
