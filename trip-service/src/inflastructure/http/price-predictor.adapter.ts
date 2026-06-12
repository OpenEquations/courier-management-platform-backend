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
    _type: TripType,
    _vehicleType: VehicleType,
  ): Promise<number> {
    const distanceKm = this.haversineKm(
      { lat: origin.getLat(), lng: origin.getLng() },
      { lat: destination.getLat(), lng: destination.getLng() },
    );

    const { data } = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/predict`, {
        distance_km: distanceKm > 0 ? distanceKm : 0.1,
        hour_of_day: new Date().getHours(),
        weather: 'clear',
      }),
    );
    return data.cost;
  }

  private haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const R = 6371;
    const dLat = this.toRad(b.lat - a.lat);
    const dLng = this.toRad(b.lng - a.lng);
    const lat1 = this.toRad(a.lat);
    const lat2 = this.toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}