import { Trip } from '../entities/trip.entity';
import { BroadcastStatus } from '../enums/broadcast-status.enum';
import { TripStatus } from '../enums/trip-status.enum';

export class OpenBroadcastSpecification {
  isSatisfiedBy(trip: Trip): boolean {
    return (
      trip.getTripStatus() === TripStatus.PENDING &&
      trip.getBroadcastStatus() === BroadcastStatus.OPEN
    );
  }
}
