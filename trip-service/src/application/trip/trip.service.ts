import { Injectable, Inject } from '@nestjs/common';
import type { ITripRepository } from 'src/domain/trip/interfaces/repositories/trip.repository.interface';
import type { IPricePredictorPort } from './ports/out/price-predictor.port';
import type { INotificationPort } from './ports/out/notification.port';
import type { IPaymentGatewayPort } from './ports/out/payment-gateway.port';
import type { IGeolocationPort } from './ports/out/geolocation.port';
import type { IEventPublisherPort } from './ports/out/event-publisher.port';
import { TripFactory } from 'src/domain/trip/factories/trip.factory';
import { User } from 'src/domain/user/entities/user.entity';
import { Vehicle } from 'src/domain/rider/value-objects/vehicle.vo';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';
import { CancelledBy } from 'src/domain/trip/enums/cancelled-by.enum';
import { generateId } from 'src/application/shared/utils/id-generator';
import { NotFoundException } from 'src/domain/shared/exceptions/not-found.exception';
import { ForbiddenException } from 'src/domain/shared/exceptions/forbidden.exception';
import { CreateTripDto } from './dto/create-trip.dto';
import { LockBroadcastDto } from './dto/lock-broadcast.dto';
import { CancelTripDto } from './dto/cancel-trip.dto';
import { FlagDisputeDto } from './dto/flag-dispute.dto';
import { HandoffTripDto } from './dto/handoff-trip.dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { TripListResponseDto } from './dto/trip-list-response.dto';
import { TripCreatedEvent } from 'src/domain/trip/events/trip-created.event';
import { TripBroadcastLockedEvent } from 'src/domain/trip/events/trip-broadcast-locked.event';
import { TripStartedEvent } from 'src/domain/trip/events/trip-started.event';
import { TripCompletedEvent } from 'src/domain/trip/events/trip-completed.event';
import { TripCancelledEvent } from 'src/domain/trip/events/trip-cancelled.event';
import { TripDisputedEvent } from 'src/domain/trip/events/trip-disputed.event';
import { TripHandedOffEvent } from 'src/domain/trip/events/trip-handed-off.event';

@Injectable()
export class TripService {
  constructor(
    @Inject('ITripRepository') private readonly tripRepository: ITripRepository,
    @Inject('IPricePredictorPort') private readonly pricePredictor: IPricePredictorPort,
    @Inject('INotificationPort') private readonly notification: INotificationPort,
    @Inject('IPaymentGatewayPort') private readonly paymentGateway: IPaymentGatewayPort,
    @Inject('IGeolocationPort') private readonly geolocation: IGeolocationPort,
    @Inject('IEventPublisherPort') private readonly eventPublisher: IEventPublisherPort,
  ) {}

  async createTrip(passengerId: string, dto: CreateTripDto): Promise<TripResponseDto> {
    const trip = TripFactory.create({
      id: generateId(),
      passengerId,
      type: dto.type,
      originLat: dto.originLat,
      originLng: dto.originLng,
      originAddress: dto.originAddress,
      destinationLat: dto.destinationLat,
      destinationLng: dto.destinationLng,
      destinationAddress: dto.destinationAddress,
      requestedVehicleType: dto.requestedVehicleType,
      predictedPrice: dto.predictedPrice,
      notes: dto.notes,
      distance: dto.distance,
      estimatedDuration: dto.estimatedDuration,
      packageDetails: dto.packageDetails,
    });

    await this.tripRepository.save(trip);

    await this.eventPublisher.publish(new TripCreatedEvent(
      trip.getId(),
      trip.getPassenger(),
      trip.getOrigin(),
      trip.getDestination(),
      trip.getType(),
      trip.getRequestedVehicleType(),
      trip.getPredictedPrice(),
      trip.getPackageDetails(),
    ));

    return TripResponseDto.fromEntity(trip);
  }

  async lockBroadcast(tripId: string, dto: LockBroadcastDto): Promise<TripResponseDto> {
    const trip = await this.findOrFail(tripId);
    const rider = User.fromId(dto.riderId);
    const vehicle = new Vehicle(dto.vehicleType as VehicleType, dto.vehicleLicensePlate);

    trip.lockBroadcast(rider, vehicle, dto.agreedPrice);
    await this.tripRepository.update(trip);

    await this.eventPublisher.publish(new TripBroadcastLockedEvent(
      trip.getId(), rider, vehicle, dto.agreedPrice,
    ));

    await this.notification.notifyUser(
      trip.getPassenger().getId(),
      'A rider has been matched for your trip.',
      { tripId: trip.getId(), riderId: dto.riderId },
    );

    return TripResponseDto.fromEntity(trip);
  }

  async releaseBroadcast(tripId: string): Promise<TripResponseDto> {
    const trip = await this.findOrFail(tripId);
    const prevRiderId = trip.getRider()?.getId();

    trip.releaseBroadcast();
    await this.tripRepository.update(trip);

    if (prevRiderId) {
      await this.notification.notifyRider(prevRiderId, 'Broadcast has been released.');
    }

    return TripResponseDto.fromEntity(trip);
  }

  async startTrip(tripId: string): Promise<TripResponseDto> {
    const trip = await this.findOrFail(tripId);

    trip.start();
    await this.tripRepository.update(trip);

    await this.eventPublisher.publish(new TripStartedEvent(
      trip.getId(),
      trip.getRider()!,
      trip.getAgreedPrice()!,
    ));

    return TripResponseDto.fromEntity(trip);
  }

  async completeTrip(tripId: string): Promise<TripResponseDto> {
    const trip = await this.findOrFail(tripId);

    trip.complete();
    await this.tripRepository.update(trip);

    await this.eventPublisher.publish(new TripCompletedEvent(
      trip.getId(),
      trip.getPassenger().getId(),
      trip.getRider()!.getId(),
      trip.getPayment(),
    ));

    await this.notification.notifyUser(
      trip.getPassenger().getId(),
      'Your trip has been completed.',
      { tripId: trip.getId() },
    );

    return TripResponseDto.fromEntity(trip);
  }

  async cancelTrip(tripId: string, dto: CancelTripDto): Promise<TripResponseDto> {
    const trip = await this.findOrFail(tripId);

    trip.cancel(dto.cancelledBy, dto.reason);
    await this.tripRepository.update(trip);

    await this.eventPublisher.publish(new TripCancelledEvent(
      trip.getId(), dto.cancelledBy, dto.reason,
    ));

    await this.notification.notifyUser(
      trip.getPassenger().getId(),
      'Your trip has been cancelled.',
      { tripId: trip.getId(), reason: dto.reason },
    );

    return TripResponseDto.fromEntity(trip);
  }

  async flagDispute(tripId: string, dto: FlagDisputeDto): Promise<TripResponseDto> {
    const trip = await this.findOrFail(tripId);
    const flaggedBy = User.fromId(dto.flaggedById);

    if (!trip.belongsTo(dto.flaggedById)) {
      throw new ForbiddenException('Only trip participants can flag disputes');
    }

    trip.flagForDispute(flaggedBy, dto.reason);
    await this.tripRepository.update(trip);

    await this.eventPublisher.publish(new TripDisputedEvent(
      trip.getId(), flaggedBy, dto.reason,
    ));

    return TripResponseDto.fromEntity(trip);
  }

  async handoffTrip(tripId: string, dto: HandoffTripDto): Promise<TripResponseDto> {
    const trip = await this.findOrFail(tripId);
    const fromRider = User.fromId(dto.fromRiderId);
    const toRider = User.fromId(dto.toRiderId);
    const newVehicle = new Vehicle(dto.newVehicleType as VehicleType, dto.newVehicleLicensePlate);

    trip.recordHandoffCompensation(dto.fromRiderId, dto.portionCompleted);
    trip.handoff(fromRider, toRider, newVehicle);
    await this.tripRepository.update(trip);

    await this.eventPublisher.publish(new TripHandedOffEvent(
      trip.getId(), fromRider, toRider, newVehicle,
    ));

    return TripResponseDto.fromEntity(trip);
  }

  async getTripById(tripId: string): Promise<TripResponseDto> {
    const trip = await this.findOrFail(tripId);
    return TripResponseDto.fromEntity(trip);
  }

  async getTripsByPassenger(passengerId: string, page: number, limit: number): Promise<TripListResponseDto> {
    const result = await this.tripRepository.findByPassengerId(passengerId, page, limit);
    return { ...result, data: result.data.map(TripResponseDto.fromEntity) };
  }

  async getTripsByRider(riderId: string, page: number, limit: number): Promise<TripListResponseDto> {
    const result = await this.tripRepository.findByRiderId(riderId, page, limit);
    return { ...result, data: result.data.map(TripResponseDto.fromEntity) };
  }

  async getAllTrips(page: number, limit: number): Promise<TripListResponseDto> {
    const result = await this.tripRepository.findAll(page, limit);
    return { ...result, data: result.data.map(TripResponseDto.fromEntity) };
  }

  private async findOrFail(tripId: string) {
    const trip = await this.tripRepository.findById(tripId);
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);
    return trip;
  }
}
