import { v4 as uuidv4 } from 'uuid';

export class TripBroadcastReleasedEvent {
  readonly eventType = 'trip.broadcast_released';
  readonly eventId: string;

  constructor(
    public readonly tripId: string,
    public readonly deliveryId: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {
    this.eventId = uuidv4();
  }
}
