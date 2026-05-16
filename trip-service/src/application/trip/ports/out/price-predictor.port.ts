import { Location } from 'src/domain/trip/value-objects/location.vo';
import { TripType } from 'src/domain/trip/enums/trip-type.enum';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';

export interface IPricePredictorPort {
  predictPrice(
    origin: Location,
    destination: Location,
    type: TripType,
    vehicleType: VehicleType,
  ): Promise<number>;
}
