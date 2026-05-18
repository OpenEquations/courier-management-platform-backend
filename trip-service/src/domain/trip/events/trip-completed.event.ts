import { v4 as uuidv4 } from 'uuid';
import { Payment } from '../value-objects/payment.vo';

export class TripCompletedEvent {
  readonly eventType = 'trip.completed';
  readonly eventId: string;

  constructor(
    public readonly tripId: string,
    public readonly passengerId: string,
    public readonly riderId: string,
    public readonly payment: Payment,
    public readonly occurredAt: Date = new Date(),
  ) {
    this.eventId = uuidv4();
  }
}
