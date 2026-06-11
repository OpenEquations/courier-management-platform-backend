import { Module } from '@nestjs/common';
import { NotificationModule } from '../../application/notification/notification.module';
import { UserServiceAdapter } from '../external/user-service.adapter';
import { TripEventsConsumer } from './consumers/trip-events.consumer';
import { DeliveryEventsConsumer } from './consumers/delivery-events.consumer';
import { MatchingEventsConsumer } from './consumers/matching-events.consumer';

@Module({
  imports: [NotificationModule],
  providers: [
    UserServiceAdapter,
    TripEventsConsumer,
    DeliveryEventsConsumer,
    MatchingEventsConsumer,
  ],
})
export class MessagingModule {}
