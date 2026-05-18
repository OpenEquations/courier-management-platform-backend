import { v4 as uuidv4 } from 'uuid';
import { FailureReason } from '../enums/failure-reason.enum';

export class DeliveryAttemptFailedEvent {
  readonly eventType = 'delivery.attempt_failed';
  readonly eventId: string;

  constructor(
    public readonly deliveryId: string,
    public readonly trackingNumber: string,
    public readonly riderId: string,
    public readonly reason: FailureReason,
    public readonly attemptCount: number,
    public readonly occurredAt: Date,
  ) {
    this.eventId = uuidv4();
  }
}
