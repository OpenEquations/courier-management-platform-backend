import { Injectable, Inject, Logger } from '@nestjs/common';
import type Redis from 'ioredis';

const GEO_KEY = 'riders:geo';
const ACTIVE_TTL_SEC = 30;

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async updateLocation(riderId: string, lat: number, lng: number): Promise<void> {
    // GEOADD stores (lng, lat) — Redis convention
    await this.redis.geoadd(GEO_KEY, lng, lat, riderId);
    // Separate active-flag key with TTL so stale riders drop out automatically
    await this.redis.set(`rider:active:${riderId}`, '1', 'EX', ACTIVE_TTL_SEC);
    this.logger.debug(`Updated location for ${riderId}: (${lat}, ${lng})`);
  }

  async findNearby(
    lat: number,
    lng: number,
    radiusKm: number,
    limit: number,
  ): Promise<{ riderId: string; distanceKm: number }[]> {
    // georadius with WITHDIST returns [[memberId, distanceStr], ...]
    const raw = await (this.redis as any).georadius(
      GEO_KEY,
      lng,
      lat,
      radiusKm,
      'km',
      'WITHDIST',
      'ASC',
      'COUNT',
      limit,
    ) as Array<[string, string]>;

    if (!raw?.length) return [];

    // Filter out riders whose active-flag has expired (went offline / stopped pinging)
    const activeFlags = await Promise.all(
      raw.map(([riderId]) => this.redis.exists(`rider:active:${riderId}`)),
    );

    return raw
      .filter((_, i) => activeFlags[i] === 1)
      .map(([riderId, dist]) => ({ riderId, distanceKm: parseFloat(dist) }));
  }

  async removeRider(riderId: string): Promise<void> {
    await this.redis.zrem(GEO_KEY, riderId);
    await this.redis.del(`rider:active:${riderId}`);
  }
}
