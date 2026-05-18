import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/domain/user/entities/user.entity';
import { Vehicle } from 'src/domain/rider/value-objects/vehicle.vo';

export class TripHandedOffEvent {
  readonly eventType = 'trip.handed_off';
  readonly eventId: string;

  constructor(
    public readonly tripId: string,
    public readonly fromRider: User,
    public readonly toRider: User,
    public readonly newVehicle: Vehicle,
    public readonly occurredAt: Date = new Date(),
  ) {
    this.eventId = uuidv4();
  }
}
