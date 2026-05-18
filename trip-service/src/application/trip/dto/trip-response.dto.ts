import { Trip } from 'src/domain/trip/entities/trip.entity';
import { TripStatus, BroadcastStatus, TripType, PaymentStatus } from 'src/domain/trip/enums';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';

export class TripResponseDto {
  id!: string;
  passengerId!: string;
  riderId!: string | null;
  type!: TripType;
  origin!: { lat: number; lng: number; address: string };
  destination!: { lat: number; lng: number; address: string };
  requestedVehicleType!: VehicleType;
  vehicle!: { type: VehicleType; licensePlate: string } | null;
  predictedPrice!: number;
  agreedPrice!: number | null;
  tripStatus!: TripStatus;
  broadcastStatus!: BroadcastStatus;
  payment!: { status: PaymentStatus; splits: { riderId: string; portion: number }[] };
  timeline!: { status: TripStatus; timestamp: Date }[];
  packageDetails!: {
    weight: number;
    dimensions: { width: number; height: number; depth: number };
    description: string;
    isFragile: boolean;
  } | null;
  deliveryId!: string | null;
  notes!: string | null;
  distance!: number | null;
  estimatedDuration!: number | null;
  cancellationReason!: string | null;
  disputeReason!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(trip: Trip): TripResponseDto {
    const dto = new TripResponseDto();
    dto.id = trip.getId();
    dto.passengerId = trip.getPassenger().getId();
    dto.riderId = trip.getRider()?.getId() ?? null;
    dto.type = trip.getType();
    dto.origin = {
      lat: trip.getOrigin().getLat(),
      lng: trip.getOrigin().getLng(),
      address: trip.getOrigin().getAddress(),
    };
    dto.destination = {
      lat: trip.getDestination().getLat(),
      lng: trip.getDestination().getLng(),
      address: trip.getDestination().getAddress(),
    };
    dto.requestedVehicleType = trip.getRequestedVehicleType() as VehicleType;
    const v = trip.getVehicle();
    dto.vehicle = v ? { type: v.getType() as VehicleType, licensePlate: v.getLicensePlate() } : null;
    dto.predictedPrice = trip.getPredictedPrice();
    dto.agreedPrice = trip.getAgreedPrice();
    dto.tripStatus = trip.getTripStatus();
    dto.broadcastStatus = trip.getBroadcastStatus();
    dto.payment = {
      status: trip.getPayment().getStatus(),
      splits: trip.getPayment().getSplits(),
    };
    dto.timeline = trip.getTimeline().map((e) => ({
      status: e.getStatus(),
      timestamp: e.getTimestamp(),
    }));
    const pkg = trip.getPackageDetails();
    dto.packageDetails = pkg
      ? {
          weight: pkg.getWeight(),
          dimensions: pkg.getDimensions(),
          description: pkg.getDescription(),
          isFragile: pkg.getIsFragile(),
        }
      : null;
    dto.deliveryId = trip.getDeliveryId();
    dto.notes = trip.getNotes();
    dto.distance = trip.getDistance();
    dto.estimatedDuration = trip.getEstimatedDuration();
    dto.cancellationReason = trip.getCancellationReason();
    dto.disputeReason = trip.getDisputeReason();
    dto.createdAt = trip.getCreatedAt();
    dto.updatedAt = trip.getUpdatedAt();
    return dto;
  }
}
