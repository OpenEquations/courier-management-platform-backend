import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { DeliveryStatus } from 'src/domain/delivery/enums/delivery-status.enum';
import { CodStatus } from 'src/domain/delivery/enums/cod-status.enum';
import { ProofType } from 'src/domain/delivery/enums/proof-type.enum';
import { FailureReason } from 'src/domain/delivery/enums/failure-reason.enum';

export interface SenderData {
  id: string; name: string; phone: string; email: string;
}

export interface RecipientData {
  name: string; phone: string; email: string | null;
}

export interface LocationData {
  lat: number; lng: number; address: string;
}

export interface PackageDetailsData {
  description: string; weightKg: number;
  lengthCm: number | null; widthCm: number | null; heightCm: number | null;
  isFragile: boolean;
}

export interface TimeWindowData {
  from: string; to: string;
}

export interface CodInfoData {
  amount: number; status: CodStatus;
  collectedAt: string | null; remittedAt: string | null;
}

export interface ProofOfPickupData {
  type: ProofType; fileUrl: string | null;
  capturedAt: string; capturedByRiderId: string;
}

export interface ProofOfDeliveryData {
  type: ProofType; fileUrl: string | null;
  capturedAt: string; capturedByRiderId: string; deliveredTo: string;
}

export interface DeliveryAttemptData {
  riderId: string; attemptedAt: string; successful: boolean;
  failureReason: FailureReason | null; notes: string | null;
}

export interface TimelineEntryData {
  status: DeliveryStatus; timestamp: string;
}

@Entity('deliveries')
export class DeliveryOrmEntity {
  @PrimaryColumn()
  id!: string;

  @Column({ unique: true })
  trackingNumber!: string;

  @Column('jsonb')
  sender!: SenderData;

  @Column('jsonb')
  recipient!: RecipientData;

  @Column('jsonb')
  pickupLocation!: LocationData;

  @Column('jsonb')
  dropoffLocation!: LocationData;

  @Column('jsonb')
  packageDetails!: PackageDetailsData;

  @Column('jsonb', { nullable: true })
  deliveryWindow!: TimeWindowData | null;

  @Column({ type: 'varchar', nullable: true })
  specialInstructions!: string | null;

  @Column('jsonb', { nullable: true })
  codInfo!: CodInfoData | null;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.CREATED })
  status!: DeliveryStatus;

  @Column({ type: 'varchar', nullable: true })
  currentTripId!: string | null;

  @Column('jsonb', { nullable: true })
  proofOfPickup!: ProofOfPickupData | null;

  @Column('jsonb', { nullable: true })
  proofOfDelivery!: ProofOfDeliveryData | null;

  @Column('jsonb', { default: '[]' })
  attempts!: DeliveryAttemptData[];

  @Column('jsonb', { default: '[]' })
  timeline!: TimelineEntryData[];

  @Column({ type: 'varchar', nullable: true })
  cancellationReason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
