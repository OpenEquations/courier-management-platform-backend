import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kafka, Consumer } from 'kafkajs';
import { DeliveryService } from 'src/application/delivery/delivery.service';
import { ProcessedEventOrmEntity } from 'src/inflastructure/persistence/typeorm/entities/processed-event.orm-entity';

interface TripEvent {
  eventId: string;
  eventType: string;
  tripId: string;
  deliveryId: string | null;
}

/**
 * Single consumer for all trip.events.
 * One Kafka Consumer instance = one group = every message delivered exactly once to this service.
 */
@Injectable()
export class TripEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TripEventsConsumer.name);
  private consumer!: Consumer;

  constructor(
    private readonly deliveryService: DeliveryService,
    @InjectRepository(ProcessedEventOrmEntity)
    private readonly processedRepo: Repository<ProcessedEventOrmEntity>,
  ) {}

  async onModuleInit() {
    const kafka = new Kafka({
      clientId: 'delivery-service-consumer',
      brokers: [(process.env.KAFKA_BROKER ?? 'localhost:9092')],
      retry: { retries: 10 },
    });
    this.consumer = kafka.consumer({ groupId: 'delivery-service' });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'trip.events', fromBeginning: false });
    await this.consumer.run({ eachMessage: ({ message }) => this.route(message) });
    this.logger.log('Listening on trip.events');
  }

  async onModuleDestroy() {
    await this.consumer?.disconnect();
  }

  private async route(message: { value: Buffer | null }) {
    if (!message.value) return;
    const payload = JSON.parse(message.value.toString()) as TripEvent;

    switch (payload.eventType) {
      case 'trip.broadcast_locked':
        await this.handleLocked(payload);
        break;
      case 'trip.broadcast_released':
        await this.handleReleased(payload);
        break;
      // Other trip events (started, completed, cancelled…) handled here as flows are added
    }
  }

  private async handleLocked(payload: TripEvent) {
    if (!payload.deliveryId) return;
    if (await this.alreadyProcessed(payload.eventId)) return;

    try {
      await this.deliveryService.assignToTrip(payload.deliveryId, payload.tripId);
      await this.markProcessed(payload.eventId, payload.eventType);
      this.logger.log(`Delivery ${payload.deliveryId} assigned to trip ${payload.tripId}`);
    } catch (err) {
      this.logger.error(`handleLocked failed: ${(err as Error).message}`);
      throw err;
    }
  }

  private async handleReleased(payload: TripEvent) {
    if (!payload.deliveryId) return;
    if (await this.alreadyProcessed(payload.eventId)) return;

    try {
      await this.deliveryService.unassignFromTrip(payload.deliveryId);
      await this.markProcessed(payload.eventId, payload.eventType);
      this.logger.log(`Delivery ${payload.deliveryId} unassigned`);
    } catch (err) {
      this.logger.error(`handleReleased failed: ${(err as Error).message}`);
      throw err;
    }
  }

  private async alreadyProcessed(eventId: string): Promise<boolean> {
    const row = await this.processedRepo.findOneBy({ eventId });
    if (row) this.logger.debug(`Event ${eventId} already processed — skipping`);
    return !!row;
  }

  private async markProcessed(eventId: string, eventType: string): Promise<void> {
    await this.processedRepo.save({ eventId, eventType, processedAt: new Date() });
  }
}
