import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { TripBroadcastGateway } from 'src/presentation/gateways/trip-broadcast.gateway';

interface RiderOfferDispatchedPayload {
  eventType: string;
  tripId: string;
  passengerId: string;
  riderIds: string[];
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  vehicleType: string;
  predictedPrice: number;
}

@Injectable()
export class RiderOfferConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RiderOfferConsumer.name);
  private consumer!: Consumer;

  constructor(private readonly gateway: TripBroadcastGateway) {}

  async onModuleInit() {
    const kafka = new Kafka({
      clientId: 'trip-service-matching-consumer',
      brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
      retry: { retries: 10 },
    });
    this.consumer = kafka.consumer({ groupId: 'trip-service-matching' });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'matching.events', fromBeginning: false });
    await this.consumer.run({ eachMessage: ({ message }) => this.dispatch(message) });
    this.logger.log('Listening on matching.events');
  }

  async onModuleDestroy() {
    await this.consumer?.disconnect();
  }

  private async dispatch(message: { value: Buffer | null }): Promise<void> {
    if (!message.value) return;
    const payload = JSON.parse(message.value.toString()) as RiderOfferDispatchedPayload;
    if (payload.eventType !== 'rider.offer.dispatched') return;

    this.gateway.pushTripOfferToRiders(payload.riderIds, {
      tripId: payload.tripId,
      origin: payload.origin,
      destination: payload.destination,
      vehicleType: payload.vehicleType,
      predictedPrice: payload.predictedPrice,
    });
  }
}
