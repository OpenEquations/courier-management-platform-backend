import { Injectable, Logger } from '@nestjs/common';
import type { IGeolocationPort } from 'src/application/trip/ports/out/geolocation.port';
import { Location } from 'src/domain/trip/value-objects/location.vo';

@Injectable()
export class GeolocationAdapter implements IGeolocationPort {
  private readonly logger = new Logger(GeolocationAdapter.name);

  async calculateDistance(from: Location, to: Location): Promise<number> {
    this.logger.log(`Calculate distance from (${from.getLat()},${from.getLng()}) to (${to.getLat()},${to.getLng()})`);
    // TODO: call geo-service
    return 0;
  }

  async getAddress(lat: number, lng: number): Promise<string> {
    this.logger.log(`Reverse geocode (${lat},${lng})`);
    // TODO: call geo-service
    return '';
  }
}
