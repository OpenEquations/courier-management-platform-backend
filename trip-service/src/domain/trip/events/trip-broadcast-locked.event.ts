import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/domain/user/entities/user.entity';
import { Vehicle } from 'src/domain/rider/value-objects/vehicle.vo';

export class TripBroadcastLockedEvent {
  readonly eventType = 'trip.broadcast_locked';
  readonly eventId: string;

  constructor(
    public readonly tripId: string,
    public readonly rider: User,
    public readonly vehicle: Vehicle,
    public readonly agreedPrice: number,
    public readonly deliveryId: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {
    this.eventId = uuidv4();
  }
}
