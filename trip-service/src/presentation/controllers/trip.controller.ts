import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TripService } from 'src/application/trip/trip.service';
import { CreateTripDto } from 'src/application/trip/dto/create-trip.dto';
import { LockBroadcastDto } from 'src/application/trip/dto/lock-broadcast.dto';
import { CancelTripDto } from 'src/application/trip/dto/cancel-trip.dto';
import { FlagDisputeDto } from 'src/application/trip/dto/flag-dispute.dto';
import { HandoffTripDto } from 'src/application/trip/dto/handoff-trip.dto';
import { JwtGuard } from 'src/inflastructure/security/jwt.guard';
import { CurrentUser } from 'src/presentation/decorators/current-user.decorator';

@Controller('trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post()
  @UseGuards(JwtGuard)
  createTrip(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateTripDto,
  ) {
    return this.tripService.createTrip(user.userId, dto);
  }

  @Get()
  getAllTrips(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.tripService.getAllTrips(+page, +limit);
  }

  @Get('my-active')
  @UseGuards(JwtGuard)
  getActiveTrip(@CurrentUser() user: { userId: string }) {
    return this.tripService.getActiveTrip(user.userId);
  }

  @Get(':id')
  getTripById(@Param('id') id: string) {
    return this.tripService.getTripById(id);
  }

  @Get('passenger/:passengerId')
  getTripsByPassenger(
    @Param('passengerId') passengerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.tripService.getTripsByPassenger(passengerId, +page, +limit);
  }

  @Get('rider/:riderId')
  getTripsByRider(
    @Param('riderId') riderId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.tripService.getTripsByRider(riderId, +page, +limit);
  }

  @Patch(':id/lock-broadcast')
  lockBroadcast(@Param('id') id: string, @Body() dto: LockBroadcastDto) {
    return this.tripService.lockBroadcast(id, dto);
  }

  @Patch(':id/release-broadcast')
  releaseBroadcast(@Param('id') id: string) {
    return this.tripService.releaseBroadcast(id);
  }

  @Patch(':id/start')
  startTrip(@Param('id') id: string) {
    return this.tripService.startTrip(id);
  }

  @Patch(':id/complete')
  completeTrip(@Param('id') id: string) {
    return this.tripService.completeTrip(id);
  }

  @Patch(':id/cancel')
  cancelTrip(@Param('id') id: string, @Body() dto: CancelTripDto) {
    return this.tripService.cancelTrip(id, dto);
  }

  @Patch(':id/dispute')
  flagDispute(@Param('id') id: string, @Body() dto: FlagDisputeDto) {
    return this.tripService.flagDispute(id, dto);
  }

  @Patch(':id/handoff')
  handoffTrip(@Param('id') id: string, @Body() dto: HandoffTripDto) {
    return this.tripService.handoffTrip(id, dto);
  }
}
