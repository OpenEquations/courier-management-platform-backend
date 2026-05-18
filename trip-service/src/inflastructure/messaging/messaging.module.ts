import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripEventPublisher } from './publishers/trip-event.publisher';
import { KafkaOutboxPoller } from './kafka-outbox.poller';
import { RiderAvailabilityConsumer } from './consumers/rider-availability.consumer';
import { OutboxEventOrmEntity } from 'src/inflastructure/persistence/typeorm/entities/outbox-event.orm-entity';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEventOrmEntity])],
  providers: [
    TripEventPublisher,
    KafkaOutboxPoller,
    RiderAvailabilityConsumer,
    { provide: 'IEventPublisherPort', useClass: TripEventPublisher },
  ],
  exports: ['IEventPublisherPort'],
})
export class MessagingModule {}
