import { v4 as uuidv4 } from 'uuid';

export class DeliveryPickedUpEvent {
  readonly eventType = 'delivery.picked_up';
  readonly eventId: string;

  constructor(
    public readonly deliveryId: string,
    public readonly trackingNumber: string,
    public readonly riderId: string,
    public readonly tripId: string,
    public readonly occurredAt: Date,
  ) {
    this.eventId = uuidv4();
  }
}
