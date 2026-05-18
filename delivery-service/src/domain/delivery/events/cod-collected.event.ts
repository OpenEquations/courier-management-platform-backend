import { v4 as uuidv4 } from 'uuid';

export class CodCollectedEvent {
  readonly eventType = 'delivery.cod_collected';
  readonly eventId: string;

  constructor(
    public readonly deliveryId: string,
    public readonly trackingNumber: string,
    public readonly riderId: string,
    public readonly amount: number,
    public readonly occurredAt: Date,
  ) {
    this.eventId = uuidv4();
  }
}
