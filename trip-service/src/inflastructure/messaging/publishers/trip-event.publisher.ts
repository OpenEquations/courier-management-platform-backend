import { Injectable, Logger } from '@nestjs/common';
import type { IEventPublisherPort } from 'src/application/trip/ports/out/event-publisher.port';

@Injectable()
export class TripEventPublisher implements IEventPublisherPort {
  private readonly logger = new Logger(TripEventPublisher.name);

  async publish<T extends object>(event: T): Promise<void> {
    const eventName = event.constructor.name;
    this.logger.log(`Publishing event: ${eventName} — ${JSON.stringify(event)}`);
    // TODO: wire up Kafka / RabbitMQ / NATS transport here
  }
}
