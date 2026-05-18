import { v4 as uuidv4 } from 'uuid';

export interface LocationPayload {
  lat: number;
  lng: number;
  address: string;
}

export interface PackageDetailsPayload {
  description: string;
  weightKg: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  isFragile: boolean;
}

export class DeliveryCreatedEvent {
  readonly eventType = 'delivery.created';
  readonly eventId: string;

  constructor(
    public readonly deliveryId: string,
    public readonly trackingNumber: string,
    public readonly senderId: string,
    public readonly recipientPhone: string,
    public readonly pickupLocation: LocationPayload,
    public readonly dropoffLocation: LocationPayload,
    public readonly packageDetails: PackageDetailsPayload,
    public readonly occurredAt: Date,
  ) {
    this.eventId = uuidv4();
  }
}
