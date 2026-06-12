import { Injectable, Inject, Logger } from '@nestjs/common';
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
import { TripType } from 'src/domain/trip/enums/trip-type.enum';
import { CancelledBy } from 'src/domain/trip/enums/cancelled-by.enum';
import { generateId } from 'src/application/shared/utils/id-generator';
import { NotFoundException } from 'src/domain/shared/exceptions/not-found.exception';
import { ForbiddenException } from 'src/domain/shared/exceptions/forbidden.exception';
import { ConflictException } from 'src/domain/shared/exceptions/conflict.exception';
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
import { TripBroadcastReleasedEvent } from 'src/domain/trip/events/trip-broadcast-released.event';
import { TripBroadcastGateway } from 'src/presentation/gateways/trip-broadcast.gateway';
import { PaymentStatus } from 'src/domain/trip/enums/payment-status.enum';

@Injectable()
export class TripService {
  private readonly logger = new Logger(TripService.name);

  constructor(
    @Inject('ITripRepository') private readonly tripRepository: ITripRepository,
    @Inject('IPricePredictorPort') private readonly pricePredictor: IPricePredictorPort,
    @Inject('INotificationPort') private readonly notification: INotificationPort,
    @Inject('IPaymentGatewayPort') private readonly paymentGateway: IPaymentGatewayPort,
    @Inject('IGeolocationPort') private readonly geolocation: IGeolocationPort,
    @Inject('IEventPublisherPort') private readonly eventPublisher: IEventPublisherPort,
    private readonly broadcastGateway: TripBroadcastGateway,
  ) {}

  async createTrip(passengerId: string, dto: CreateTripDto): Promise<TripResponseDto> {
    const existing = await this.tripRepository.findActiveByPassengerId(passengerId);
    if (existing) {
      throw new ConflictException(`Passenger already has an active trip (${existing.getId()})`);
    }

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
      deliveryId: dto.deliveryId,
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
    this.logger.log(`Trip ${trip.getId()} created — TripCreatedEvent queued to outbox`);

    return TripResponseDto.fromEntity(trip);
  }

  async lockBroadcast(tripId: string, dto: LockBroadcastDto): Promise<TripResponseDto> {
    const trip = await this.findOrFail(tripId);
    const rider = User.fromId(dto.riderId);
    const vehicle = new Vehicle(dto.vehicleType as VehicleType, dto.vehicleLicensePlate);

    trip.lockBroadcast(rider, vehicle, dto.agreedPrice);
    await this.tripRepository.update(trip);

    await this.eventPublisher.publish(new TripBroadcastLockedEvent(
      trip.getId(), rider, vehicle, dto.agreedPrice, trip.getDeliveryId(),
    ));

    await this.notification.notifyUser(
      trip.getPassenger().getId(),
      'A rider has been matched for your trip.',
      { tripId: trip.getId(), riderId: dto.riderId },
    );

    const response = TripResponseDto.fromEntity(trip);
    this.broadcastGateway.broadcastTripUpdate(trip.getId(), response);
    this.broadcastGateway.broadcastRiderMatched(trip.getId(), dto.riderId);
    return response;
  }

  async releaseBroadcast(tripId: string): Promise<TripResponseDto> {
    const trip = await this.findOrFail(tripId);
    const prevRiderId = trip.getRider()?.getId();

    trip.releaseBroadcast();
    await this.tripRepository.update(trip);

    await this.eventPublisher.publish(new TripBroadcastReleasedEvent(trip.getId(), trip.getDeliveryId()));

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

    const response = TripResponseDto.fromEntity(trip);
    this.broadcastGateway.broadcastTripUpdate(trip.getId(), response);
    return response;
  }

  async confirmPickup(tripId: string, passengerId: string): Promise<TripResponseDto> {
    const trip = await this.findOrFail(tripId);

    if (!trip.belongsTo(passengerId) || trip.getPassenger().getId() !== passengerId) {
      throw new ForbiddenException('Only the passenger can confirm pickup');
    }

    trip.confirmPickup();

    const transactionId = await this.paymentGateway.hold(
      passengerId,
      trip.getAgreedPrice()!,
      'RWF',
    );
    trip.attachHoldTransaction(transactionId);

    await this.tripRepository.update(trip);

    const response = TripResponseDto.fromEntity(trip);
    this.broadcastGateway.broadcastTripUpdate(trip.getId(), response);

    if (trip.getRider()) {
      await this.notification.notifyRider(
        trip.getRider()!.getId(),
        'Passenger confirmed pickup — payment held.',
        { tripId: trip.getId() },
      );
    }

    return response;
  }

  async completeTrip(tripId: string): Promise<TripResponseDto> {
    const trip = await this.findOrFail(tripId);

    trip.complete();
    await this.tripRepository.update(trip);

    const holdTransactionId = trip.getPayment().getHoldTransactionId();
    if (holdTransactionId) {
      await this.paymentGateway.release(holdTransactionId);
      await this.paymentGateway.payout(
        trip.getRider()!.getId(),
        trip.getAgreedPrice()!,
        'RWF',
      );
    }

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

    const response = TripResponseDto.fromEntity(trip);
    this.broadcastGateway.broadcastTripUpdate(trip.getId(), response);
    return response;
  }

  async cancelTrip(tripId: string, dto: CancelTripDto): Promise<TripResponseDto> {
    const trip = await this.findOrFail(tripId);

    trip.cancel(dto.cancelledBy, dto.reason);
    await this.tripRepository.update(trip);

    const holdTransactionId = trip.getPayment().getHoldTransactionId();
    if (holdTransactionId && trip.getPayment().getStatus() === PaymentStatus.REFUNDED) {
      await this.paymentGateway.refund(holdTransactionId);
    }

    await this.eventPublisher.publish(new TripCancelledEvent(
      trip.getId(), dto.cancelledBy, dto.reason,
    ));

    await this.notification.notifyUser(
      trip.getPassenger().getId(),
      'Your trip has been cancelled.',
      { tripId: trip.getId(), reason: dto.reason },
    );

    const response = TripResponseDto.fromEntity(trip);
    this.broadcastGateway.broadcastTripUpdate(trip.getId(), response);
    return response;
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

  async createTripFromDelivery(payload: {
    deliveryId: string;
    senderId: string;
    pickupLocation: { lat: number; lng: number; address: string };
    dropoffLocation: { lat: number; lng: number; address: string };
    packageDetails: { description: string; weightKg: number; lengthCm: number | null; widthCm: number | null; heightCm: number | null; isFragile: boolean };
  }): Promise<TripResponseDto> {
    const predictedPrice = await this.pricePredictor.predictPrice(
      { getLat: () => payload.pickupLocation.lat, getLng: () => payload.pickupLocation.lng, getAddress: () => payload.pickupLocation.address } as any,
      { getLat: () => payload.dropoffLocation.lat, getLng: () => payload.dropoffLocation.lng, getAddress: () => payload.dropoffLocation.address } as any,
      TripType.PACKAGE,
      VehicleType.MOTORCYCLE,
    );

    return this.createTrip(payload.senderId, {
      type: TripType.PACKAGE,
      deliveryId: payload.deliveryId,
      originLat: payload.pickupLocation.lat,
      originLng: payload.pickupLocation.lng,
      originAddress: payload.pickupLocation.address,
      destinationLat: payload.dropoffLocation.lat,
      destinationLng: payload.dropoffLocation.lng,
      destinationAddress: payload.dropoffLocation.address,
      requestedVehicleType: VehicleType.MOTORCYCLE,
      predictedPrice: predictedPrice > 0 ? predictedPrice : 1,
      packageDetails: {
        weight: payload.packageDetails.weightKg,
        dimensions: {
          width: payload.packageDetails.widthCm ?? 0,
          height: payload.packageDetails.heightCm ?? 0,
          depth: payload.packageDetails.lengthCm ?? 0,
        },
        description: payload.packageDetails.description,
        isFragile: payload.packageDetails.isFragile,
      },
    });
  }

  async getActiveTrip(passengerId: string): Promise<TripResponseDto> {
    const trip = await this.tripRepository.findActiveByPassengerId(passengerId);
    if (!trip) throw new NotFoundException('No active trip found');
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
