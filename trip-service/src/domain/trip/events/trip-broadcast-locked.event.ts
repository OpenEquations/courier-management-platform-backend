import { User } from 'src/domain/user/entities/user.entity';
import { Vehicle } from 'src/domain/rider/value-objects/vehicle.vo';

export class TripBroadcastLockedEvent {
  constructor(
    public readonly tripId: string,
    public readonly rider: User,
    public readonly vehicle: Vehicle,
    public readonly agreedPrice: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
