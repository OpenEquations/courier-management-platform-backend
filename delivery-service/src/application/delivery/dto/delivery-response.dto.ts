import { Delivery } from 'src/domain/delivery/entities/delivery.entity';
import { DeliveryStatus } from 'src/domain/delivery/enums/delivery-status.enum';
import { CodStatus } from 'src/domain/delivery/enums/cod-status.enum';
import { ProofType } from 'src/domain/delivery/enums/proof-type.enum';
import { FailureReason } from 'src/domain/delivery/enums/failure-reason.enum';

export class DeliveryResponseDto {
  id!: string;
  trackingNumber!: string;

  sender!: { id: string; name: string; phone: string; email: string };
  recipient!: { name: string; phone: string; email: string | null };
  pickupLocation!: { lat: number; lng: number; address: string };
  dropoffLocation!: { lat: number; lng: number; address: string };

  packageDetails!: {
    description: string;
    weightKg: number;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
    isFragile: boolean;
  };

  deliveryWindow!: { from: Date; to: Date } | null;
  specialInstructions!: string | null;

  codInfo!: {
    amount: number;
    status: CodStatus;
    collectedAt: Date | null;
    remittedAt: Date | null;
  } | null;

  status!: DeliveryStatus;
  currentTripId!: string | null;

  proofOfPickup!: {
    type: ProofType;
    fileUrl: string | null;
    capturedAt: Date;
    capturedByRiderId: string;
  } | null;

  proofOfDelivery!: {
    type: ProofType;
    fileUrl: string | null;
    capturedAt: Date;
    capturedByRiderId: string;
    deliveredTo: string;
  } | null;

  attempts!: {
    riderId: string;
    attemptedAt: Date;
    successful: boolean;
    failureReason: FailureReason | null;
    notes: string | null;
  }[];

  timeline!: { status: DeliveryStatus; timestamp: Date }[];
  cancellationReason!: string | null;
  createdAt!: Date;
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
    dto.createdAt = d.getCreatedAt();
    dto.updatedAt = d.getUpdatedAt();
    return dto;
  }
}
