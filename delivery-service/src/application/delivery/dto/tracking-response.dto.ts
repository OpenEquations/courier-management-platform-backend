import { Delivery } from 'src/domain/delivery/entities/delivery.entity';
import { DeliveryStatus } from 'src/domain/delivery/enums/delivery-status.enum';

export class TrackingResponseDto {
  trackingNumber!: string;
  status!: DeliveryStatus;
  recipientName!: string;
  pickupAddress!: string;
  dropoffAddress!: string;
  packageDescription!: string;
  timeline!: { status: DeliveryStatus; timestamp: Date }[];
  estimatedDeliveryWindow!: { from: Date; to: Date } | null;
  createdAt!: Date;

  static from(d: Delivery): TrackingResponseDto {
    const dto = new TrackingResponseDto();
    dto.trackingNumber = d.getTrackingNumber();
    dto.status = d.getStatus();
    dto.recipientName = d.getRecipient().getName();
    dto.pickupAddress = d.getPickupLocation().getAddress();
    dto.dropoffAddress = d.getDropoffLocation().getAddress();
    dto.packageDescription = d.getPackageDetails().getDescription();
    dto.timeline = d.getTimeline().map(t => ({ status: t.getStatus(), timestamp: t.getTimestamp() }));
    const win = d.getDeliveryWindow();
    dto.estimatedDeliveryWindow = win ? { from: win.getFrom(), to: win.getTo() } : null;
    dto.createdAt = d.getCreatedAt();
    return dto;
  }
}
