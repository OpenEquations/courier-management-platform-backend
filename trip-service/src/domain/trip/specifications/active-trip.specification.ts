import { Trip } from '../entities/trip.entity';
import { TripStatus } from '../enums/trip-status.enum';

const ACTIVE_STATUSES: TripStatus[] = [TripStatus.PENDING, TripStatus.ONGOING];

export class ActiveTripSpecification {
  isSatisfiedBy(trip: Trip): boolean {
    return ACTIVE_STATUSES.includes(trip.getTripStatus());
  }
}
