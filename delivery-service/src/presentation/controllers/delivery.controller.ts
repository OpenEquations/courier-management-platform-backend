import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { DeliveryService } from 'src/application/delivery/delivery.service';
import { CreateDeliveryDto } from 'src/application/delivery/dto/create-delivery.dto';
import { RecordPickupDto } from 'src/application/delivery/dto/record-pickup.dto';
import { RecordDeliveryDto } from 'src/application/delivery/dto/record-delivery.dto';
import { RecordFailedAttemptDto } from 'src/application/delivery/dto/record-failed-attempt.dto';
import { CollectCodDto } from 'src/application/delivery/dto/collect-cod.dto';
import { DeliveryResponseDto } from 'src/application/delivery/dto/delivery-response.dto';

@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  create(@Body() dto: CreateDeliveryDto): Promise<DeliveryResponseDto> {
    return this.deliveryService.createDelivery(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<DeliveryResponseDto> {
    return this.deliveryService.getDelivery(id);
  }

  @Get('sender/:senderId')
  findBySender(@Param('senderId') senderId: string): Promise<DeliveryResponseDto[]> {
    return this.deliveryService.getDeliveriesBySender(senderId);
  }

  @Get('courier/:courierId')
  findByCourier(@Param('courierId') courierId: string): Promise<DeliveryResponseDto[]> {
    return this.deliveryService.getDeliveriesByCourier(courierId);
  }

  @Patch(':id/assign')
  assignToTrip(
    @Param('id') id: string,
    @Body('tripId') tripId: string,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.assignToTrip(id, tripId);
  }

  @Patch(':id/unassign')
  unassignFromTrip(@Param('id') id: string): Promise<DeliveryResponseDto> {
    return this.deliveryService.unassignFromTrip(id);
  }

  @Patch(':id/pick-up')
  recordPickup(
    @Param('id') id: string,
    @Body() dto: RecordPickupDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.recordPickup(id, dto);
  }

  @Patch(':id/in-transit')
  markInTransit(@Param('id') id: string): Promise<DeliveryResponseDto> {
    return this.deliveryService.markInTransit(id);
  }

  @Patch(':id/out-for-delivery')
  markOutForDelivery(@Param('id') id: string): Promise<DeliveryResponseDto> {
    return this.deliveryService.markOutForDelivery(id);
  }

  @Patch(':id/complete')
  recordSuccessfulDelivery(
    @Param('id') id: string,
    @Body() dto: RecordDeliveryDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.recordSuccessfulDelivery(id, dto);
  }

  @Patch(':id/fail')
  recordFailedAttempt(
    @Param('id') id: string,
    @Body() dto: RecordFailedAttemptDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.recordFailedAttempt(id, dto);
  }

  @Patch(':id/collect-cod')
  collectCod(
    @Param('id') id: string,
    @Body() dto: CollectCodDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.collectCod(id, dto.riderId);
  }

  @Patch(':id/remit-cod')
  remitCod(@Param('id') id: string): Promise<DeliveryResponseDto> {
    return this.deliveryService.remitCod(id);
  }

  @Patch(':id/return')
  returnToSender(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.returnToSender(id, reason);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.cancelDelivery(id, reason);
  }
}
