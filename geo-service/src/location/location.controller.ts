import { Controller, Post, Get, Delete, Body, Query, Param } from '@nestjs/common';
import { LocationService } from './location.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';

@Controller()
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('locations')
  async updateLocation(@Body() dto: UpdateLocationDto): Promise<{ ok: boolean }> {
    await this.locationService.updateLocation(dto.riderId, dto.lat, dto.lng);
    return { ok: true };
  }

  @Get('nearby')
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
  async removeRider(@Param('riderId') riderId: string): Promise<{ ok: boolean }> {
    await this.locationService.removeRider(riderId);
    return { ok: true };
  }
}
