import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IEventPublisherPort } from 'src/application/trip/ports/out/event-publisher.port';
import { OutboxEventOrmEntity } from 'src/inflastructure/persistence/typeorm/entities/outbox-event.orm-entity';

@Injectable()
export class TripEventPublisher implements IEventPublisherPort {
  constructor(
    @InjectRepository(OutboxEventOrmEntity)
    private readonly outboxRepo: Repository<OutboxEventOrmEntity>,
  ) {}

  async publish<T extends object>(event: T): Promise<void> {
    const e = event as { eventId?: string; eventType?: string; tripId?: string };
    const row = this.outboxRepo.create({
      id: e.eventId ?? crypto.randomUUID(),
      eventType: e.eventType ?? event.constructor.name,
      aggregateId: e.tripId ?? 'unknown',
      payload: event,
      published: false,
    });
    await this.outboxRepo.save(row);
  }
}
