import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kafka, Consumer } from 'kafkajs';
import { TripService } from 'src/application/trip/trip.service';
import { ProcessedEventOrmEntity } from 'src/inflastructure/persistence/typeorm/entities/processed-event.orm-entity';
import { ConflictException } from 'src/domain/shared/exceptions/conflict.exception';

interface DeliveryCreatedPayload {
  eventId: string;
  eventType: string;
  deliveryId: string;
  trackingNumber: string;
  senderId: string;
  recipientPhone: string;
  pickupLocation: { lat: number; lng: number; address: string };
  dropoffLocation: { lat: number; lng: number; address: string };
  packageDetails: {
    description: string;
    weightKg: number;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
    isFragile: boolean;
  };
}

@Injectable()
export class DeliveryCreatedConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeliveryCreatedConsumer.name);
  private consumer!: Consumer;

  constructor(
    private readonly tripService: TripService,
    @InjectRepository(ProcessedEventOrmEntity)
    private readonly processedRepo: Repository<ProcessedEventOrmEntity>,
  ) {}

  async onModuleInit() {
    const kafka = new Kafka({
      clientId: 'trip-service-consumer',
      brokers: [(process.env.KAFKA_BROKER ?? 'localhost:9092')],
      retry: { retries: 10 },
    });
    this.consumer = kafka.consumer({ groupId: 'trip-service' });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'delivery.events', fromBeginning: false });
    await this.consumer.run({ eachMessage: ({ message }) => this.dispatch(message) });
    this.logger.log('Listening on delivery.events');
  }

  async onModuleDestroy() {
    await this.consumer?.disconnect();
  }

  private async dispatch(message: { value: Buffer | null }) {
    if (!message.value) return;
    const payload = JSON.parse(message.value.toString()) as DeliveryCreatedPayload;
    if (payload.eventType !== 'delivery.created') return;

    const already = await this.processedRepo.findOneBy({ eventId: payload.eventId });
    if (already) {
      this.logger.debug(`Event ${payload.eventId} already processed — skipping`);
      return;
    }

    try {
      await this.tripService.createTripFromDelivery({
        deliveryId: payload.deliveryId,
        senderId: payload.senderId,
        pickupLocation: payload.pickupLocation,
        dropoffLocation: payload.dropoffLocation,
        packageDetails: payload.packageDetails,
      });

      await this.processedRepo.save({
        eventId: payload.eventId,
        eventType: payload.eventType,
        processedAt: new Date(),
      });

      this.logger.log(`Auto-created PACKAGE trip for delivery ${payload.deliveryId}`);
    } catch (err) {
      if (err instanceof ConflictException) {
        // The trip for this delivery was already created (e.g. directly by the
        // client). Treat as handled so this event isn't retried forever.
        this.logger.warn(
          `Skipping auto-create for delivery ${payload.deliveryId}: ${(err as Error).message}`,
        );
        await this.processedRepo.save({
          eventId: payload.eventId,
          eventType: payload.eventType,
          processedAt: new Date(),
        });
        return;
      }

      this.logger.error(`Failed to auto-create trip: ${(err as Error).message}`);
      throw err;
    }
  }
}
