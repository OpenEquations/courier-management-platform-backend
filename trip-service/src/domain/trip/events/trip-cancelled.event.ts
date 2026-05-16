import { CancelledBy } from '../enums/cancelled-by.enum';

export class TripCancelledEvent {
  constructor(
    public readonly tripId: string,
    public readonly cancelledBy: CancelledBy,
    public readonly cancellationReason: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
