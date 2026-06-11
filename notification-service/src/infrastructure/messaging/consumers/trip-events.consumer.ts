import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka } from 'kafkajs';
import { NotificationService } from '../../../application/notification/notification.service';
import { UserServiceAdapter } from '../../external/user-service.adapter';

// ── Inbound payload shapes (mirrors trip-service domain events) ──────────────

interface TripCreatedPayload {
  eventType: 'trip.created';
  eventId: string;
  tripId: string;
  passenger: { id: string };
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  requestedVehicleType: string;
  predictedPrice: number;
  occurredAt: string;
}

interface TripStartedPayload {
  eventType: 'trip.started';
  eventId: string;
  tripId: string;
  rider: { id: string };
  agreedPrice: number;
  occurredAt: string;
}

interface TripCompletedPayload {
  eventType: 'trip.completed';
  eventId: string;
  tripId: string;
  passengerId: string;
  riderId: string;
  payment: { amount: number; currency: string; status: string };
  occurredAt: string;
}

interface TripCancelledPayload {
  eventType: 'trip.cancelled';
  eventId: string;
  tripId: string;
  cancelledBy: string;
  cancellationReason: string;
  occurredAt: string;
}

interface TripBroadcastLockedPayload {
  eventType: 'trip.broadcast_locked';
  eventId: string;
  tripId: string;
  rider: { id: string };
  vehicle: { type: string; licensePlate: string };
  agreedPrice: number;
  deliveryId: string | null;
  occurredAt: string;
}

interface TripBroadcastReleasedPayload {
  eventType: 'trip.broadcast_released';
  eventId: string;
  tripId: string;
  rider: { id: string };
  occurredAt: string;
}

interface TripHandedOffPayload {
  eventType: 'trip.handed_off';
  eventId: string;
  tripId: string;
  fromRider: { id: string };
  toRider: { id: string };
  newVehicle: { type: string; licensePlate: string };
  occurredAt: string;
}

interface TripDisputedPayload {
  eventType: 'trip.disputed';
  eventId: string;
  tripId: string;
  flaggedBy: { id: string };
  reason: string;
  occurredAt: string;
}

type TripEvent =
  | TripCreatedPayload
  | TripStartedPayload
  | TripCompletedPayload
  | TripCancelledPayload
  | TripBroadcastLockedPayload
  | TripBroadcastReleasedPayload
  | TripHandedOffPayload
  | TripDisputedPayload;

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class TripEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TripEventsConsumer.name);
  private consumer!: Consumer;

  constructor(
    private readonly notifications: NotificationService,
    private readonly userService: UserServiceAdapter,
  ) {}

  async onModuleInit(): Promise<void> {
    const kafka = new Kafka({
      clientId: 'notification-service-trip-consumer',
      brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
      retry: { retries: 10 },
    });

    this.consumer = kafka.consumer({ groupId: 'notification-service-trip' });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'trip.events', fromBeginning: false });
    await this.consumer.run({ eachMessage: ({ message }) => this.dispatch(message) });

    this.logger.log('Listening on trip.events');
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer?.disconnect();
  }

  private async dispatch(message: { value: Buffer | null }): Promise<void> {
    if (!message.value) return;

    let payload: TripEvent;
    try {
      payload = JSON.parse(message.value.toString()) as TripEvent;
    } catch {
      this.logger.warn('Received non-JSON message on trip.events — skipping');
      return;
    }

    this.logger.debug(`trip.events received: ${payload.eventType} (trip: ${payload.tripId})`);

    try {
      switch (payload.eventType) {
        case 'trip.created':
          await this.onTripCreated(payload);
          break;
        case 'trip.started':
          await this.onTripStarted(payload);
          break;
        case 'trip.completed':
          await this.onTripCompleted(payload);
          break;
        case 'trip.cancelled':
          await this.onTripCancelled(payload);
          break;
        case 'trip.broadcast_locked':
          await this.onBroadcastLocked(payload);
          break;
        case 'trip.broadcast_released':
          await this.onBroadcastReleased(payload);
          break;
        case 'trip.handed_off':
          await this.onHandedOff(payload);
          break;
        case 'trip.disputed':
          await this.onDisputed(payload);
          break;
        default:
          this.logger.debug(`Unhandled trip event type: ${(payload as any).eventType}`);
      }
    } catch (err) {
      this.logger.error(`Error handling ${payload.eventType} for trip ${payload.tripId}: ${(err as Error).message}`);
    }
  }

  private async onTripCreated(p: TripCreatedPayload): Promise<void> {
    const passenger = await this.userService.getUserById(p.passenger.id);
    if (!passenger?.email) {
      this.logger.warn(`trip.created: no email for passenger ${p.passenger.id}`);
      return;
    }
    await this.notifications.notifyTripCreated(passenger.email, p.tripId);
  }

  private async onTripStarted(p: TripStartedPayload): Promise<void> {
    // Rider is confirmed — notify them the trip is officially started
    const rider = await this.userService.getRiderById(p.rider.id);
    if (!rider?.phone) {
      this.logger.warn(`trip.started: no phone for rider ${p.rider.id}`);
      return;
    }
    await this.notifications.sendSms(
      rider.phone,
      `Trip #${p.tripId} has officially started. Agreed price: $${p.agreedPrice.toFixed(2)}. Safe travels!`,
    );
  }

  private async onTripCompleted(p: TripCompletedPayload): Promise<void> {
    const [passenger, rider] = await Promise.all([
      this.userService.getUserById(p.passengerId),
      this.userService.getRiderById(p.riderId),
    ]);

    const amount = p.payment?.amount ?? 0;

    if (passenger?.email && rider?.phone) {
      await this.notifications.notifyTripCompleted(passenger.email, rider.phone, p.tripId, amount);
    } else {
      if (passenger?.email) {
        await this.notifications.sendEmail(
          passenger.email,
          'Your trip has been completed',
          `Your trip #${p.tripId} has been completed. Payment of $${amount.toFixed(2)} processed.`,
        );
      }
      if (rider?.phone) {
        await this.notifications.sendSms(
          rider.phone,
          `Trip #${p.tripId} completed. Payment of $${amount.toFixed(2)} released.`,
        );
      }
    }
  }

  private async onTripCancelled(p: TripCancelledPayload): Promise<void> {
    // trip.cancelled event only carries tripId and who cancelled — no user IDs.
    // Log for audit; a future enhancement could enrich with trip-service lookup.
    this.logger.warn(
      `trip.cancelled: trip=${p.tripId}, by=${p.cancelledBy}, reason="${p.cancellationReason}". ` +
      `No user IDs in event — cancellation notification skipped.`,
    );
  }

  private async onBroadcastLocked(p: TripBroadcastLockedPayload): Promise<void> {
    const rider = await this.userService.getRiderById(p.rider.id);
    if (!rider?.phone) {
      this.logger.warn(`trip.broadcast_locked: no phone for rider ${p.rider.id}`);
      return;
    }
    await this.notifications.notifyRiderAssigned(rider.phone, p.tripId, p.deliveryId, p.agreedPrice);
  }

  private async onBroadcastReleased(p: TripBroadcastReleasedPayload): Promise<void> {
    const rider = await this.userService.getRiderById(p.rider.id);
    if (!rider?.phone) return;
    await this.notifications.sendSms(
      rider.phone,
      `Your assignment for trip #${p.tripId} has been released. You are now available for new trips.`,
    );
  }

  private async onHandedOff(p: TripHandedOffPayload): Promise<void> {
    const [fromRider, toRider] = await Promise.all([
      this.userService.getRiderById(p.fromRider.id),
      this.userService.getRiderById(p.toRider.id),
    ]);
    if (!fromRider?.phone || !toRider?.phone) {
      this.logger.warn(`trip.handed_off: missing phone(s) for handoff on trip ${p.tripId}`);
      return;
    }
    await this.notifications.notifyRiderHandedOff(fromRider.phone, toRider.phone, p.tripId);
  }

  private async onDisputed(p: TripDisputedPayload): Promise<void> {
    this.logger.warn(
      `DISPUTE flagged — trip=${p.tripId}, by=${p.flaggedBy.id}, reason="${p.reason}"`,
    );
    // In production: page on-call, send alert to support dashboard, etc.
  }
}
