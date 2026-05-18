import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/domain/user/entities/user.entity';

export class TripDisputedEvent {
  readonly eventType = 'trip.disputed';
  readonly eventId: string;

  constructor(
    public readonly tripId: string,
    public readonly flaggedBy: User,
    public readonly reason: string,
    public readonly occurredAt: Date = new Date(),
  ) {
    this.eventId = uuidv4();
  }
}
