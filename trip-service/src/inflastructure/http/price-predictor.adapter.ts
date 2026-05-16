import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { IPricePredictorPort } from 'src/application/trip/ports/out/price-predictor.port';
import { Location } from 'src/domain/trip/value-objects/location.vo';
import { TripType } from 'src/domain/trip/enums/trip-type.enum';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';

@Injectable()
export class PricePredictorAdapter implements IPricePredictorPort {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl = configService.getOrThrow<string>('PRICING_SERVICE_URL');
  }

  async predictPrice(
    origin: Location,
    destination: Location,
    type: TripType,
    vehicleType: VehicleType,
  ): Promise<number> {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/predict`, {
        origin: { lat: origin.getLat(), lng: origin.getLng() },
        destination: { lat: destination.getLat(), lng: destination.getLng() },
        type,
        vehicleType,
      }),
    );
    return data.price;
  }
}