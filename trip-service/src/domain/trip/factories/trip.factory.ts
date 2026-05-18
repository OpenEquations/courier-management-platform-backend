import { Trip } from '../entities/trip.entity';
import { User } from 'src/domain/user/entities/user.entity';
import { Location } from '../value-objects/location.vo';
import { PackageDetails, Dimensions } from '../value-objects/package-details.vo';
import { TripType } from '../enums/trip-type.enum';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';

export interface CreateTripProps {
  id: string;
  passengerId: string;
  type: TripType;
  originLat: number;
  originLng: number;
  originAddress: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  requestedVehicleType: VehicleType;
  predictedPrice: number;
  notes?: string;
  distance?: number;
  estimatedDuration?: number;
  packageDetails?: {
    weight: number;
    dimensions: Dimensions;
    description: string;
    isFragile: boolean;
  };
  deliveryId?: string;
}

export class TripFactory {
  static create(props: CreateTripProps): Trip {
    const passenger = User.fromId(props.passengerId);
    const origin = Location.create(props.originLat, props.originLng, props.originAddress);
    const destination = Location.create(props.destinationLat, props.destinationLng, props.destinationAddress);

    const packageDetails = props.packageDetails
      ? PackageDetails.create(
          props.packageDetails.weight,
          props.packageDetails.dimensions,
          props.packageDetails.description,
          props.packageDetails.isFragile,
        )
      : undefined;

    return Trip.create({
      id: props.id,
      type: props.type,
      passenger,
      origin,
      destination,
      requestedVehicleType: props.requestedVehicleType,
      predictedPrice: props.predictedPrice,
      notes: props.notes,
      distance: props.distance,
      estimatedDuration: props.estimatedDuration,
      packageDetails,
      deliveryId: props.deliveryId,
    });
  }
}
