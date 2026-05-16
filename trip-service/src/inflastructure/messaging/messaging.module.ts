import { Module } from '@nestjs/common';
import { TripEventPublisher } from './publishers/trip-event.publisher';
import { RiderAvailabilityConsumer } from './consumers/rider-availability.consumer';

@Module({
  providers: [
    TripEventPublisher,
    RiderAvailabilityConsumer,
    { provide: 'IEventPublisherPort', useClass: TripEventPublisher },
  ],
  exports: ['IEventPublisherPort'],
})
export class MessagingModule {}
