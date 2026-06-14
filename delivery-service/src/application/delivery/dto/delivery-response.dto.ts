import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Delivery } from 'src/domain/delivery/entities/delivery.entity';
import { DeliveryStatus } from 'src/domain/delivery/enums/delivery-status.enum';
import { CodStatus } from 'src/domain/delivery/enums/cod-status.enum';
import { ProofType } from 'src/domain/delivery/enums/proof-type.enum';
import { FailureReason } from 'src/domain/delivery/enums/failure-reason.enum';

export class DeliveryResponseDto {
  @ApiProperty({ description: 'Internal delivery UUID', example: 'd4e5f6a7-...' })
  id!: string;
  @ApiProperty({ description: 'Customer-facing tracking number', example: 'DLV-2026-00042' })
  trackingNumber!: string;

  @ApiProperty({ description: 'Who shipped the package' })
  sender!: { id: string; name: string; phone: string; email: string };
  @ApiProperty({ description: 'Who should receive the package' })
  recipient!: { name: string; phone: string; email: string | null };
  @ApiProperty({ description: 'Where the package was/will be collected' })
  pickupLocation!: { lat: number; lng: number; address: string };
  @ApiProperty({ description: 'Where the package should be delivered' })
  dropoffLocation!: { lat: number; lng: number; address: string };

  @ApiProperty({ description: 'Physical characteristics of the parcel' })
  packageDetails!: {
    description: string;
    weightKg: number;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
    isFragile: boolean;
    hasSeal: boolean;
    sealDescription: string | null;
  };

  @ApiPropertyOptional({ description: 'Preferred delivery window, if requested', nullable: true })
  deliveryWindow!: { from: Date; to: Date } | null;
  @ApiPropertyOptional({ description: 'Free-text instructions for the courier', nullable: true })
  specialInstructions!: string | null;

  @ApiPropertyOptional({ description: 'Cash-on-delivery details, present only when codAmount was set at creation', nullable: true })
  codInfo!: {
    amount: number;
    status: CodStatus;
    collectedAt: Date | null;
    remittedAt: Date | null;
  } | null;

  @ApiProperty({ enum: DeliveryStatus, description: 'Current lifecycle status' })
  status!: DeliveryStatus;
  @ApiPropertyOptional({ description: 'UUID of the trip this delivery is currently linked to, if assigned', nullable: true })
  currentTripId!: string | null;

  @ApiPropertyOptional({ description: 'Proof captured when the courier picked up the parcel', nullable: true })
  proofOfPickup!: {
    type: ProofType;
    fileUrl: string | null;
    capturedAt: Date;
    capturedByRiderId: string;
  } | null;

  @ApiPropertyOptional({ description: 'Proof captured when the parcel was handed to the recipient', nullable: true })
  proofOfDelivery!: {
    type: ProofType;
    fileUrl: string | null;
    capturedAt: Date;
    capturedByRiderId: string;
    deliveredTo: string;
  } | null;

  @ApiProperty({ description: 'History of delivery attempts (including failed ones)' })
  attempts!: {
    riderId: string;
    attemptedAt: Date;
    successful: boolean;
    failureReason: FailureReason | null;
    notes: string | null;
  }[];

  @ApiProperty({ description: 'Chronological log of every status change' })
  timeline!: { status: DeliveryStatus; timestamp: Date }[];
  @ApiPropertyOptional({ description: 'Reason given if this delivery was cancelled', nullable: true })
  cancellationReason!: string | null;

  @ApiProperty({ type: [String], description: 'Photos of the parcel uploaded by the sender at booking time' })
  parcelImages!: string[];
  @ApiProperty({ type: [String], description: 'Photos of the parcel condition captured by the rider on pickup' })
  pickupImages!: string[];
  @ApiProperty({ description: 'When the delivery was created' })
  createdAt!: Date;
  @ApiProperty({ description: 'When the delivery was last updated' })
  updatedAt!: Date;

  static from(d: Delivery): DeliveryResponseDto {
    const dto = new DeliveryResponseDto();
    dto.id = d.getId();
    dto.trackingNumber = d.getTrackingNumber();
    dto.sender = {
      id: d.getSender().getId(),
      name: d.getSender().getName(),
      phone: d.getSender().getPhone(),
      email: d.getSender().getEmail(),
    };
    dto.recipient = {
      name: d.getRecipient().getName(),
      phone: d.getRecipient().getPhone(),
      email: d.getRecipient().getEmail(),
    };
    dto.pickupLocation = {
      lat: d.getPickupLocation().getLat(),
      lng: d.getPickupLocation().getLng(),
      address: d.getPickupLocation().getAddress(),
    };
    dto.dropoffLocation = {
      lat: d.getDropoffLocation().getLat(),
      lng: d.getDropoffLocation().getLng(),
      address: d.getDropoffLocation().getAddress(),
    };
    const pkg = d.getPackageDetails();
    dto.packageDetails = {
      description: pkg.getDescription(),
      weightKg: pkg.getWeightKg(),
      lengthCm: pkg.getLengthCm(),
      widthCm: pkg.getWidthCm(),
      heightCm: pkg.getHeightCm(),
      isFragile: pkg.isPackageFragile(),
      hasSeal: pkg.hasSecuritySeal(),
      sealDescription: pkg.getSealDescription(),
    };
    const win = d.getDeliveryWindow();
    dto.deliveryWindow = win ? { from: win.getFrom(), to: win.getTo() } : null;
    dto.specialInstructions = d.getSpecialInstructions();
    const cod = d.getCodInfo();
    dto.codInfo = cod
      ? { amount: cod.getAmount(), status: cod.getStatus(), collectedAt: cod.getCollectedAt(), remittedAt: cod.getRemittedAt() }
      : null;
    dto.status = d.getStatus();
    dto.currentTripId = d.getCurrentTripId();
    const pop = d.getProofOfPickup();
    dto.proofOfPickup = pop
      ? { type: pop.getType(), fileUrl: pop.getFileUrl(), capturedAt: pop.getCapturedAt(), capturedByRiderId: pop.getCapturedByRiderId() }
      : null;
    const pod = d.getProofOfDelivery();
    dto.proofOfDelivery = pod
      ? { type: pod.getType(), fileUrl: pod.getFileUrl(), capturedAt: pod.getCapturedAt(), capturedByRiderId: pod.getCapturedByRiderId(), deliveredTo: pod.getDeliveredTo() }
      : null;
    dto.attempts = d.getAttempts().map(a => ({
      riderId: a.getRiderId(),
      attemptedAt: a.getAttemptedAt(),
      successful: a.isSuccessful(),
      failureReason: a.getFailureReason(),
      notes: a.getNotes(),
    }));
    dto.timeline = d.getTimeline().map(t => ({ status: t.getStatus(), timestamp: t.getTimestamp() }));
    dto.cancellationReason = d.getCancellationReason();
    dto.parcelImages = d.getParcelImages();
    dto.pickupImages = d.getPickupImages();
    dto.createdAt = d.getCreatedAt();
    dto.updatedAt = d.getUpdatedAt();
    return dto;
  }
}
