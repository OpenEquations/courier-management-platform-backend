import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TripService } from 'src/application/trip/trip.service';
import { CreateTripDto } from 'src/application/trip/dto/create-trip.dto';
import { LockBroadcastDto } from 'src/application/trip/dto/lock-broadcast.dto';
import { CancelTripDto } from 'src/application/trip/dto/cancel-trip.dto';
import { FlagDisputeDto } from 'src/application/trip/dto/flag-dispute.dto';
import { HandoffTripDto } from 'src/application/trip/dto/handoff-trip.dto';
import { TripResponseDto } from 'src/application/trip/dto/trip-response.dto';
import { JwtGuard } from 'src/inflastructure/security/jwt.guard';
import { CurrentUser } from 'src/presentation/decorators/current-user.decorator';

@ApiTags('trips')
@Controller('trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create a trip and open it for broadcast',
    description:
      'Creates a `PENDING` trip with an `OPEN` broadcast and emits `trip.created` so ' +
      'matching-service can find nearby riders. Set `predictedPrice` from a prior call to ' +
      "pricing-service's `POST /predict` — it is shown to the passenger and compared " +
      'against the price the rider eventually agrees to.',
  })
  @ApiResponse({ status: 201, description: 'Trip created.', type: TripResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  @ApiResponse({ status: 409, description: 'Caller already has an active trip in progress.' })
  createTrip(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateTripDto,
  ) {
    return this.tripService.createTrip(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all trips (paginated)', description: 'Mainly useful for back-office/admin views.' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of trips.' })
  getAllTrips(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.tripService.getAllTrips(+page, +limit);
  }

  @Get('my-active')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: "Get the authenticated passenger's currently-active trip",
    description: 'Returns the in-flight trip (if any) for the caller — poll this (or use the WebSocket) to drive trip-tracking UI.',
  })
  @ApiResponse({ status: 200, description: 'The active trip, or `null` if there is none.', type: TripResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid bearer token.' })
  getActiveTrip(@CurrentUser() user: { userId: string }) {
    return this.tripService.getActiveTrip(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a trip by ID' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiResponse({ status: 200, description: 'The trip.', type: TripResponseDto })
  @ApiResponse({ status: 404, description: 'No trip with this ID.' })
  getTripById(@Param('id') id: string) {
    return this.tripService.getTripById(id);
  }

  @Get('passenger/:passengerId')
  @ApiOperation({ summary: "List a passenger's trip history (paginated)" })
  @ApiParam({ name: 'passengerId', description: 'Passenger (user) UUID' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of the passenger\'s trips.' })
  getTripsByPassenger(
    @Param('passengerId') passengerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.tripService.getTripsByPassenger(passengerId, +page, +limit);
  }

  @Get('rider/:riderId')
  @ApiOperation({ summary: "List a rider's trip history (paginated)" })
  @ApiParam({ name: 'riderId', description: 'Rider UUID' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: "Paginated list of the rider's trips." })
  getTripsByRider(
    @Param('riderId') riderId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.tripService.getTripsByRider(riderId, +page, +limit);
  }

  @Patch(':id/lock-broadcast')
  @ApiOperation({
    summary: 'Assign a rider to the trip and agree on a price',
    description:
      'Called when a rider accepts the broadcasted trip offer (typically triggered by the rider ' +
      'app after receiving a `new-trip-offer` WebSocket push). Moves `broadcastStatus` to `LOCKED`, ' +
      'sets `agreedPrice` and `vehicle`, and starts the payment hold via payment-service.',
  })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiResponse({ status: 200, description: 'Rider locked in.', type: TripResponseDto })
  @ApiResponse({ status: 409, description: 'Broadcast is no longer `OPEN` (already locked/closed).' })
  lockBroadcast(@Param('id') id: string, @Body() dto: LockBroadcastDto) {
    return this.tripService.lockBroadcast(id, dto);
  }

  @Patch(':id/release-broadcast')
  @ApiOperation({
    summary: 'Re-open the broadcast for matching',
    description: 'Reverts a `LOCKED` broadcast back to `OPEN` — e.g. when a rider cancels before starting the trip.',
  })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiResponse({ status: 200, description: 'Broadcast reopened.', type: TripResponseDto })
  releaseBroadcast(@Param('id') id: string) {
    return this.tripService.releaseBroadcast(id);
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Mark the trip as started (rider has picked up the passenger/package)' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiResponse({ status: 200, description: 'Trip is now `ONGOING`.', type: TripResponseDto })
  @ApiResponse({ status: 409, description: 'Trip is not in a state that can be started (e.g. no rider locked yet).' })
  startTrip(@Param('id') id: string) {
    return this.tripService.startTrip(id);
  }

  @Patch(':id/confirm-pickup')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Passenger confirms the rider has arrived and the journey has started',
    description:
      'Marks `pickupConfirmed = true` on an `ONGOING` trip and immediately holds the agreed ' +
      'fare on the passenger\'s account via payment-service. Only the passenger on the trip may call this.',
  })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiResponse({ status: 200, description: 'Pickup confirmed and payment held.', type: TripResponseDto })
  @ApiResponse({ status: 403, description: 'Caller is not the passenger on this trip.' })
  @ApiResponse({ status: 409, description: 'Trip is not ONGOING or pickup already confirmed.' })
  confirmPickup(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.tripService.confirmPickup(id, user.userId);
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Mark the trip as completed',
    description: 'Moves the trip to `COMPLETED`. The held payment is not released until the passenger calls `confirm-completion`.',
  })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiResponse({ status: 200, description: 'Trip completed.', type: TripResponseDto })
  completeTrip(@Param('id') id: string) {
    return this.tripService.completeTrip(id);
  }

  @Patch(':id/confirm-completion')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Passenger confirms a completed trip and releases payment',
    description:
      'Called by the passenger/sender after the rider marks a trip `COMPLETED`. Releases the held ' +
      'payment and pays it out to the rider via payment-service, then emits `trip.completed`. ' +
      'Only the passenger on the trip may call this.',
  })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiResponse({ status: 200, description: 'Payment released to the rider.', type: TripResponseDto })
  @ApiResponse({ status: 403, description: 'Caller is not the passenger on this trip.' })
  @ApiResponse({ status: 409, description: 'Trip is not COMPLETED or payment is not held.' })
  confirmCompletion(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.tripService.confirmTripCompletion(id, user.userId);
  }

  @Patch(':id/rebroadcast')
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Re-broadcast a pending trip to nearby riders',
    description:
      'If no rider has accepted yet, re-publishes `trip.created` so matching-service searches ' +
      'for riders again and pushes fresh offers. Only the passenger may call this, and only ' +
      'while the trip is still `PENDING` with no rider locked.',
  })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiResponse({ status: 200, description: 'Trip rebroadcast.', type: TripResponseDto })
  @ApiResponse({ status: 403, description: 'Caller is not the passenger on this trip.' })
  @ApiResponse({ status: 409, description: 'Trip is not PENDING or already has a rider.' })
  rebroadcastTrip(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.tripService.rebroadcastTrip(id, user.userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel the trip', description: 'Records who cancelled (`CUSTOMER`/`RIDER`/`SYSTEM`) and why; refunds any held payment.' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiResponse({ status: 200, description: 'Trip cancelled.', type: TripResponseDto })
  cancelTrip(@Param('id') id: string, @Body() dto: CancelTripDto) {
    return this.tripService.cancelTrip(id, dto);
  }

  @Patch(':id/dispute')
  @ApiOperation({ summary: 'Flag the trip as disputed', description: 'Used by either party to escalate a problem (e.g. wrong fare, no-show) for manual review.' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiResponse({ status: 200, description: 'Trip marked `DISPUTED`.', type: TripResponseDto })
  flagDispute(@Param('id') id: string, @Body() dto: FlagDisputeDto) {
    return this.tripService.flagDispute(id, dto);
  }

  @Patch(':id/handoff')
  @ApiOperation({
    summary: 'Hand the trip off from one rider to another mid-trip',
    description: 'For exceptional situations (e.g. vehicle breakdown). Records the portion completed by the outgoing rider for fair payment splitting.',
  })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiResponse({ status: 200, description: 'Trip handed off to the new rider.', type: TripResponseDto })
  handoffTrip(@Param('id') id: string, @Body() dto: HandoffTripDto) {
    return this.tripService.handoffTrip(id, dto);
  }
}
