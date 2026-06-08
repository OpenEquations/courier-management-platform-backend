import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeliveryService } from 'src/application/delivery/delivery.service';
import { TrackingResponseDto } from 'src/application/delivery/dto/tracking-response.dto';

@ApiTags('tracking')
@Controller('track')
export class PublicTrackingController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get(':trackingNumber')
  @ApiOperation({
    summary: 'Track a package by its tracking number',
    description:
      'Public, unauthenticated endpoint — safe to expose to end customers (e.g. on a ' +
      '"Track your package" page). Returns the current status, key addresses, and the ' +
      'full status timeline for the parcel.',
  })
  @ApiParam({ name: 'trackingNumber', description: 'Customer-facing tracking number, e.g. `DLV-2026-00042`' })
  @ApiResponse({ status: 200, description: 'Tracking details for the package.', type: TrackingResponseDto })
  @ApiResponse({ status: 404, description: 'No delivery found for this tracking number.' })
  track(@Param('trackingNumber') trackingNumber: string): Promise<TrackingResponseDto> {
    return this.deliveryService.trackByNumber(trackingNumber);
  }
}
