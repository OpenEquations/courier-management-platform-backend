import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface NearbyRider {
  riderId: string;
  distanceKm: number;
}

@Injectable()
export class GeoAdapter {
  private readonly logger = new Logger(GeoAdapter.name);
  private readonly geoUrl = process.env.GEO_SERVICE_URL ?? 'http://localhost:3004';

  async findNearby(lat: number, lng: number, radiusKm = 5, limit = 30): Promise<NearbyRider[]> {
    try {
      const { data } = await axios.get<{ riders: NearbyRider[] }>(`${this.geoUrl}/nearby`, {
        params: { lat, lng, radiusKm, limit },
        timeout: 3000,
      });
      return data.riders ?? [];
    } catch (err) {
      this.logger.error(`geo-service unreachable: ${(err as Error).message}`);
      return [];
    }
  }
}
