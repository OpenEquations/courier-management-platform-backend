import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { Delivery } from 'src/domain/delivery/entities/delivery.entity';
import { User } from 'src/domain/user/entities/user.entity';
import { Location } from 'src/domain/delivery/value-objects/location.vo';
import { Recipient } from 'src/domain/delivery/value-objects/recipient.vo';
import { PackageDetails } from 'src/domain/delivery/value-objects/package-details.vo';
import { TimeWindow } from 'src/domain/delivery/value-objects/time-window.vo';
import { ProofOfPickup } from 'src/domain/delivery/value-objects/proof-of-pickup.vo';
import { ProofOfDelivery } from 'src/domain/delivery/value-objects/proof-of-delivery.vo';
import type { IDeliveryRepository } from 'src/domain/delivery/interfaces/repositories/delivery.repository.interface';
import { NotFoundException } from 'src/domain/shared/exceptions/not-found.exception';
import { DeliveryCreatedEvent } from 'src/domain/delivery/events/delivery-created.event';
import { DeliveryPickedUpEvent } from 'src/domain/delivery/events/delivery-picked-up.event';
import { DeliveryDeliveredEvent } from 'src/domain/delivery/events/delivery-delivered.event';
import { DeliveryAttemptFailedEvent } from 'src/domain/delivery/events/delivery-attempt-failed.event';
import { DeliveryReturnedEvent } from 'src/domain/delivery/events/delivery-returned.event';
import { DeliveryCancelledEvent } from 'src/domain/delivery/events/delivery-cancelled.event';
import { CodCollectedEvent } from 'src/domain/delivery/events/cod-collected.event';
import type { INotificationPort } from './ports/out/notification.port';
import type { ITrackingNumberGeneratorPort } from './ports/out/tracking-number-generator.port';
import { generateId } from '../shared/utils/id-generator';
import { DeliveryOrmEntity } from 'src/inflastructure/persistence/typeorm/entities/delivery.orm-entity';
import { OutboxEventOrmEntity } from 'src/inflastructure/persistence/typeorm/entities/outbox-event.orm-entity';
import { DeliveryMapper } from 'src/inflastructure/persistence/typeorm/mappers/delivery.mapper';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { RecordPickupDto } from './dto/record-pickup.dto';
import { RecordDeliveryDto } from './dto/record-delivery.dto';
import { RecordFailedAttemptDto } from './dto/record-failed-attempt.dto';
import { DeliveryResponseDto } from './dto/delivery-response.dto';
import { TrackingResponseDto } from './dto/tracking-response.dto';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject('IDeliveryRepository')
    private readonly repo: IDeliveryRepository,
    @Inject('INotificationPort')
    private readonly notification: INotificationPort,
    @Inject('ITrackingNumberGeneratorPort')
    private readonly trackingGen: ITrackingNumberGeneratorPort,
  ) {}

  // ── Transactional helper: saves aggregate + outbox event atomically ──────
  private async saveWithEvent(delivery: Delivery, event: object, manager: EntityManager): Promise<void> {
    const e = event as { eventId: string; eventType: string; deliveryId?: string };
    await manager.save(DeliveryOrmEntity, DeliveryMapper.toOrm(delivery));
    await manager.save(OutboxEventOrmEntity, {
      id: e.eventId,
      eventType: e.eventType,
      aggregateId: e.deliveryId ?? delivery.getId(),
      payload: event,
      published: false,
    });
  }

  async createDelivery(dto: CreateDeliveryDto): Promise<DeliveryResponseDto> {
    const sender = User.reconstitute(dto.sender);
    const recipient = Recipient.create(dto.recipient.name, dto.recipient.phone, dto.recipient.email);
    const pickupLocation = Location.create(dto.pickupLocation.lat, dto.pickupLocation.lng, dto.pickupLocation.address);
    const dropoffLocation = Location.create(dto.dropoffLocation.lat, dto.dropoffLocation.lng, dto.dropoffLocation.address);
    const packageDetails = PackageDetails.create(dto.packageDetails);
    const deliveryWindow = dto.deliveryWindow
      ? TimeWindow.create(new Date(dto.deliveryWindow.from), new Date(dto.deliveryWindow.to))
      : undefined;

    const delivery = Delivery.create({
      id: generateId(),
      trackingNumber: this.trackingGen.generate(),
      sender, recipient, pickupLocation, dropoffLocation, packageDetails,
      deliveryWindow,
      specialInstructions: dto.specialInstructions,
      codAmount: dto.codAmount,
    });

    const pkg = delivery.getPackageDetails();
    const event = new DeliveryCreatedEvent(
      delivery.getId(),
      delivery.getTrackingNumber(),
      sender.getId(),
      recipient.getPhone(),
      { lat: delivery.getPickupLocation().getLat(), lng: delivery.getPickupLocation().getLng(), address: delivery.getPickupLocation().getAddress() },
      { lat: delivery.getDropoffLocation().getLat(), lng: delivery.getDropoffLocation().getLng(), address: delivery.getDropoffLocation().getAddress() },
      { description: pkg.getDescription(), weightKg: pkg.getWeightKg(), lengthCm: pkg.getLengthCm(), widthCm: pkg.getWidthCm(), heightCm: pkg.getHeightCm(), isFragile: pkg.isPackageFragile() },
      new Date(),
    );

    await this.dataSource.transaction(m => this.saveWithEvent(delivery, event, m));

    await this.notification.notifyRecipient(
      recipient.getPhone(),
      `Your delivery ${delivery.getTrackingNumber()} has been created and will be picked up soon.`,
    );

    return DeliveryResponseDto.from(delivery);
  }

  async getDelivery(id: string): Promise<DeliveryResponseDto> {
    const delivery = await this.findOrFail(id);
    return DeliveryResponseDto.from(delivery);
  }

  async trackByNumber(trackingNumber: string): Promise<TrackingResponseDto> {
    const delivery = await this.repo.findByTrackingNumber(trackingNumber);
    if (!delivery) throw new NotFoundException(`Tracking number ${trackingNumber} not found`);
    return TrackingResponseDto.from(delivery);
  }

  async getDeliveriesBySender(senderId: string): Promise<DeliveryResponseDto[]> {
    return (await this.repo.findBySenderId(senderId)).map(DeliveryResponseDto.from);
  }

  async getDeliveriesByCourier(courierId: string): Promise<DeliveryResponseDto[]> {
    return (await this.repo.findByCourierId(courierId)).map(DeliveryResponseDto.from);
  }

  async assignToTrip(id: string, tripId: string): Promise<DeliveryResponseDto> {
    const delivery = await this.findOrFail(id);
    delivery.assignToTrip(tripId);
    await this.repo.save(delivery);
    return DeliveryResponseDto.from(delivery);
  }

  async unassignFromTrip(id: string): Promise<DeliveryResponseDto> {
    const delivery = await this.findOrFail(id);
    delivery.unassignFromTrip();
    await this.repo.save(delivery);
    return DeliveryResponseDto.from(delivery);
  }

  async recordPickup(id: string, dto: RecordPickupDto): Promise<DeliveryResponseDto> {
    const delivery = await this.findOrFail(id);
    const proof = ProofOfPickup.create({ type: dto.proofType, fileUrl: dto.fileUrl, capturedByRiderId: dto.capturedByRiderId });
    delivery.recordPickup(proof);

    const event = new DeliveryPickedUpEvent(
      delivery.getId(), delivery.getTrackingNumber(),
      dto.capturedByRiderId, delivery.getCurrentTripId() ?? '',
      new Date(),
    );

    await this.dataSource.transaction(m => this.saveWithEvent(delivery, event, m));

    await this.notification.notifyRecipient(
      delivery.getRecipient().getPhone(),
      `Your delivery ${delivery.getTrackingNumber()} has been picked up and is on its way.`,
    );
    return DeliveryResponseDto.from(delivery);
  }

  async markInTransit(id: string): Promise<DeliveryResponseDto> {
    const delivery = await this.findOrFail(id);
    delivery.markInTransit();
    await this.repo.save(delivery);
    return DeliveryResponseDto.from(delivery);
  }

  async markOutForDelivery(id: string): Promise<DeliveryResponseDto> {
    const delivery = await this.findOrFail(id);
    delivery.markOutForDelivery();
    await this.repo.save(delivery);
    await this.notification.notifyRecipient(
      delivery.getRecipient().getPhone(),
      `Your delivery ${delivery.getTrackingNumber()} is out for delivery today.`,
    );
    return DeliveryResponseDto.from(delivery);
  }

  async recordSuccessfulDelivery(id: string, dto: RecordDeliveryDto): Promise<DeliveryResponseDto> {
    const delivery = await this.findOrFail(id);
    const proof = ProofOfDelivery.create({
      type: dto.proofType, fileUrl: dto.fileUrl,
      capturedByRiderId: dto.capturedByRiderId, deliveredTo: dto.deliveredTo,
    });
    delivery.recordSuccessfulDelivery(proof, dto.capturedByRiderId);

    const event = new DeliveryDeliveredEvent(
      delivery.getId(), delivery.getTrackingNumber(),
      dto.capturedByRiderId, delivery.getCurrentTripId(),
      delivery.hasOutstandingCod(), new Date(),
    );

    await this.dataSource.transaction(m => this.saveWithEvent(delivery, event, m));

    await this.notification.notifySender(
      delivery.getSender().getId(),
      `Delivery ${delivery.getTrackingNumber()} delivered to ${dto.deliveredTo}.`,
    );
    return DeliveryResponseDto.from(delivery);
  }

  async recordFailedAttempt(id: string, dto: RecordFailedAttemptDto): Promise<DeliveryResponseDto> {
    const delivery = await this.findOrFail(id);
    delivery.recordFailedAttempt(dto.riderId, dto.reason, dto.notes);

    const event = new DeliveryAttemptFailedEvent(
      delivery.getId(), delivery.getTrackingNumber(),
      dto.riderId, dto.reason, delivery.getAttemptCount(), new Date(),
    );

    await this.dataSource.transaction(m => this.saveWithEvent(delivery, event, m));

    await this.notification.notifySender(
      delivery.getSender().getId(),
      `Delivery attempt for ${delivery.getTrackingNumber()} failed: ${dto.reason}.`,
    );
    return DeliveryResponseDto.from(delivery);
  }

  async collectCod(id: string, riderId: string): Promise<DeliveryResponseDto> {
    const delivery = await this.findOrFail(id);
    delivery.collectCod();
    const cod = delivery.getCodInfo()!;

    const event = new CodCollectedEvent(
      delivery.getId(), delivery.getTrackingNumber(), riderId, cod.getAmount(), new Date(),
    );

    await this.dataSource.transaction(m => this.saveWithEvent(delivery, event, m));
    return DeliveryResponseDto.from(delivery);
  }

  async remitCod(id: string): Promise<DeliveryResponseDto> {
    const delivery = await this.findOrFail(id);
    delivery.remitCod();
    await this.repo.save(delivery);
    return DeliveryResponseDto.from(delivery);
  }

  async returnToSender(id: string, reason: string): Promise<DeliveryResponseDto> {
    const delivery = await this.findOrFail(id);
    delivery.returnToSender(reason);

    const event = new DeliveryReturnedEvent(
      delivery.getId(), delivery.getTrackingNumber(),
      delivery.getSender().getId(), reason, new Date(),
    );

    await this.dataSource.transaction(m => this.saveWithEvent(delivery, event, m));
    return DeliveryResponseDto.from(delivery);
  }

  async cancelDelivery(id: string, reason: string): Promise<DeliveryResponseDto> {
    const delivery = await this.findOrFail(id);
    delivery.cancel(reason);

    const event = new DeliveryCancelledEvent(
      delivery.getId(), delivery.getTrackingNumber(), reason, new Date(),
    );

    await this.dataSource.transaction(m => this.saveWithEvent(delivery, event, m));
    return DeliveryResponseDto.from(delivery);
  }

  private async findOrFail(id: string): Promise<Delivery> {
    const delivery = await this.repo.findById(id);
    if (!delivery) throw new NotFoundException(`Delivery ${id} not found`);
    return delivery;
  }
}
