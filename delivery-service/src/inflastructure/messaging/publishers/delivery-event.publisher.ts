import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IEventPublisherPort } from 'src/application/delivery/ports/out/event-publisher.port';
import { OutboxEventOrmEntity } from 'src/inflastructure/persistence/typeorm/entities/outbox-event.orm-entity';

/**
 * Writes events to the outbox table instead of Kafka directly.
 * The KafkaOutboxPoller reads from this table and forwards to Kafka,
 * giving us atomic save + publish within a single DB transaction.
 */
@Injectable()
export class DeliveryEventPublisher implements IEventPublisherPort {
  constructor(
    @InjectRepository(OutboxEventOrmEntity)
    private readonly outboxRepo: Repository<OutboxEventOrmEntity>,
  ) {}

  async publish(event: object): Promise<void> {
    const e = event as { eventId: string; eventType: string; deliveryId?: string };
    const row = this.outboxRepo.create({
      id: e.eventId,
      eventType: e.eventType,
      aggregateId: e.deliveryId ?? 'unknown',
      payload: event,
      published: false,
    });
    await this.outboxRepo.save(row);
  }
}
