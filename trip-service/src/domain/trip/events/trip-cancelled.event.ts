import { v4 as uuidv4 } from 'uuid';
import { CancelledBy } from '../enums/cancelled-by.enum';

export class TripCancelledEvent {
  readonly eventType = 'trip.cancelled';
  readonly eventId: string;

  constructor(
    public readonly tripId: string,
    public readonly cancelledBy: CancelledBy,
    public readonly cancellationReason: string,
    public readonly occurredAt: Date = new Date(),
  ) {
    this.eventId = uuidv4();
  }
}
