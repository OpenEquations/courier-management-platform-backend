import { Injectable, Logger } from '@nestjs/common';
import { GeoAdapter } from './geo.adapter';
import { UserAdapter } from './user.adapter';
import { RiderOfferPublisher } from './rider-offer.publisher';

const DEFAULT_RADIUS_KM = 5;
const GEO_CANDIDATE_LIMIT = 30;
const MAX_OFFERS = 10;

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly geo: GeoAdapter,
    private readonly user: UserAdapter,
    private readonly publisher: RiderOfferPublisher,
  ) {}

  async handleTripCreated(event: {
    tripId: string;
    passengerId: string;
    originLat: number;
    originLng: number;
    originAddress: string;
    destinationLat: number;
    destinationLng: number;
    destinationAddress: string;
    vehicleType: string;
    predictedPrice: number;
  }): Promise<void> {
    const { tripId, originLat, originLng, vehicleType } = event;
    this.logger.log(`Matching riders for trip ${tripId} (vehicle: ${vehicleType})`);

    // Step 1 — find nearby riders ordered by distance (closest first)
    const nearby = await this.geo.findNearby(
      originLat,
      originLng,
      DEFAULT_RADIUS_KM,
      GEO_CANDIDATE_LIMIT,
    );
    if (!nearby.length) {
      this.logger.warn(`No riders within ${DEFAULT_RADIUS_KM}km of trip ${tripId}`);
      return;
    }

    // Step 2 — get availability + vehicle info from user-service
    const distanceByRider = new Map(nearby.map(r => [r.riderId, r.distanceKm]));
    const riders = await this.user.getRidersByIds(nearby.map(r => r.riderId));

    // Step 3 — filter by availability and matching vehicle type, preserve geo order
    const qualified = riders
      .filter(r => r.isAvailable && r.vehicles.some(v => v.type === vehicleType))
      .sort((a, b) => (distanceByRider.get(a.id) ?? 999) - (distanceByRider.get(b.id) ?? 999))
      .slice(0, MAX_OFFERS);

    if (!qualified.length) {
      this.logger.warn(`No qualified riders found for trip ${tripId}`);
      return;
    }

    // Step 4 — dispatch offer to all qualified riders simultaneously
    await this.publisher.publish({
      tripId,
      passengerId: event.passengerId,
      riderIds: qualified.map(r => r.id),
      origin: { lat: originLat, lng: originLng, address: event.originAddress },
      destination: { lat: event.destinationLat, lng: event.destinationLng, address: event.destinationAddress },
      vehicleType,
      predictedPrice: event.predictedPrice,
    });
  }
}
