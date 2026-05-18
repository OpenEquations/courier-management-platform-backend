import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

const TOPIC = 'matching.events';

export interface RiderOfferPayload {
  tripId: string;
  passengerId: string;
  riderIds: string[];
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  vehicleType: string;
  predictedPrice: number;
}

@Injectable()
export class RiderOfferPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RiderOfferPublisher.name);
  private producer!: Producer;

  async onModuleInit() {
    const kafka = new Kafka({
      clientId: 'matching-service-producer',
      brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
      retry: { retries: 10 },
    });
    this.producer = kafka.producer();
    await this.producer.connect();
    this.logger.log('Kafka producer connected');
  }

  async onModuleDestroy() {
    await this.producer?.disconnect();
  }

  async publish(payload: RiderOfferPayload): Promise<void> {
    const event = {
      eventType: 'rider.offer.dispatched',
      eventId: uuidv4(),
      ...payload,
      occurredAt: new Date().toISOString(),
    };
    await this.producer.send({
      topic: TOPIC,
      messages: [{ key: payload.tripId, value: JSON.stringify(event) }],
    });
    this.logger.log(`Offer for trip ${payload.tripId} sent to ${payload.riderIds.length} rider(s)`);
  }
}
