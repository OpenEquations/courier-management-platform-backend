import { Controller, Post, Get, Delete, Body, Query, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LocationService } from './location.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';

@ApiTags('locations')
@Controller()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('locations')
  @ApiOperation({
    summary: "Push a rider's current position",
    description:
      'Upserts the rider into the Redis geo-index. Rider apps should call this every few ' +
      'seconds while online — the most recent position wins (no history is kept).',
  })
  @ApiResponse({ status: 201, description: '`{ ok: true }` once the position is stored.' })
  async updateLocation(@Body() dto: UpdateLocationDto): Promise<{ ok: boolean }> {
    await this.locationService.updateLocation(dto.riderId, dto.lat, dto.lng);
    return { ok: true };
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Find the closest available riders to a point',
    description:
      'Geo-radius search ordered closest-first. matching-service calls this when a trip is ' +
      'created; you can call it directly e.g. to power a "riders near me" map.',
  })
  @ApiResponse({
    status: 200,
    description: '`{ riders: [{ riderId, distanceKm }], count }`, ordered by ascending distance.',
  })
  async findNearby(@Query() query: NearbyQueryDto): Promise<{
    riders: { riderId: string; distanceKm: number }[];
    count: number;
  }> {
    const riders = await this.locationService.findNearby(
      query.lat,
      query.lng,
      query.radiusKm ?? 5,
      query.limit ?? 20,
    );
    return { riders, count: riders.length };
  }

  @Delete('locations/:riderId')
  @ApiOperation({
    summary: 'Remove a rider from the geo-index',
    description: 'Call when a rider goes offline/logs out so they stop showing up in `/nearby` results.',
  })
  @ApiParam({ name: 'riderId', description: 'Rider UUID' })
  @ApiResponse({ status: 200, description: '`{ ok: true }` once removed (idempotent — no error if absent).' })
  async removeRider(@Param('riderId') riderId: string): Promise<{ ok: boolean }> {
    await this.locationService.removeRider(riderId);
    return { ok: true };
  }
}
