import { Injectable, Logger } from '@nestjs/common';
import type { IPricePredictorPort } from 'src/application/trip/ports/out/price-predictor.port';
import { Location } from 'src/domain/trip/value-objects/location.vo';
import { TripType } from 'src/domain/trip/enums/trip-type.enum';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';

@Injectable()
export class PricePredictorAdapter implements IPricePredictorPort {
  private readonly logger = new Logger(PricePredictorAdapter.name);

  async predictPrice(
    origin: Location,
    destination: Location,
    type: TripType,
    vehicleType: VehicleType,
  ): Promise<number> {
    this.logger.log(`Predicting price for ${type}/${vehicleType}`);
    // TODO: call pricing-service HTTP endpoint
    return 0;
  }
}
