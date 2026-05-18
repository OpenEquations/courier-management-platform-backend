import { v4 as uuidv4 } from 'uuid';

export class DeliveryDeliveredEvent {
  readonly eventType = 'delivery.delivered';
  readonly eventId: string;

  constructor(
    public readonly deliveryId: string,
    public readonly trackingNumber: string,
    public readonly riderId: string,
    public readonly tripId: string | null,
    public readonly hasCod: boolean,
    public readonly occurredAt: Date,
  ) {
    this.eventId = uuidv4();
  }
}
