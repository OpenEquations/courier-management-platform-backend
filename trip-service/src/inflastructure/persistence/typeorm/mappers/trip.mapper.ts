import { Trip } from 'src/domain/trip/entities/trip.entity';
import { User } from 'src/domain/user/entities/user.entity';
import { Vehicle } from 'src/domain/rider/value-objects/vehicle.vo';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';
import { Location } from 'src/domain/trip/value-objects/location.vo';
import { PackageDetails } from 'src/domain/trip/value-objects/package-details.vo';
import { Payment } from 'src/domain/trip/value-objects/payment.vo';
import { TimelineEntry } from 'src/domain/trip/value-objects/timeline-entry.vo';
import { TripOrmEntity } from '../entities/trip.orm-entity';

export class TripMapper {
  static toDomain(orm: TripOrmEntity): Trip {
    const passenger = User.fromId(orm.passengerId);
    const rider = orm.riderId ? User.fromId(orm.riderId) : null;
    const origin = Location.create(orm.originLat, orm.originLng, orm.originAddress);
    const destination = Location.create(orm.destinationLat, orm.destinationLng, orm.destinationAddress);
    const vehicle =
      orm.vehicleType && orm.vehicleLicensePlate
        ? new Vehicle(orm.vehicleType as VehicleType, orm.vehicleLicensePlate)
        : null;
    const payment = Payment.reconstitute(orm.paymentStatus, orm.paymentSplits ?? []);
    const timeline = (orm.timeline ?? []).map((e) =>
      TimelineEntry.reconstitute(e.status, new Date(e.timestamp)),
    );
    const packageDetails = orm.packageDetails
      ? PackageDetails.create(
          orm.packageDetails.weight,
          orm.packageDetails.dimensions,
          orm.packageDetails.description,
          orm.packageDetails.isFragile,
        )
      : null;

    return Trip.reconstitute({
      id: orm.id,
      type: orm.type,
      passenger,
      rider,
      origin,
      destination,
      requestedVehicleType: orm.requestedVehicleType,
      vehicle,
      predictedPrice: orm.predictedPrice,
      agreedPrice: orm.agreedPrice,
      broadcastStatus: orm.broadcastStatus,
      tripStatus: orm.tripStatus,
      timeline,
      payment,
      notes: orm.notes,
      distance: orm.distance,
      estimatedDuration: orm.estimatedDuration,
      cancellationReason: orm.cancellationReason,
      disputeReason: orm.disputeReason,
      packageDetails,
      deliveryId: orm.deliveryId,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(trip: Trip): TripOrmEntity {
    const orm = new TripOrmEntity();
    orm.id = trip.getId();
    orm.type = trip.getType();
    orm.passengerId = trip.getPassenger().getId();
    orm.riderId = trip.getRider()?.getId() ?? null;
    orm.originLat = trip.getOrigin().getLat();
    orm.originLng = trip.getOrigin().getLng();
    orm.originAddress = trip.getOrigin().getAddress();
    orm.destinationLat = trip.getDestination().getLat();
    orm.destinationLng = trip.getDestination().getLng();
    orm.destinationAddress = trip.getDestination().getAddress();
    orm.requestedVehicleType = trip.getRequestedVehicleType();
    orm.vehicleType = trip.getVehicle()?.getType() as VehicleType ?? null;
    orm.vehicleLicensePlate = trip.getVehicle()?.getLicensePlate() ?? null;
    orm.predictedPrice = trip.getPredictedPrice();
    orm.agreedPrice = trip.getAgreedPrice();
    orm.tripStatus = trip.getTripStatus();
    orm.broadcastStatus = trip.getBroadcastStatus();
    orm.paymentStatus = trip.getPayment().getStatus();
    orm.paymentSplits = trip.getPayment().getSplits();
    orm.timeline = trip.getTimeline().map((e) => ({
      status: e.getStatus(),
      timestamp: e.getTimestamp().toISOString(),
    }));
    orm.notes = trip.getNotes();
    orm.distance = trip.getDistance();
    orm.estimatedDuration = trip.getEstimatedDuration();
    orm.cancellationReason = trip.getCancellationReason();
    orm.disputeReason = trip.getDisputeReason();
    const pkg = trip.getPackageDetails();
    orm.packageDetails = pkg
      ? {
          weight: pkg.getWeight(),
          dimensions: pkg.getDimensions(),
          description: pkg.getDescription(),
          isFragile: pkg.getIsFragile(),
        }
      : null;
    orm.deliveryId = trip.getDeliveryId();
    return orm;
  }
}
