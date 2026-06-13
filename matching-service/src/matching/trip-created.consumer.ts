import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { MatchingService } from './matching.service';

interface TripCreatedPayload {
  eventType: string;
  tripId: string;
  passenger: { id: string };
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  type: string;
  requestedVehicleType: string;
  predictedPrice: number;
}

@Injectable()
export class TripCreatedConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TripCreatedConsumer.name);
  private consumer!: Consumer;

  constructor(private readonly matchingService: MatchingService) {}

  async onModuleInit() {
    const kafka = new Kafka({
      clientId: 'matching-service-consumer',
      brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
      retry: { retries: 10 },
    });
    this.consumer = kafka.consumer({ groupId: 'matching-service' });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'trip.events', fromBeginning: false });
    await this.consumer.run({ eachMessage: ({ message }) => this.dispatch(message) });
    this.logger.log('Listening on trip.events');
  }

  async onModuleDestroy() {
    await this.consumer?.disconnect();
  }

  private async dispatch(message: { value: Buffer | null }): Promise<void> {
    if (!message.value) return;
    const payload = JSON.parse(message.value.toString()) as TripCreatedPayload;
    if (payload.eventType !== 'trip.created') return;

    try {
      await this.matchingService.handleTripCreated({
        tripId: payload.tripId,
        passengerId: payload.passenger.id,
        originLat: payload.origin.lat,
        originLng: payload.origin.lng,
        originAddress: payload.origin.address,
        destinationLat: payload.destination.lat,
        destinationLng: payload.destination.lng,
        destinationAddress: payload.destination.address,
        type: payload.type,
        vehicleType: payload.requestedVehicleType,
        predictedPrice: payload.predictedPrice,
      });
    } catch (err) {
      this.logger.error(`Matching failed for trip ${payload.tripId}: ${(err as Error).message}`);
    }
  }
}
