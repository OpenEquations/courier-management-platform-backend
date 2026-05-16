import { User } from 'src/domain/user/entities/user.entity';
import { Location } from '../value-objects/location.vo';
import { PackageDetails } from '../value-objects/package-details.vo';
import { TripType } from '../enums/trip-type.enum';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';

export class TripCreatedEvent {
  constructor(
    public readonly tripId: string,
    public readonly passenger: User,
    public readonly origin: Location,
    public readonly destination: Location,
    public readonly type: TripType,
    public readonly requestedVehicleType: VehicleType,
    public readonly predictedPrice: number,
    public readonly packageDetails: PackageDetails | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
