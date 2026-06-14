import { Body, Controller, Get, Param, Patch, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { basename } from 'path';
import { DeliveryService } from 'src/application/delivery/delivery.service';
import { CreateDeliveryDto } from 'src/application/delivery/dto/create-delivery.dto';
import { RecordPickupDto } from 'src/application/delivery/dto/record-pickup.dto';
import { RecordDeliveryDto } from 'src/application/delivery/dto/record-delivery.dto';
import { RecordFailedAttemptDto } from 'src/application/delivery/dto/record-failed-attempt.dto';
import { CollectCodDto } from 'src/application/delivery/dto/collect-cod.dto';
import { AddPickupImagesDto } from 'src/application/delivery/dto/add-pickup-images.dto';
import { DeliveryResponseDto } from 'src/application/delivery/dto/delivery-response.dto';
import { UPLOADS_DIR } from 'src/inflastructure/external-services/local-storage.adapter';

interface UploadedFileLike {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a delivery',
    description:
      'Registers a new parcel for delivery and generates a customer-facing `trackingNumber`. ' +
      'The delivery starts in `CREATED` status, unassigned to any courier/trip.',
  })
  @ApiResponse({ status: 201, description: 'Delivery created.', type: DeliveryResponseDto })
  create(@Body() dto: CreateDeliveryDto): Promise<DeliveryResponseDto> {
    return this.deliveryService.createDelivery(dto);
  }

  @Post('uploads')
  @ApiOperation({
    summary: 'Upload a parcel photo',
    description:
      'Stores the file and returns its absolute URL. Use the URL with `parcelImages` on create, ' +
      'or with `PATCH /deliveries/:id/pickup-images`.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  @ApiResponse({ status: 201, description: 'File stored.', schema: { type: 'object', properties: { url: { type: 'string' } } } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: UploadedFileLike, @Req() req: Request): Promise<{ url: string }> {
    const relativePath = await this.deliveryService.uploadImage(file);
    return { url: `${req.protocol}://${req.get('host')}${relativePath}` };
  }

  @Get('uploads/:filename')
  @ApiOperation({ summary: 'Fetch a previously uploaded parcel photo' })
  @ApiParam({ name: 'filename', description: 'Stored file name, as returned by the upload endpoint' })
  getUpload(@Param('filename') filename: string, @Res() res: Response): void {
    res.sendFile(basename(filename), { root: UPLOADS_DIR }, (err) => {
      if (err) res.status(404).end();
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a delivery by its internal ID' })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'The delivery.', type: DeliveryResponseDto })
  @ApiResponse({ status: 404, description: 'No delivery with this ID.' })
  findOne(@Param('id') id: string): Promise<DeliveryResponseDto> {
    return this.deliveryService.getDelivery(id);
  }

  @Get('sender/:senderId')
  @ApiOperation({ summary: "List a sender's deliveries" })
  @ApiParam({ name: 'senderId', description: 'Sender UUID' })
  @ApiResponse({ status: 200, description: "The sender's deliveries.", type: [DeliveryResponseDto] })
  findBySender(@Param('senderId') senderId: string): Promise<DeliveryResponseDto[]> {
    return this.deliveryService.getDeliveriesBySender(senderId);
  }

  @Get('courier/:courierId')
  @ApiOperation({ summary: "List a courier (rider)'s assigned deliveries" })
  @ApiParam({ name: 'courierId', description: 'Courier/rider UUID' })
  @ApiResponse({ status: 200, description: "The courier's deliveries.", type: [DeliveryResponseDto] })
  findByCourier(@Param('courierId') courierId: string): Promise<DeliveryResponseDto[]> {
    return this.deliveryService.getDeliveriesByCourier(courierId);
  }

  @Patch(':id/assign')
  @ApiOperation({
    summary: 'Assign the delivery to a trip',
    description: 'Links the delivery to an active courier trip — sets `currentTripId` and moves status to `ASSIGNED`.',
  })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiBody({ schema: { type: 'object', properties: { tripId: { type: 'string', example: 'b1c2d3e4-...' } }, required: ['tripId'] } })
  @ApiResponse({ status: 200, description: 'Delivery assigned.', type: DeliveryResponseDto })
  assignToTrip(
    @Param('id') id: string,
    @Body('tripId') tripId: string,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.assignToTrip(id, tripId);
  }

  @Patch(':id/unassign')
  @ApiOperation({ summary: 'Unassign the delivery from its current trip', description: 'Reverts to `CREATED`, e.g. if the trip is cancelled before pickup.' })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'Delivery unassigned.', type: DeliveryResponseDto })
  unassignFromTrip(@Param('id') id: string): Promise<DeliveryResponseDto> {
    return this.deliveryService.unassignFromTrip(id);
  }

  @Patch(':id/pick-up')
  @ApiOperation({
    summary: 'Record pickup from the sender',
    description: 'Captures proof of pickup (signature/photo/QR/OTP) and moves the delivery to `PICKED_UP`.',
  })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'Pickup recorded.', type: DeliveryResponseDto })
  recordPickup(
    @Param('id') id: string,
    @Body() dto: RecordPickupDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.recordPickup(id, dto);
  }

  @Patch(':id/pickup-images')
  @ApiOperation({
    summary: 'Attach rider-captured pickup-condition photos',
    description: 'Called by the rider right after accepting the offer, before starting the journey — used as dispute evidence.',
  })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'Pickup images attached.', type: DeliveryResponseDto })
  addPickupImages(
    @Param('id') id: string,
    @Body() dto: AddPickupImagesDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.addPickupImages(id, dto);
  }

  @Patch(':id/in-transit')
  @ApiOperation({ summary: 'Mark the delivery as in transit' })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'Delivery is now `IN_TRANSIT`.', type: DeliveryResponseDto })
  markInTransit(@Param('id') id: string): Promise<DeliveryResponseDto> {
    return this.deliveryService.markInTransit(id);
  }

  @Patch(':id/out-for-delivery')
  @ApiOperation({ summary: 'Mark the delivery as out for final delivery' })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'Delivery is now `OUT_FOR_DELIVERY`.', type: DeliveryResponseDto })
  markOutForDelivery(@Param('id') id: string): Promise<DeliveryResponseDto> {
    return this.deliveryService.markOutForDelivery(id);
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Record a successful delivery',
    description: 'Captures proof of delivery (incl. who received it) and moves the delivery to `DELIVERED`.',
  })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'Delivery completed.', type: DeliveryResponseDto })
  recordSuccessfulDelivery(
    @Param('id') id: string,
    @Body() dto: RecordDeliveryDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.recordSuccessfulDelivery(id, dto);
  }

  @Patch(':id/fail')
  @ApiOperation({
    summary: 'Record a failed delivery attempt',
    description: 'Logs the attempt with a `failureReason` (e.g. `RECIPIENT_NOT_HOME`); the delivery stays active for retry unless returned/cancelled.',
  })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'Failed attempt recorded.', type: DeliveryResponseDto })
  recordFailedAttempt(
    @Param('id') id: string,
    @Body() dto: RecordFailedAttemptDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.recordFailedAttempt(id, dto);
  }

  @Patch(':id/collect-cod')
  @ApiOperation({
    summary: 'Record cash-on-delivery collection',
    description: 'Marks the COD amount as `COLLECTED` by the given rider — only valid if the delivery was created with a `codAmount`.',
  })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'COD marked collected.', type: DeliveryResponseDto })
  collectCod(
    @Param('id') id: string,
    @Body() dto: CollectCodDto,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.collectCod(id, dto.riderId);
  }

  @Patch(':id/remit-cod')
  @ApiOperation({
    summary: 'Record COD remittance to the platform',
    description: 'Marks previously-collected cash as `REMITTED` once the courier hands it over — closes the COD loop.',
  })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiResponse({ status: 200, description: 'COD marked remitted.', type: DeliveryResponseDto })
  remitCod(@Param('id') id: string): Promise<DeliveryResponseDto> {
    return this.deliveryService.remitCod(id);
  }

  @Patch(':id/return')
  @ApiOperation({ summary: 'Return the parcel to the sender', description: 'Used after repeated failed attempts; moves the delivery to `RETURNED`.' })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', example: 'Recipient unreachable after 3 attempts' } }, required: ['reason'] } })
  @ApiResponse({ status: 200, description: 'Delivery returned.', type: DeliveryResponseDto })
  returnToSender(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.returnToSender(id, reason);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel the delivery', description: 'Allowed only before pickup; moves the delivery to `CANCELLED`.' })
  @ApiParam({ name: 'id', description: 'Delivery UUID' })
  @ApiBody({ schema: { type: 'object', properties: { reason: { type: 'string', example: 'Sender requested cancellation' } }, required: ['reason'] } })
  @ApiResponse({ status: 200, description: 'Delivery cancelled.', type: DeliveryResponseDto })
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<DeliveryResponseDto> {
    return this.deliveryService.cancelDelivery(id, reason);
  }
}
