// domain/trip/entities/trip.entity.ts

import { User } from "src/domain/user/entities/user.entity";
import { Vehicle } from "src/domain/rider/value-objects/vehicle.vo";
import { Location } from "../value-objects/location.vo";
import { Payment } from "../value-objects/payment.vo";
import { TimelineEntry } from "../value-objects/timeline-entry.vo";
import { PackageDetails } from "../value-objects/package-details.vo";
import { TripType } from "../enums/trip-type.enum";
import { TripStatus } from "../enums/trip-status.enum";
import { BroadcastStatus } from "../enums/broadcast-status.enum";
import { VehicleType } from "src/domain/rider/enums/vehicle-type.enum";
import { CancelledBy } from "../enums/cancelled-by.enum";

export class Trip {
  private constructor(
    private readonly id: string,
    private readonly type: TripType,
    private readonly passenger: User,
    private rider: User | null,
    private readonly origin: Location,
    private readonly destination: Location,
    private readonly requestedVehicleType: VehicleType,
    private vehicle: Vehicle | null,
    private predictedPrice: number,
    private agreedPrice: number | null,
    private broadcastStatus: BroadcastStatus,
    private tripStatus: TripStatus,
    private timeline: TimelineEntry[],
    private payment: Payment,
    private readonly notes: string | null,
    private readonly distance: number | null,
    private readonly estimatedDuration: number | null,
    private cancellationReason: string | null,
    private disputeReason: string | null,
    private readonly packageDetails: PackageDetails | null,
    private readonly deliveryId: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private pickupConfirmed: boolean = false,
  ) {}

  // ── Factory ────────────────────────────────────────────────
  static create(props: {
    id: string;
    type: TripType;
    passenger: User;
    origin: Location;
    destination: Location;
    requestedVehicleType: VehicleType;
    predictedPrice: number;
    notes?: string;
    distance?: number;
    estimatedDuration?: number;
    packageDetails?: PackageDetails;
    deliveryId?: string;
  }): Trip {
    if (props.type === TripType.PACKAGE && !props.packageDetails) {
      throw new Error("Package trips require packageDetails");
    }
    if (props.type === TripType.PACKAGE && !props.deliveryId) {
      throw new Error("Package trips require a deliveryId");
    }
    if (props.predictedPrice <= 0) {
      throw new Error("Predicted price must be positive");
    }

    const now = new Date();
    const trip = new Trip(
      props.id,
      props.type,
      props.passenger,
      null,
      props.origin,
      props.destination,
      props.requestedVehicleType,
      null,
      props.predictedPrice,
      null,
      BroadcastStatus.OPEN,
      TripStatus.PENDING,
      [],
      Payment.initial(),
      props.notes ?? null,
      props.distance ?? null,
      props.estimatedDuration ?? null,
      null,
      null,
      props.packageDetails ?? null,
      props.deliveryId ?? null,
      now,
      now,
      false,
    );
    trip.recordTimeline(TripStatus.PENDING);
    return trip;
  }

  static reconstitute(props: {
    id: string;
    type: TripType;
    passenger: User;
    rider: User | null;
    origin: Location;
    destination: Location;
    requestedVehicleType: VehicleType;
    vehicle: Vehicle | null;
    predictedPrice: number;
    agreedPrice: number | null;
    broadcastStatus: BroadcastStatus;
    tripStatus: TripStatus;
    timeline: TimelineEntry[];
    payment: Payment;
    notes: string | null;
    distance: number | null;
    estimatedDuration: number | null;
    cancellationReason: string | null;
    disputeReason: string | null;
    packageDetails: PackageDetails | null;
    deliveryId: string | null;
    createdAt: Date;
    updatedAt: Date;
    pickupConfirmed?: boolean;
  }): Trip {
    return new Trip(
      props.id, props.type, props.passenger, props.rider,
      props.origin, props.destination, props.requestedVehicleType, props.vehicle,
      props.predictedPrice, props.agreedPrice, props.broadcastStatus, props.tripStatus,
      props.timeline, props.payment, props.notes, props.distance, props.estimatedDuration,
      props.cancellationReason, props.disputeReason, props.packageDetails,
      props.deliveryId,
      props.createdAt, props.updatedAt,
      props.pickupConfirmed ?? false,
    );
  }

  // ── Broadcast lifecycle ────────────────────────────────────
  lockBroadcast(rider: User, vehicle: Vehicle, agreedPrice: number): void {
    if (this.broadcastStatus !== BroadcastStatus.OPEN) {
      throw new Error("Broadcast can only be locked when OPEN");
    }
    if (agreedPrice <= 0) {
      throw new Error("Agreed price must be positive");
    }
    this.rider = rider;
    this.vehicle = vehicle;
    this.agreedPrice = agreedPrice;
    this.broadcastStatus = BroadcastStatus.LOCKED;
    this.touch();
  }

  releaseBroadcast(): void {
    if (this.broadcastStatus !== BroadcastStatus.LOCKED) {
      throw new Error("Only LOCKED broadcasts can be released");
    }
    if (this.tripStatus !== TripStatus.PENDING) {
      throw new Error("Cannot release a broadcast for a started trip");
    }
    this.rider = null;
    this.vehicle = null;
    this.agreedPrice = null;
    this.broadcastStatus = BroadcastStatus.OPEN;
    this.touch();
  }

  private closeBroadcast(): void {
    if (this.broadcastStatus === BroadcastStatus.CLOSED) return;
    this.broadcastStatus = BroadcastStatus.CLOSED;
    this.touch();
  }

  // ── Trip lifecycle ─────────────────────────────────────────
  start(): void {
    if (this.tripStatus !== TripStatus.PENDING) {
      throw new Error("Only PENDING trips can be started");
    }
    if (this.broadcastStatus !== BroadcastStatus.LOCKED) {
      throw new Error("Trip cannot start without a locked rider");
    }
    if (this.agreedPrice === null) {
      throw new Error("Trip cannot start without an agreed price");
    }
    this.tripStatus = TripStatus.ONGOING;
    this.payment = this.payment.hold();
    this.closeBroadcast();
    this.recordTimeline(TripStatus.ONGOING);
  }

  complete(): void {
    if (this.tripStatus !== TripStatus.ONGOING) {
      throw new Error("Only ONGOING trips can be completed");
    }
    this.tripStatus = TripStatus.COMPLETED;
    this.payment = this.payment.release();
    this.recordTimeline(TripStatus.COMPLETED);
  }

  confirmPickup(): void {
    if (this.tripStatus !== TripStatus.ONGOING) {
      throw new Error("Pickup can only be confirmed for ONGOING trips");
    }
    if (this.pickupConfirmed) {
      throw new Error("Pickup has already been confirmed");
    }
    this.pickupConfirmed = true;
    this.touch();
  }

  attachHoldTransaction(transactionId: string): void {
    this.payment = this.payment.withHoldTransaction(transactionId);
    this.touch();
  }

  cancel(cancelledBy: CancelledBy, reason: string): void {
    if (
      this.tripStatus === TripStatus.COMPLETED ||
      this.tripStatus === TripStatus.CANCELLED
    ) {
      throw new Error(`Cannot cancel a ${this.tripStatus} trip`);
    }
    if (!reason?.trim()) {
      throw new Error("Cancellation reason is required");
    }
    this.tripStatus = TripStatus.CANCELLED;
    this.cancellationReason = `${cancelledBy}: ${reason}`;
    if (this.payment.isHeld()) {
      this.payment = this.payment.refund();
    }
    this.closeBroadcast();
    this.recordTimeline(TripStatus.CANCELLED);
  }

  // ── Disputes & Handoff ────────────────────────────────────
  flagForDispute(flaggedBy: User, reason: string): void {
    if (this.tripStatus === TripStatus.CANCELLED) {
      throw new Error("Cancelled trips cannot be disputed");
    }
    if (!this.belongsTo(flaggedBy.getId())) {
      throw new Error("Only trip participants can flag disputes");
    }
    if (!reason?.trim()) {
      throw new Error("Dispute reason is required");
    }
    this.tripStatus = TripStatus.DISPUTED;
    this.disputeReason = reason;
    this.recordTimeline(TripStatus.DISPUTED);
  }

  handoff(fromRider: User, toRider: User, newVehicle: Vehicle): void {
    if (this.tripStatus !== TripStatus.ONGOING) {
      throw new Error("Handoff only allowed on ONGOING trips");
    }
    if (this.rider?.getId() !== fromRider.getId()) {
      throw new Error("Only the current rider can hand off the trip");
    }
    if (fromRider.getId() === toRider.getId()) {
      throw new Error("Cannot hand off to the same rider");
    }
    this.rider = toRider;
    this.vehicle = newVehicle;
    this.touch();
  }

  recordHandoffCompensation(riderId: string, portionCompleted: number): void {
    if (portionCompleted < 0 || portionCompleted > 1) {
      throw new Error("Portion must be between 0 and 1");
    }
    this.payment = this.payment.recordSplit(riderId, portionCompleted);
    this.touch();
  }

  // ── Instance queries ──────────────────────────────────────
  getDuration(): number | null {
    const start = this.timeline.find(
      e => e.getStatus() === TripStatus.ONGOING,
    );
    const end = this.timeline.find(
      e =>
        e.getStatus() === TripStatus.COMPLETED ||
        e.getStatus() === TripStatus.CANCELLED,
    );
    if (!start || !end) return null;
    return end.getTimestamp().getTime() - start.getTimestamp().getTime();
  }

  isActive(): boolean {
    return (
      this.tripStatus === TripStatus.PENDING ||
      this.tripStatus === TripStatus.ONGOING
    );
  }

  belongsTo(userId: string): boolean {
    return (
      this.passenger.getId() === userId || this.rider?.getId() === userId
    );
  }

  // ── Internal helpers ──────────────────────────────────────
  private recordTimeline(status: TripStatus): void {
    this.timeline.push(TimelineEntry.create(status));
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  // ── Getters ───────────────────────────────────────────────
  getId(): string { return this.id; }
  getType(): TripType { return this.type; }
  getPassenger(): User { return this.passenger; }
  getRider(): User | null { return this.rider; }
  getOrigin(): Location { return this.origin; }
  getDestination(): Location { return this.destination; }
  getRequestedVehicleType(): VehicleType { return this.requestedVehicleType; }
  getVehicle(): Vehicle | null { return this.vehicle; }
  getPredictedPrice(): number { return this.predictedPrice; }
  getAgreedPrice(): number | null { return this.agreedPrice; }
  getBroadcastStatus(): BroadcastStatus { return this.broadcastStatus; }
  getTripStatus(): TripStatus { return this.tripStatus; }
  getTimeline(): TimelineEntry[] { return [...this.timeline]; }
  getPayment(): Payment { return this.payment; }
  getNotes(): string | null { return this.notes; }
  getDistance(): number | null { return this.distance; }
  getEstimatedDuration(): number | null { return this.estimatedDuration; }
  getCancellationReason(): string | null { return this.cancellationReason; }
  getDisputeReason(): string | null { return this.disputeReason; }
  getPackageDetails(): PackageDetails | null { return this.packageDetails; }
  getDeliveryId(): string | null { return this.deliveryId; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
  isPickupConfirmed(): boolean { return this.pickupConfirmed; }
}