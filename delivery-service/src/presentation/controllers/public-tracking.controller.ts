import { Controller, Get, Param } from '@nestjs/common';
import { DeliveryService } from 'src/application/delivery/delivery.service';
import { TrackingResponseDto } from 'src/application/delivery/dto/tracking-response.dto';

@Controller('track')
export class PublicTrackingController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get(':trackingNumber')
  track(@Param('trackingNumber') trackingNumber: string): Promise<TrackingResponseDto> {
    return this.deliveryService.trackByNumber(trackingNumber);
  }
}
