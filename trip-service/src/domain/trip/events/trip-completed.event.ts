import { Payment } from '../value-objects/payment.vo';

export class TripCompletedEvent {
  constructor(
    public readonly tripId: string,
    public readonly passengerId: string,
    public readonly riderId: string,
    public readonly payment: Payment,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
