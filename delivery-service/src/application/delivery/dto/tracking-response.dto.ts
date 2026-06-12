import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Delivery } from 'src/domain/delivery/entities/delivery.entity';
import { DeliveryStatus } from 'src/domain/delivery/enums/delivery-status.enum';

export class TrackingResponseDto {
  @ApiProperty({ description: 'Delivery UUID' })
  id!: string;
  @ApiProperty({ example: 'DLV-2026-00042', description: 'Customer-facing tracking number' })
  trackingNumber!: string;
  @ApiProperty({ enum: DeliveryStatus, description: 'Current lifecycle status' })
  status!: DeliveryStatus;
  @ApiPropertyOptional({ description: 'Trip currently fulfilling this delivery, if assigned', nullable: true })
  currentTripId!: string | null;
  @ApiProperty({ example: 'Eric Niyonsenga' })
  recipientName!: string;
  @ApiProperty({ example: 'KN 4 Ave, Kigali' })
  pickupAddress!: string;
  @ApiProperty({ example: 'KG 11 Ave, Kigali' })
  dropoffAddress!: string;
  @ApiProperty({ example: 'Sealed envelope with legal documents' })
  packageDescription!: string;
  @ApiProperty({ description: 'Chronological log of every status change' })
  timeline!: { status: DeliveryStatus; timestamp: Date }[];
  @ApiPropertyOptional({ description: 'Preferred delivery window, if one was requested', nullable: true })
  estimatedDeliveryWindow!: { from: Date; to: Date } | null;
  @ApiProperty({ description: 'When the delivery was created' })
  createdAt!: Date;

  static from(d: Delivery): TrackingResponseDto {
    const dto = new TrackingResponseDto();
    dto.id = d.getId();
    dto.trackingNumber = d.getTrackingNumber();
    dto.currentTripId = d.getCurrentTripId();
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
