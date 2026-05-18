import { Delivery } from 'src/domain/delivery/entities/delivery.entity';
import { User } from 'src/domain/user/entities/user.entity';
import { Location } from 'src/domain/delivery/value-objects/location.vo';
import { Recipient } from 'src/domain/delivery/value-objects/recipient.vo';
import { PackageDetails } from 'src/domain/delivery/value-objects/package-details.vo';
import { TimeWindow } from 'src/domain/delivery/value-objects/time-window.vo';
import { CodInfo } from 'src/domain/delivery/value-objects/cod-info.vo';
import { ProofOfPickup } from 'src/domain/delivery/value-objects/proof-of-pickup.vo';
import { ProofOfDelivery } from 'src/domain/delivery/value-objects/proof-of-delivery.vo';
import { DeliveryAttempt } from 'src/domain/delivery/value-objects/delivery-attempt.vo';
import { TimelineEntry } from 'src/domain/delivery/value-objects/timeline-entry.vo';
import { DeliveryOrmEntity } from '../entities/delivery.orm-entity';

export class DeliveryMapper {
  static toDomain(orm: DeliveryOrmEntity): Delivery {
    const sender = User.reconstitute(orm.sender);

    const recipient = Recipient.create(orm.recipient.name, orm.recipient.phone, orm.recipient.email ?? undefined);

    const pickupLocation = Location.create(orm.pickupLocation.lat, orm.pickupLocation.lng, orm.pickupLocation.address);
    const dropoffLocation = Location.create(orm.dropoffLocation.lat, orm.dropoffLocation.lng, orm.dropoffLocation.address);

    const packageDetails = PackageDetails.create({
      description: orm.packageDetails.description,
      weightKg: orm.packageDetails.weightKg,
      lengthCm: orm.packageDetails.lengthCm ?? undefined,
      widthCm: orm.packageDetails.widthCm ?? undefined,
      heightCm: orm.packageDetails.heightCm ?? undefined,
      isFragile: orm.packageDetails.isFragile,
    });

    const deliveryWindow = orm.deliveryWindow
      ? TimeWindow.create(new Date(orm.deliveryWindow.from), new Date(orm.deliveryWindow.to))
      : null;

    const codInfo = orm.codInfo
      ? CodInfo.reconstitute(
          orm.codInfo.amount,
          orm.codInfo.status,
          orm.codInfo.collectedAt ? new Date(orm.codInfo.collectedAt) : null,
          orm.codInfo.remittedAt ? new Date(orm.codInfo.remittedAt) : null,
        )
      : null;

    const proofOfPickup = orm.proofOfPickup
      ? ProofOfPickup.reconstitute({
          type: orm.proofOfPickup.type,
          fileUrl: orm.proofOfPickup.fileUrl,
          capturedAt: new Date(orm.proofOfPickup.capturedAt),
          capturedByRiderId: orm.proofOfPickup.capturedByRiderId,
        })
      : null;

    const proofOfDelivery = orm.proofOfDelivery
      ? ProofOfDelivery.reconstitute({
          type: orm.proofOfDelivery.type,
          fileUrl: orm.proofOfDelivery.fileUrl,
          capturedAt: new Date(orm.proofOfDelivery.capturedAt),
          capturedByRiderId: orm.proofOfDelivery.capturedByRiderId,
          deliveredTo: orm.proofOfDelivery.deliveredTo,
        })
      : null;

    const attempts = orm.attempts.map(a =>
      DeliveryAttempt.reconstitute({
        riderId: a.riderId,
        attemptedAt: new Date(a.attemptedAt),
        successful: a.successful,
        failureReason: a.failureReason,
        notes: a.notes,
      }),
    );

    const timeline = orm.timeline.map(t =>
      TimelineEntry.reconstitute(t.status, new Date(t.timestamp)),
    );

    return Delivery.reconstitute({
      id: orm.id,
      trackingNumber: orm.trackingNumber,
      sender,
      recipient,
      pickupLocation,
      dropoffLocation,
      packageDetails,
      deliveryWindow,
      specialInstructions: orm.specialInstructions,
      codInfo,
      status: orm.status,
      currentTripId: orm.currentTripId,
      proofOfPickup,
      proofOfDelivery,
      attempts,
      timeline,
      cancellationReason: orm.cancellationReason,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(delivery: Delivery): DeliveryOrmEntity {
    const orm = new DeliveryOrmEntity();
    orm.id = delivery.getId();
    orm.trackingNumber = delivery.getTrackingNumber();
    orm.sender = {
      id: delivery.getSender().getId(),
      name: delivery.getSender().getName(),
      phone: delivery.getSender().getPhone(),
      email: delivery.getSender().getEmail(),
    };
    orm.recipient = {
      name: delivery.getRecipient().getName(),
      phone: delivery.getRecipient().getPhone(),
      email: delivery.getRecipient().getEmail(),
    };
    orm.pickupLocation = {
      lat: delivery.getPickupLocation().getLat(),
      lng: delivery.getPickupLocation().getLng(),
      address: delivery.getPickupLocation().getAddress(),
    };
    orm.dropoffLocation = {
      lat: delivery.getDropoffLocation().getLat(),
      lng: delivery.getDropoffLocation().getLng(),
      address: delivery.getDropoffLocation().getAddress(),
    };
    const pkg = delivery.getPackageDetails();
    orm.packageDetails = {
      description: pkg.getDescription(),
      weightKg: pkg.getWeightKg(),
      lengthCm: pkg.getLengthCm(),
      widthCm: pkg.getWidthCm(),
      heightCm: pkg.getHeightCm(),
      isFragile: pkg.isPackageFragile(),
    };
    const win = delivery.getDeliveryWindow();
    orm.deliveryWindow = win
      ? { from: win.getFrom().toISOString(), to: win.getTo().toISOString() }
      : null;
    orm.specialInstructions = delivery.getSpecialInstructions();
    const cod = delivery.getCodInfo();
    orm.codInfo = cod
      ? {
          amount: cod.getAmount(),
          status: cod.getStatus(),
          collectedAt: cod.getCollectedAt()?.toISOString() ?? null,
          remittedAt: cod.getRemittedAt()?.toISOString() ?? null,
        }
      : null;
    orm.status = delivery.getStatus();
    orm.currentTripId = delivery.getCurrentTripId();
    const pop = delivery.getProofOfPickup();
    orm.proofOfPickup = pop
      ? { type: pop.getType(), fileUrl: pop.getFileUrl(), capturedAt: pop.getCapturedAt().toISOString(), capturedByRiderId: pop.getCapturedByRiderId() }
      : null;
    const pod = delivery.getProofOfDelivery();
    orm.proofOfDelivery = pod
      ? { type: pod.getType(), fileUrl: pod.getFileUrl(), capturedAt: pod.getCapturedAt().toISOString(), capturedByRiderId: pod.getCapturedByRiderId(), deliveredTo: pod.getDeliveredTo() }
      : null;
    orm.attempts = delivery.getAttempts().map(a => ({
      riderId: a.getRiderId(),
      attemptedAt: a.getAttemptedAt().toISOString(),
      successful: a.isSuccessful(),
      failureReason: a.getFailureReason(),
      notes: a.getNotes(),
    }));
    orm.timeline = delivery.getTimeline().map(t => ({
      status: t.getStatus(),
      timestamp: t.getTimestamp().toISOString(),
    }));
    orm.cancellationReason = delivery.getCancellationReason();
    return orm;
  }
}
