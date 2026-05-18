import { v4 as uuidv4 } from 'uuid';

export class DeliveryCancelledEvent {
  readonly eventType = 'delivery.cancelled';
  readonly eventId: string;

  constructor(
    public readonly deliveryId: string,
    public readonly trackingNumber: string,
    public readonly reason: string,
    public readonly occurredAt: Date,
  ) {
    this.eventId = uuidv4();
  }
}
