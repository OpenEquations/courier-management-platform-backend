import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { TripCreatedConsumer } from './trip-created.consumer';
import { RiderOfferPublisher } from './rider-offer.publisher';
import { GeoAdapter } from './geo.adapter';
import { UserAdapter } from './user.adapter';

@Module({
  providers: [
    MatchingService,
    TripCreatedConsumer,
    RiderOfferPublisher,
    GeoAdapter,
    UserAdapter,
  ],
})
export class MatchingModule {}
