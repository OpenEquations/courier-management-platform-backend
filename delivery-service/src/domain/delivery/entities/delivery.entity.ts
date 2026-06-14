import { User } from 'src/domain/user/entities/user.entity';
import { Location } from '../value-objects/location.vo';
import { Recipient } from '../value-objects/recipient.vo';
import { PackageDetails } from '../value-objects/package-details.vo';
import { ProofOfPickup } from '../value-objects/proof-of-pickup.vo';
import { ProofOfDelivery } from '../value-objects/proof-of-delivery.vo';
import { DeliveryAttempt } from '../value-objects/delivery-attempt.vo';
import { TimelineEntry } from '../value-objects/timeline-entry.vo';
import { TimeWindow } from '../value-objects/time-window.vo';
import { CodInfo } from '../value-objects/cod-info.vo';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { FailureReason } from '../enums/failure-reason.enum';

export class Delivery {
  private constructor(
    private readonly id: string,
    private readonly trackingNumber: string,
    private readonly sender: User,
    private readonly recipient: Recipient,
    private readonly pickupLocation: Location,
    private readonly dropoffLocation: Location,
    private readonly packageDetails: PackageDetails,
    private readonly deliveryWindow: TimeWindow | null,
    private readonly specialInstructions: string | null,
    private codInfo: CodInfo | null,
    private status: DeliveryStatus,
    private currentTripId: string | null,
    private proofOfPickup: ProofOfPickup | null,
    private proofOfDelivery: ProofOfDelivery | null,
    private attempts: DeliveryAttempt[],
    private timeline: TimelineEntry[],
    private cancellationReason: string | null,
    private readonly parcelImages: string[],
    private pickupImages: string[],
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  // ── Factory ─────────────────────────────────────────────
  static create(props: {
    id: string;
    trackingNumber: string;
    sender: User;
    recipient: Recipient;
    pickupLocation: Location;
    dropoffLocation: Location;
    packageDetails: PackageDetails;
    deliveryWindow?: TimeWindow;
    specialInstructions?: string;
    codAmount?: number;
    parcelImages?: string[];
  }): Delivery {
    const now = new Date();
    const cod =
      props.codAmount && props.codAmount > 0
        ? CodInfo.pending(props.codAmount)
        : null;

    const delivery = new Delivery(
      props.id,
      props.trackingNumber,
      props.sender,
      props.recipient,
      props.pickupLocation,
      props.dropoffLocation,
      props.packageDetails,
      props.deliveryWindow ?? null,
      props.specialInstructions ?? null,
      cod,
      DeliveryStatus.CREATED,
      null,
      null,
      null,
      [],
      [],
      null,
      props.parcelImages ?? [],
      [],
      now,
      now,
    );
    delivery.recordTimeline(DeliveryStatus.CREATED);
    return delivery;
  }

  static reconstitute(props: {
    id: string;
    trackingNumber: string;
    sender: User;
    recipient: Recipient;
    pickupLocation: Location;
    dropoffLocation: Location;
    packageDetails: PackageDetails;
    deliveryWindow: TimeWindow | null;
    specialInstructions: string | null;
    codInfo: CodInfo | null;
    status: DeliveryStatus;
    currentTripId: string | null;
    proofOfPickup: ProofOfPickup | null;
    proofOfDelivery: ProofOfDelivery | null;
    attempts: DeliveryAttempt[];
    timeline: TimelineEntry[];
    cancellationReason: string | null;
    parcelImages: string[];
    pickupImages: string[];
    createdAt: Date;
    updatedAt: Date;
  }): Delivery {
    return new Delivery(
      props.id, props.trackingNumber, props.sender, props.recipient,
      props.pickupLocation, props.dropoffLocation, props.packageDetails,
      props.deliveryWindow, props.specialInstructions, props.codInfo,
      props.status, props.currentTripId, props.proofOfPickup, props.proofOfDelivery,
      props.attempts, props.timeline, props.cancellationReason,
      props.parcelImages, props.pickupImages,
      props.createdAt, props.updatedAt,
    );
  }

  // ── Trip assignment ────────────────────────────────────
  assignToTrip(tripId: string): void {
    if (
      this.status !== DeliveryStatus.CREATED &&
      this.status !== DeliveryStatus.FAILED_DELIVERY
    ) {
      throw new Error(`Cannot assign delivery in ${this.status} state`);
    }
    this.currentTripId = tripId;
    this.status = DeliveryStatus.ASSIGNED;
    this.recordTimeline(DeliveryStatus.ASSIGNED);
  }

  unassignFromTrip(): void {
    if (this.status !== DeliveryStatus.ASSIGNED) {
      throw new Error('Only ASSIGNED deliveries can be unassigned');
    }
    this.currentTripId = null;
    this.status = DeliveryStatus.CREATED;
    this.recordTimeline(DeliveryStatus.CREATED);
  }

  // ── Pickup ──────────────────────────────────────────────
  recordPickup(proof: ProofOfPickup): void {
    if (this.status !== DeliveryStatus.ASSIGNED) {
      throw new Error('Delivery must be ASSIGNED before pickup');
    }
    this.proofOfPickup = proof;
    this.status = DeliveryStatus.PICKED_UP;
    this.recordTimeline(DeliveryStatus.PICKED_UP);
  }

  // ── Pickup-condition photos (captured by rider right after accepting) ──
  addPickupImages(imageUrls: string[]): void {
    const urls = imageUrls.filter(u => u?.trim());
    if (urls.length === 0) throw new Error('At least one image URL is required');
    if (this.isCompleted()) throw new Error(`Cannot add pickup images to a ${this.status} delivery`);
    this.pickupImages.push(...urls);
    this.touch();
  }

  markInTransit(): void {
    if (this.status !== DeliveryStatus.PICKED_UP) {
      throw new Error('Only PICKED_UP deliveries can be marked IN_TRANSIT');
    }
    this.status = DeliveryStatus.IN_TRANSIT;
    this.recordTimeline(DeliveryStatus.IN_TRANSIT);
  }

  markOutForDelivery(): void {
    if (
      this.status !== DeliveryStatus.IN_TRANSIT &&
      this.status !== DeliveryStatus.PICKED_UP
    ) {
      throw new Error('Delivery must be in transit to go out for delivery');
    }
    this.status = DeliveryStatus.OUT_FOR_DELIVERY;
    this.recordTimeline(DeliveryStatus.OUT_FOR_DELIVERY);
  }

  // ── Delivery outcomes ──────────────────────────────────
  recordSuccessfulDelivery(proof: ProofOfDelivery, riderId: string): void {
    if (
      this.status !== DeliveryStatus.OUT_FOR_DELIVERY &&
      this.status !== DeliveryStatus.IN_TRANSIT
    ) {
      throw new Error("Cannot complete a delivery that isn't in transit");
    }
    this.proofOfDelivery = proof;
    this.attempts.push(DeliveryAttempt.success(riderId, new Date()));
    this.status = DeliveryStatus.DELIVERED;
    this.recordTimeline(DeliveryStatus.DELIVERED);
  }

  recordFailedAttempt(
    riderId: string,
    reason: FailureReason,
    notes?: string,
  ): void {
    if (
      this.status !== DeliveryStatus.OUT_FOR_DELIVERY &&
      this.status !== DeliveryStatus.IN_TRANSIT
    ) {
      throw new Error('Can only record failure during active delivery');
    }
    this.attempts.push(
      DeliveryAttempt.failed(riderId, new Date(), reason, notes),
    );
    this.status = DeliveryStatus.FAILED_DELIVERY;
    this.currentTripId = null;
    this.recordTimeline(DeliveryStatus.FAILED_DELIVERY);
  }

  // ── COD handling ───────────────────────────────────────
  collectCod(): void {
    if (!this.codInfo) throw new Error('This delivery has no COD');
    if (this.status !== DeliveryStatus.DELIVERED) {
      throw new Error('COD can only be collected on successful delivery');
    }
    this.codInfo = this.codInfo.collect();
    this.touch();
  }

  remitCod(): void {
    if (!this.codInfo) throw new Error('This delivery has no COD');
    this.codInfo = this.codInfo.remit();
    this.touch();
  }

  // ── Terminal flows ─────────────────────────────────────
  returnToSender(reason: string): void {
    if (
      this.status === DeliveryStatus.DELIVERED ||
      this.status === DeliveryStatus.RETURNED ||
      this.status === DeliveryStatus.CANCELLED
    ) {
      throw new Error(`Cannot return a ${this.status} delivery`);
    }
    if (!reason?.trim()) throw new Error('Return reason is required');
    this.status = DeliveryStatus.RETURNED;
    this.cancellationReason = reason;
    this.recordTimeline(DeliveryStatus.RETURNED);
  }

  cancel(reason: string): void {
    if (
      this.status === DeliveryStatus.DELIVERED ||
      this.status === DeliveryStatus.CANCELLED
    ) {
      throw new Error(`Cannot cancel a ${this.status} delivery`);
    }
    if (!reason?.trim()) throw new Error('Cancellation reason is required');
    this.status = DeliveryStatus.CANCELLED;
    this.cancellationReason = reason;
    this.recordTimeline(DeliveryStatus.CANCELLED);
  }

  // ── Instance queries ──────────────────────────────────
  getAttemptCount(): number { return this.attempts.length; }

  isCompleted(): boolean {
    return (
      this.status === DeliveryStatus.DELIVERED ||
      this.status === DeliveryStatus.RETURNED ||
      this.status === DeliveryStatus.CANCELLED
    );
  }

  hasOutstandingCod(): boolean {
    return this.codInfo?.isPending() ?? false;
  }

  canBeRetried(): boolean {
    return this.status === DeliveryStatus.FAILED_DELIVERY;
  }

  // ── Internal ──────────────────────────────────────────
  private recordTimeline(status: DeliveryStatus): void {
    this.timeline.push(TimelineEntry.create(status));
    this.touch();
  }

  private touch(): void { this.updatedAt = new Date(); }

  // ── Getters ─────────────────────────────────────────────
  getId(): string { return this.id; }
  getTrackingNumber(): string { return this.trackingNumber; }
  getSender(): User { return this.sender; }
  getRecipient(): Recipient { return this.recipient; }
  getPickupLocation(): Location { return this.pickupLocation; }
  getDropoffLocation(): Location { return this.dropoffLocation; }
  getPackageDetails(): PackageDetails { return this.packageDetails; }
  getDeliveryWindow(): TimeWindow | null { return this.deliveryWindow; }
  getSpecialInstructions(): string | null { return this.specialInstructions; }
  getCodInfo(): CodInfo | null { return this.codInfo; }
  getStatus(): DeliveryStatus { return this.status; }
  getCurrentTripId(): string | null { return this.currentTripId; }
  getProofOfPickup(): ProofOfPickup | null { return this.proofOfPickup; }
  getProofOfDelivery(): ProofOfDelivery | null { return this.proofOfDelivery; }
  getAttempts(): DeliveryAttempt[] { return [...this.attempts]; }
  getTimeline(): TimelineEntry[] { return [...this.timeline]; }
  getCancellationReason(): string | null { return this.cancellationReason; }
  getParcelImages(): string[] { return [...this.parcelImages]; }
  getPickupImages(): string[] { return [...this.pickupImages]; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
}
