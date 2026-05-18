import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/domain/user/entities/user.entity';

export class TripStartedEvent {
  readonly eventType = 'trip.started';
  readonly eventId: string;

  constructor(
    public readonly tripId: string,
    public readonly rider: User,
    public readonly agreedPrice: number,
    public readonly occurredAt: Date = new Date(),
  ) {
    this.eventId = uuidv4();
  }
}
